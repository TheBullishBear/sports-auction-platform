import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  LiveStateSnapshot,
  BidLedgerEntry,
  Team,
  Player,
} from '../types';

interface AuctionContextType {
  snapshot: LiveStateSnapshot | null;
  isConnected: boolean;
  activeTeamId: string;
  setActiveTeamId: (id: string) => void;
  lastLatencyMs: number | null;
  hammerNotification: { phase: string; message: string } | null;
  // Actions
  placeBid: (
    playerId: string,
    teamId: string,
    amount: number
  ) => Promise<{ success: boolean; reason?: string; latencyMs?: number }>;
  selectPlayer: (playerId: string) => Promise<{ success: boolean; message: string }>;
  startBidding: (timerSeconds?: number) => Promise<{ success: boolean; message: string }>;
  hammerStrike: (
    action: 'GOING_1' | 'GOING_2' | 'SOLD' | 'UNSOLD'
  ) => Promise<{ success: boolean; message: string }>;
  togglePause: () => Promise<{ success: boolean }>;
  resetAuction: () => Promise<{ success: boolean }>;
  updateTeam: (
    teamId: string,
    updates: { name?: string; code?: string; logo?: string; totalPurse?: number; maxSlots?: number }
  ) => Promise<{ success: boolean; message: string }>;
  addNewTeam: (
    data: {
      name: string;
      code?: string;
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      totalPurse?: number;
      maxSlots?: number;
    }
  ) => Promise<{ success: boolean; message: string; team?: Team }>;
  deleteTeam: (teamId: string) => Promise<{ success: boolean; message: string }>;
  updatePlayer: (
    playerId: string,
    updates: { name?: string; role?: any; basePrice?: number; country?: string }
  ) => Promise<{ success: boolean; message: string }>;
  addNewPlayer: (
    data: {
      name: string;
      age?: number;
      contactNumber?: string;
      email?: string;
      city?: string;
      role: any;
      country?: string;
      isOverseas?: boolean;
      basePrice: number;
      avatarUrl?: string;
      stats?: any;
    }
  ) => Promise<{ success: boolean; message: string; player?: Player }>;
  deletePlayer: (playerId: string) => Promise<{ success: boolean; message: string }>;
  setCommonMinBasePrice: (
    amount: number,
    applyToAll?: boolean
  ) => Promise<{ success: boolean; message: string; minBasePrice: number; affectedCount: number }>;
  setMaxPursePerTeam: (
    amount: number,
    applyToAll?: boolean
  ) => Promise<{ success: boolean; message: string; maxPursePerTeam: number; affectedCount: number }>;
  setTotalPlayersPerTeam: (
    slots: number,
    applyToAll?: boolean
  ) => Promise<{ success: boolean; message: string; totalPlayersPerTeam: number; affectedCount: number }>;
  formatCurrency: (amount: number) => string;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminPreviewAsPlayer: boolean;
  setAdminPreviewAsPlayer: React.Dispatch<React.SetStateAction<boolean>>;
  isEffectiveAdmin: boolean;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

// Web Audio API synthesizers for instant sound cues with 0 asset latency
class AudioEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // High ping tone for valid bids
  playBidBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Wooden gavel strike resonance for hammer calls
  playGavelStrike() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  }

  // Celebratory fanfare for SOLD
  playSoldFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

