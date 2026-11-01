import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Tournament,
  MatchFixture,
  BallEvent,
  PointsTableEntry,
  TossDecision,
} from '../cricketTypes';

interface CricketContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentMatch: MatchFixture | null;
  standings: {
    pointsTable: PointsTableEntry[];
    topBatters: { id: string; name: string; teamCode: string; runs: number; strikeRate: number; sixes: number }[];
    topBowlers: { id: string; name: string; teamCode: string; wickets: number; economy: number }[];
  } | null;
  isLoading: boolean;
  isConnected: boolean;
  sunlightMode: boolean;
  toggleSunlightMode: () => void;
  loadTournaments: () => Promise<void>;
  selectTournament: (id: string) => Promise<void>;
  selectMatch: (id: string) => Promise<void>;
  recordBall: (ball: Partial<BallEvent>) => Promise<boolean>;
  undoLastBall: () => Promise<boolean>;
  editBall: (ballId: string, updatedBall: Partial<BallEvent>) => Promise<boolean>;
  updateToss: (winnerTeamId: string, decision: TossDecision) => Promise<boolean>;
  startInnings: (inningsNumber: number, strikerId: string, nonStrikerId: string, bowlerId: string) => Promise<boolean>;
  createTournament: (tournament: Tournament) => Promise<boolean>;
}

const CricketContext = createContext<CricketContextType | null>(null);

export const CricketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchFixture | null>(null);
  const [standings, setStandings] = useState<CricketContextType['standings']>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sunlightMode, setSunlightMode] = useState<boolean>(() => {
    return localStorage.getItem('cricket_sunlight_mode') === 'true';
  });

  const toggleSunlightMode = () => {
    setSunlightMode((prev) => {
      const next = !prev;
      localStorage.setItem('cricket_sunlight_mode', String(next));
      return next;
    });
  };

  // Socket initialization
  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (currentMatch) {
        s.emit('match:join', { matchId: currentMatch.id });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('match:update', (updatedMatch: MatchFixture) => {
      setCurrentMatch((prev) => (prev?.id === updatedMatch.id ? updatedMatch : prev));
      // Also update inside tournament fixtures
      setCurrentTournament((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fixtures: prev.fixtures.map((f) => (f.id === updatedMatch.id ? updatedMatch : f)),
        };
      });
    });

    s.on('tournaments:update', () => {
      loadTournaments();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/cricket/tournaments');
      if (res.ok) {
        const data: Tournament[] = await res.json();
        setTournaments(data);
        if (data.length > 0 && !currentTournament) {
          setCurrentTournament(data[0]);
          if (data[0].fixtures.length > 0 && !currentMatch) {
            setCurrentMatch(data[0].fixtures[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load tournaments:', e);
    }
  }, [currentTournament, currentMatch]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const selectTournament = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cricket/tournaments/${id}`);
      if (res.ok) {
        const data: Tournament = await res.json();
        setCurrentTournament(data);

        // Fetch standings
        const stdRes = await fetch(`/api/cricket/tournaments/${id}/standings`);
        if (stdRes.ok) {
          const stdData = await stdRes.json();
          setStandings(stdData);
        }
      }
    } catch (e) {
      console.error('Failed to select tournament:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectMatch = async (id: string) => {
    setIsLoading(true);
    try {
      if (socket && currentMatch) {
        socket.emit('match:leave', { matchId: currentMatch.id });
      }

      const res = await fetch(`/api/cricket/matches/${id}`);
      if (res.ok) {
        const match: MatchFixture = await res.json();
        setCurrentMatch(match);
        if (socket) {
          socket.emit('match:join', { matchId: match.id });
        }
      }
    } catch (e) {
      console.error('Failed to select match:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const recordBall = async (ball: Partial<BallEvent>): Promise<boolean> => {
    if (!currentMatch) return false;
    try {
      return new Promise((resolve) => {
        if (socket && socket.connected) {
          socket.emit(
            'scorer:record_ball',
            { matchId: currentMatch.id, ball },
            (res: { success: boolean; match?: MatchFixture }) => {
              if (res.success && res.match) {
                setCurrentMatch(res.match);
                resolve(true);
              } else {
                resolve(false);
              }
            }
          );
        } else {
          // REST Fallback
          fetch(`/api/cricket/matches/${currentMatch.id}/ball`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ball),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.match) {
                setCurrentMatch(res.match);
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch(() => resolve(false));
        }
      });
    } catch (e) {
      console.error('Error recording ball:', e);
      return false;
    }
  };

  const undoLastBall = async (): Promise<boolean> => {
    if (!currentMatch) return false;
    try {
      return new Promise((resolve) => {
        if (socket && socket.connected) {
          socket.emit('scorer:undo_ball', { matchId: currentMatch.id }, (res: { success: boolean; match?: MatchFixture }) => {
            if (res.success && res.match) {
              setCurrentMatch(res.match);
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          fetch(`/api/cricket/matches/${currentMatch.id}/undo`, { method: 'POST' })
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.match) {
                setCurrentMatch(res.match);
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch(() => resolve(false));
        }
      });
    } catch (e) {
      console.error('Error undoing ball:', e);
      return false;
    }
  };

  const editBall = async (ballId: string, updatedBall: Partial<BallEvent>): Promise<boolean> => {
    if (!currentMatch) return false;
    try {
      const res = await fetch(`/api/cricket/matches/${currentMatch.id}/edit-ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ballId, updatedBall }),
      });
      const data = await res.json();
      if (data.success && data.match) {
        setCurrentMatch(data.match);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error editing ball:', e);
      return false;
    }
  };

  const updateToss = async (winnerTeamId: string, decision: TossDecision): Promise<boolean> => {
    if (!currentMatch) return false;
    try {
      const res = await fetch(`/api/cricket/matches/${currentMatch.id}/toss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerTeamId, decision }),
      });
      const data = await res.json();
      if (data.success && data.match) {
        setCurrentMatch(data.match);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating toss:', e);
      return false;
    }
  };

  const startInnings = async (
    inningsNumber: number,
    strikerId: string,
    nonStrikerId: string,
    bowlerId: string
  ): Promise<boolean> => {
    if (!currentMatch) return false;
    try {
      const res = await fetch(`/api/cricket/matches/${currentMatch.id}/start-innings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inningsNumber, strikerId, nonStrikerId, bowlerId }),
      });
      const data = await res.json();
      if (data.success && data.match) {
        setCurrentMatch(data.match);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error starting innings:', e);
      return false;
    }
  };

  const createTournament = async (tournament: Tournament): Promise<boolean> => {
    try {
      const res = await fetch('/api/cricket/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournament),
      });
      if (res.ok) {
        await loadTournaments();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error creating tournament:', e);
      return false;
    }
  };

  return (
    <CricketContext.Provider
      value={{
        tournaments,
        currentTournament,
        currentMatch,
        standings,
        isLoading,
        isConnected,
        sunlightMode,
        toggleSunlightMode,
        loadTournaments,
        selectTournament,
        selectMatch,
        recordBall,
        undoLastBall,
        editBall,
        updateToss,
        startInnings,
        createTournament,
      }}
    >
      {children}
    </CricketContext.Provider>
  );
};

export const useCricket = () => {
  const ctx = useContext(CricketContext);
  if (!ctx) throw new Error('useCricket must be used within CricketProvider');
  return ctx;
};