const audioEffects = new AudioEffects();

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<LiveStateSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTeamId, setActiveTeamId] = useState<string>('team-mi');
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [hammerNotification, setHammerNotification] = useState<{
    phase: string;
    message: string;
  } | null>(null);

  // Admin authentication & preview state
  const [isAdmin, setIsAdminState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('auctioneer_authenticated') === 'true';
  });
  const [adminPreviewAsPlayer, setAdminPreviewAsPlayer] = useState<boolean>(false);

  const setIsAdmin = useCallback((val: boolean) => {
    setIsAdminState(val);
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('auctioneer_authenticated', 'true');
      } else {
        sessionStorage.removeItem('auctioneer_authenticated');
      }
    }
  }, []);

  const isEffectiveAdmin = isAdmin && !adminPreviewAsPlayer;

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend (using proxy, dynamic hostname on LAN, or same-origin on port 4000)
    const backendUrl = window.location.port === '5173'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : '/';
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('auction:state_update', (newSnapshot: LiveStateSnapshot) => {
      setSnapshot(newSnapshot);
      if (newSnapshot.teams && newSnapshot.teams.length > 0) {
        setActiveTeamId((prev) => {
          const exists = newSnapshot.teams.some((t) => t.id === prev);
          return exists ? prev : newSnapshot.teams[0].id;
        });
      }
    });

    socket.on('bid:accepted', (payload: { bid: BidLedgerEntry; snapshot: LiveStateSnapshot }) => {
      setSnapshot(payload.snapshot);
      audioEffects.playBidBeep();
    });

    socket.on(
      'hammer:tick',
      (payload: { phase: string; message: string; timestamp: number }) => {
        setHammerNotification({ phase: payload.phase, message: payload.message });
        audioEffects.playGavelStrike();

        if (payload.phase === 'SOLD') {
          audioEffects.playSoldFanfare();
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#fbbf24', '#38bdf8', '#10b981', '#f43f5e'],
            });
          } catch {
            // Confetti optional
          }
        }

        setTimeout(() => {
          setHammerNotification(null);
        }, 4000);
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // Format INR Currency nicely (₹ Crores & Lakhs)
  const formatCurrency = useCallback((amount: number): string => {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr.toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      const lk = amount / 100000;
      return `₹${lk.toFixed(2)} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }, []);

  const placeBid = useCallback(
    async (playerId: string, teamId: string, amount: number) => {
      if (!socketRef.current) return { success: false, reason: 'Socket not connected' };
      const start = performance.now();

      return new Promise<{ success: boolean; reason?: string; latencyMs?: number }>((resolve) => {
        socketRef.current?.emit(
          'franchise:place_bid',
          { playerId, teamId, bidAmount: amount },
          (response: any) => {
            const clientLatency = Math.round(performance.now() - start);
            setLastLatencyMs(clientLatency);
            resolve({ ...response, latencyMs: clientLatency });
          }
        );
      });
    },
    []
  );

  const selectPlayer = useCallback(async (playerId: string) => {
    if (!socketRef.current) return { success: false, message: 'Socket not connected' };
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      socketRef.current?.emit('auctioneer:select_player', { playerId }, resolve);
    });
  }, []);

  const startBidding = useCallback(async (timerSeconds: number = 20) => {
    if (!socketRef.current) return { success: false, message: 'Socket not connected' };
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      socketRef.current?.emit('auctioneer:start_bidding', { timerSeconds }, resolve);
    });
  }, []);

  const hammerStrike = useCallback(
    async (action: 'GOING_1' | 'GOING_2' | 'SOLD' | 'UNSOLD') => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        socketRef.current?.emit('auctioneer:hammer_strike', { action }, resolve);
      });
    },
    []
  );

  const togglePause = useCallback(async () => {
    if (!socketRef.current) return { success: false };
    return new Promise<{ success: boolean }>((resolve) => {
      socketRef.current?.emit('auctioneer:toggle_pause', {}, resolve);
    });
  }, []);

  const resetAuction = useCallback(async () => {
    if (!socketRef.current) return { success: false };
    return new Promise<{ success: boolean }>((resolve) => {
      socketRef.current?.emit('auctioneer:reset', {}, resolve);
    });
  }, []);

  const updateTeam = useCallback(
    async (
      teamId: string,
      updates: { name?: string; code?: string; logo?: string; totalPurse?: number; maxSlots?: number }
    ) => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        socketRef.current?.emit(
          'auctioneer:update_team',
          { teamId, ...updates },
          resolve
        );
      });
    },
    []
  );

  const addNewTeam = useCallback(
    async (data: {
      name: string;
      code?: string;
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      totalPurse?: number;
      maxSlots?: number;
    }) => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string; team?: Team }>((resolve) => {
        socketRef.current?.emit('auctioneer:add_team', data, resolve);
      });
    },
    []
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        socketRef.current?.emit('auctioneer:delete_team', { teamId }, resolve);
      });
    },
    []
  );

  const updatePlayer = useCallback(
    async (
      playerId: string,
      updates: { name?: string; role?: any; basePrice?: number; country?: string }
    ) => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        socketRef.current?.emit(
          'auctioneer:update_player',
          { playerId, ...updates },
          resolve
        );
      });
    },
    []
  );

  const addNewPlayer = useCallback(
    async (data: {
      name: string;
      age?: number;
      contactNumber?: string;
      email?: string;
      city?: string;
      role: any;
      country?: string;
      isOverseas?: boolean;
      basePrice: number;
      avatarUrl?: string;
      stats?: any;
    }) => {
      if (!socketRef.current) return { success: false, message: 'Socket not connected' };
      return new Promise<{ success: boolean; message: string; player?: Player }>((resolve) => {
        socketRef.current?.emit('auctioneer:add_player', data, resolve);
      });
    },
    []
  );

  const deletePlayer = useCallback(
    async (playerId: string) => {
      if (!socketRef.current) {
        return { success: false, message: 'Socket not connected' };
      }
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        socketRef.current?.emit('auctioneer:delete_player', { playerId }, resolve);
      });
    },
    []
  );

  const setCommonMinBasePrice = useCallback(
    async (amount: number, applyToAll: boolean = true) => {
      if (!socketRef.current) {
        return { success: false, message: 'Socket not connected', minBasePrice: 0, affectedCount: 0 };
      }
      return new Promise<{
        success: boolean;
        message: string;
        minBasePrice: number;
        affectedCount: number;
      }>((resolve) => {
        socketRef.current?.emit('auctioneer:set_min_base_price', { amount, applyToAll }, resolve);
      });
    },
    []
  );

  const setMaxPursePerTeam = useCallback(
    async (amount: number, applyToAll: boolean = true) => {
      if (!socketRef.current) {
        return { success: false, message: 'Socket not connected', maxPursePerTeam: 0, affectedCount: 0 };
      }
      return new Promise<{
        success: boolean;
        message: string;
        maxPursePerTeam: number;
        affectedCount: number;
      }>((resolve) => {
        socketRef.current?.emit('auctioneer:set_max_purse', { amount, applyToAll }, resolve);
      });
    },
    []
  );

  const setTotalPlayersPerTeam = useCallback(
    async (slots: number, applyToAll: boolean = true) => {
      if (!socketRef.current) {
        return { success: false, message: 'Socket not connected', totalPlayersPerTeam: 0, affectedCount: 0 };
      }
      return new Promise<{
        success: boolean;
        message: string;
        totalPlayersPerTeam: number;
        affectedCount: number;
      }>((resolve) => {
        socketRef.current?.emit('auctioneer:set_total_players', { slots, applyToAll }, resolve);
      });
    },
    []
  );

  return (
    <AuctionContext.Provider
      value={{
        snapshot,
        isConnected,
        activeTeamId,
        setActiveTeamId,
        lastLatencyMs,
        hammerNotification,
        placeBid,
        selectPlayer,
        startBidding,
        hammerStrike,
        togglePause,
        resetAuction,
        updateTeam,
        addNewTeam,
        deleteTeam,
        updatePlayer,
        addNewPlayer,
        deletePlayer,
        setCommonMinBasePrice,
        setMaxPursePerTeam,
        setTotalPlayersPerTeam,
        formatCurrency,
        isAdmin,
        setIsAdmin,
        adminPreviewAsPlayer,
        setAdminPreviewAsPlayer,
        isEffectiveAdmin,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
