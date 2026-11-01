import React, { useState } from 'react';
import {
  Gavel,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ChevronRight,
  KeyRound,
  Lock,
  LogOut,
  Sparkles,
  Edit3,
  Save,
  X,
  Users,
  Check,
  Upload,
  Image as ImageIcon,
  UserPlus,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Plane,
  Tag,
  Sliders,
  Wallet,
  Coins,
  Database,
  Share2,
  Trash2,
  Trophy,
  Flame,
  Radio,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { Player, Team } from '../types';
import { PlayerHeroCard } from '../components/PlayerHeroCard';
import { CountdownTimer } from '../components/CountdownTimer';
import { BiddingTicker } from '../components/BiddingTicker';

const MASTER_AUCTIONEER_KEY = 'AUCTIONEER2026';

export const AdminConsole: React.FC = () => {
  const {
    snapshot,
    selectPlayer,
    startBidding,
    hammerStrike,
    togglePause,
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
    setIsAdmin,
  } = useAuction();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('auctioneer_authenticated') === 'true';
  });
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Common Minimum Base Price State
  const defaultFloor = snapshot?.session.minBasePrice || 20000000;
  const [commonBasePriceInput, setCommonBasePriceInput] = useState<number>(defaultFloor);
  const [applyFloorToAll, setApplyFloorToAll] = useState<boolean>(true);
  const [isApplyingBasePrice, setIsApplyingBasePrice] = useState<boolean>(false);
  const [isMinPriceModalOpen, setIsMinPriceModalOpen] = useState<boolean>(false);

  // Maximum Purse Balance State
  const defaultMaxPurse = snapshot?.session.maxPursePerTeam || 1000000000;
  const [maxPurseInput, setMaxPurseInput] = useState<number>(defaultMaxPurse);
  const [applyPurseToAll, setApplyPurseToAll] = useState<boolean>(true);
  const [isApplyingPurse, setIsApplyingPurse] = useState<boolean>(false);
  const [isMaxPurseModalOpen, setIsMaxPurseModalOpen] = useState<boolean>(false);

  // Total Players Per Team State
  const defaultTotalPlayers = snapshot?.session.totalPlayersPerTeam || 11;
  const [totalPlayersInput, setTotalPlayersInput] = useState<number>(defaultTotalPlayers);
  const [applyPlayersToAll, setApplyPlayersToAll] = useState<boolean>(true);
  const [isApplyingTotalPlayers, setIsApplyingTotalPlayers] = useState<boolean>(false);
  const [isTotalPlayersModalOpen, setIsTotalPlayersModalOpen] = useState<boolean>(false);

  // Editing Teams & Players State
  const [isEditingTeams, setIsEditingTeams] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Add New Team State
  const [isAddingTeam, setIsAddingTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamCode, setNewTeamCode] = useState<string>('');
  const [newTeamLogo, setNewTeamLogo] = useState<string>('');
  const [newTeamColor, setNewTeamColor] = useState<string>('#0284c7');
  const [newTeamPurse, setNewTeamPurse] = useState<number>(defaultMaxPurse);
  const [newTeamSlots, setNewTeamSlots] = useState<number>(defaultTotalPlayers);

  // Add New Player State
  const [isAddingPlayer, setIsAddingPlayer] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerRole, setNewPlayerRole] = useState<'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper'>('Batter');
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState<number>(20000000);
  const [newPlayerAvatarUrl, setNewPlayerAvatarUrl] = useState<string>('');

  // Player Catalogue Search & Filters
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState<string>('ALL');
  const [playerStatusFilter, setPlayerStatusFilter] = useState<'ALL' | 'UPCOMING' | 'SOLD' | 'UNSOLD'>('ALL');
  const [playerViewMode, setPlayerViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [copiedRegLink, setCopiedRegLink] = useState<boolean>(false);

  const handleCopyRegistrationLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#register` : 'http://localhost:4000/#register';
    navigator.clipboard.writeText(url);
    setCopiedRegLink(true);
    setTimeout(() => setCopiedRegLink(false), 2500);
  };

  // Edit Player Form
  const [playerName, setPlayerName] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<string>('Batter');
  const [playerCountry, setPlayerCountry] = useState<string>('');
  const [playerBasePrice, setPlayerBasePrice] = useState<number>(20000000);

  // Edit Teams Form
  const [teamsState, setTeamsState] = useState<{
    [id: string]: { name: string; code: string; logo: string; totalPurse: number; maxSlots: number };
  }>({});
  const [savedTeamId, setSavedTeamId] = useState<string | null>(null);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim().toUpperCase() === MASTER_AUCTIONEER_KEY || passcode.trim() === 'admin') {
      sessionStorage.setItem('auctioneer_authenticated', 'true');
      setIsAuthenticated(true);
      setIsAdmin(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid Auctioneer Passcode. Please enter the authorized master key.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auctioneer_authenticated');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setPasscode('');
  };

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
          <p>Connecting to Real-Time Auction Engine...</p>
        </div>
      </div>
    );
  }

  // Secure Authentication Gate Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Ambient Gold Glow */}
          <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-display font-black text-2xl text-white tracking-wide">
              AUCTIONEER SECURITY CHECKPOINT
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized access only. Drop hammer, adjust timers, and control the bidding floor.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Auctioneer Key / PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder="Enter Master Passcode..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-300 text-xs font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4 fill-slate-950" />
              <span>Verify & Access Console</span>
            </button>

            {/* Quick One-Click Demo Key Helper */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 mb-2">Tournament Demo Credentials:</p>
              <button
                type="button"
                onClick={() => {
                  setPasscode(MASTER_AUCTIONEER_KEY);
                  setAuthError(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-bold transition-all hover:border-amber-500/50"
              >
                <span>Key: {MASTER_AUCTIONEER_KEY}</span>
                <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-500/20 rounded text-amber-300 font-sans">
                  Click to Auto-Fill
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const { session, currentPlayer, currentHighBid, bidHistory, playersQueue, teams } = snapshot;
  const highBidderTeam = teams.find((t) => t.id === currentPlayer?.currentHighBidderId) || null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleSelectPlayer = async (playerId: string) => {
    const res = await selectPlayer(playerId);
    showFeedback(res.message);
  };

  const handleStartBidding = async () => {
    const res = await startBidding();
    showFeedback(res.message);
  };

  const handleHammerStrike = async (action: 'GOING_1' | 'GOING_2' | 'SOLD' | 'UNSOLD') => {
    const res = await hammerStrike(action);
    showFeedback(res.message);
  };

  const handleTogglePause = async () => {
    await togglePause();
    showFeedback(session.isPaused ? 'Auction Resumed' : 'Auction Paused');
  };

  const openEditTeamsModal = () => {
    const initial: { [id: string]: { name: string; code: string; logo: string; totalPurse: number; maxSlots: number } } = {};
    teams.forEach((t) => {
      initial[t.id] = { name: t.name, code: t.code, logo: t.logo || '', totalPurse: t.totalPurse, maxSlots: t.maxSlots };
    });
    setTeamsState(initial);
    setIsEditingTeams(true);
  };

  const handleSaveTeam = async (teamId: string) => {
    const data = teamsState[teamId];
    if (!data || !data.name.trim()) return;
    const res = await updateTeam(teamId, {
      name: data.name,
      code: data.code,
      logo: data.logo,
      totalPurse: data.totalPurse,
      maxSlots: data.maxSlots,
    });
    setSavedTeamId(teamId);
    showFeedback(res.message);
    setTimeout(() => setSavedTeamId(null), 2500);
  };

  const handleFileUpload = (teamId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setTeamsState((prev) => ({
          ...prev,
          [teamId]: { ...prev[teamId], logo: base64 },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (teams.length <= 1) {
      alert('Cannot delete the only remaining franchise team. At least 1 team must exist.');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete "${teamName}"? Any players acquired by this franchise will be released back to the auction pool.`
      )
    ) {
      const res = await deleteTeam(teamId);
      if (res.success) {
        setTeamsState((prev) => {
          const copy = { ...prev };
          delete copy[teamId];
          return copy;
        });
        showFeedback(`🗑️ ${teamName} deleted successfully.`);
      } else {
        alert(res.message || 'Failed to delete team');
      }
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      showFeedback('Please enter a franchise name');
      return;
    }

    const payload = {
      name: newTeamName.trim(),
      code: newTeamCode.trim().toUpperCase() || undefined,
      logo: newTeamLogo.trim() || undefined,
      primaryColor: newTeamColor,
      totalPurse: Number(newTeamPurse) || undefined,
      maxSlots: Number(newTeamSlots) || undefined,
    };

    const res = await addNewTeam(payload);
    if (res.success) {
      showFeedback(res.message);
      setIsAddingTeam(false);
      resetNewTeamForm();
    } else {
      alert(res.message || 'Failed to add team');
    }
  };

  const handleNewTeamLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setNewTeamLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetNewTeamForm = () => {
    setNewTeamName('');
    setNewTeamCode('');
    setNewTeamLogo('');
    setNewTeamColor('#0284c7');
    setNewTeamPurse(snapshot?.session.maxPursePerTeam || 1000000000);
    setNewTeamSlots(snapshot?.session.totalPlayersPerTeam || 11);
  };

  const openEditPlayerModal = (p: Player) => {
    setEditingPlayer(p);
    setPlayerName(p.name);
    setPlayerRole(p.role);
    setPlayerCountry(p.country);
    setPlayerBasePrice(p.basePrice);
  };

  const handleSavePlayer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingPlayer || !playerName.trim()) return;
    const res = await updatePlayer(editingPlayer.id, {
      name: playerName.trim(),
      role: playerRole,
      country: playerCountry.trim(),
      basePrice: Number(playerBasePrice),
    });
    showFeedback(res.message);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the auction pool? This will remove the player permanently.`)) {
      const res = await deletePlayer(id);
      if (res.success) {
        if (editingPlayer?.id === id) {
          setEditingPlayer(null);
        }
        showFeedback(`🗑️ ${name} deleted successfully.`);
      } else {
        alert(res.message || 'Failed to delete player');
      }
    }
  };

  const handlePlayerPhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setNewPlayerAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetNewPlayerForm = () => {
    setNewPlayerName('');
    setNewPlayerRole('Batter');
    setNewPlayerBasePrice(snapshot?.session.minBasePrice || 20000000);
    setNewPlayerAvatarUrl('');
  };

  const handleApplyCommonBasePrice = async (amount: number, applyToAll: boolean = true) => {
    setIsApplyingBasePrice(true);
    const res = await setCommonMinBasePrice(amount, applyToAll);
    setIsApplyingBasePrice(false);
    showFeedback(res.message);
    setIsMinPriceModalOpen(false);
  };

  const handleApplyMaxPurse = async (amount: number, applyToAll: boolean = true) => {
    setIsApplyingPurse(true);
    const res = await setMaxPursePerTeam(amount, applyToAll);
    setIsApplyingPurse(false);
    showFeedback(res.message);
    setIsMaxPurseModalOpen(false);
  };

  const handleApplyTotalPlayers = async (slots: number, applyToAll: boolean = true) => {
    setIsApplyingTotalPlayers(true);
    const res = await setTotalPlayersPerTeam(slots, applyToAll);
    setIsApplyingTotalPlayers(false);
    showFeedback(res.message);
    setIsTotalPlayersModalOpen(false);
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      showFeedback('Please enter a player name');
      return;
    }

    const payload = {
      name: newPlayerName.trim(),
      role: newPlayerRole,
      basePrice: Number(newPlayerBasePrice),
      avatarUrl: newPlayerAvatarUrl.trim() || undefined,
    };

    const res = await addNewPlayer(payload);
    if (res.success) {
      showFeedback(res.message);
      setIsAddingPlayer(false);
      resetNewPlayerForm();
    } else {
      showFeedback(res.message || 'Failed to add player');
    }
  };

  // Filtered players catalogue
  const filteredPlayers = playersQueue.filter((p) => {
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCountry = p.country.toLowerCase().includes(q);
      const matchRole = p.role.toLowerCase().includes(q);
      if (!matchName && !matchCountry && !matchRole) return false;
    }
    if (playerRoleFilter !== 'ALL' && p.role !== playerRoleFilter) {
      return false;
    }
    if (playerStatusFilter !== 'ALL') {
      if (playerStatusFilter === 'UPCOMING' && p.status !== 'UPCOMING') return false;
      if (playerStatusFilter === 'SOLD' && p.status !== 'SOLD') return false;
      if (playerStatusFilter === 'UNSOLD' && p.status !== 'UNSOLD') return false;
    }
    return true;
  });

  const isBiddingActive =
    session.status === 'BIDDING_ACTIVE' ||
    session.status === 'HAMMER_GOING_1' ||
    session.status === 'HAMMER_GOING_2' ||
    session.status === 'HAMMER_FINAL_CALL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white">
              AUCTIONEER COMMAND DESK
            </h1>
            <p className="text-xs text-amber-300 font-medium">
              Official Master Gavel Controls & Real-Time Roster Manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actionFeedback && (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-400 text-amber-300 text-xs font-semibold animate-pulse flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              {actionFeedback}
            </div>
          )}

          {/* Common Minimum Base Price Config Button */}
          <button
            onClick={() => {
              setCommonBasePriceInput(snapshot.session.minBasePrice || 20000000);
              setIsMinPriceModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            title="Set Common Minimum Base Price for All Players"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Min Base:</span>
            <span className="font-mono font-black text-white">
              {formatCurrency(snapshot.session.minBasePrice || 20000000)}
            </span>
          </button>

          {/* Maximum Purse Balance Config Button */}
          <button
            onClick={() => {
              setMaxPurseInput(snapshot.session.maxPursePerTeam || 1000000000);
              setIsMaxPurseModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            title="Set Maximum Purse Balance Per Team"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Max Purse:</span>
            <span className="font-mono font-black text-white">
              {formatCurrency(snapshot.session.maxPursePerTeam || 1000000000)}
            </span>
          </button>

          {/* Total Players per Team Config Button */}
          <button
            onClick={() => {
              setTotalPlayersInput(snapshot.session.totalPlayersPerTeam || 11);
              setIsTotalPlayersModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            title="Set Total Players / Squad Limit Per Team"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Squad Cap:</span>
            <span className="font-mono font-black text-white">
              {snapshot.session.totalPlayersPerTeam || 11}P
            </span>
          </button>

          {/* Add New Player Button */}
          <button
            onClick={() => {
              resetNewPlayerForm();
              setIsAddingPlayer(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Player</span>
          </button>

          {/* Quick Edit Teams Button */}
          <button
            onClick={openEditTeamsModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-blue-300 hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Edit Teams</span>
          </button>


          <button
            onClick={handleLogout}
            title="Lock Console / Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* Tournament Control Banners: Minimum Base Price, Maximum Purse & Total Players per Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Banner 1: Tournament Common Minimum Base Price */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm text-white">
                  Minimum Base Price
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-black">
                  {formatCurrency(snapshot.session.minBasePrice || 20000000)}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Floor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Unified reserve floor across all players in the pool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {[
                { label: '₹20 L', val: 2000000 },
                { label: '₹50 L', val: 5000000 },
                { label: '₹1.0 Cr', val: 10000000 },
                { label: '₹1.5 Cr', val: 15000000 },
                { label: '₹2.0 Cr', val: 20000000 },
              ].map((p) => {
                const isActive = (snapshot.session.minBasePrice || 20000000) === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleApplyCommonBasePrice(p.val, true)}
                    disabled={isApplyingBasePrice}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                    title={`Set Common Base Price to ${p.label} & apply to all players`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setCommonBasePriceInput(snapshot.session.minBasePrice || 20000000);
                setIsMinPriceModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom...</span>
            </button>
          </div>
        </div>

        {/* Banner 2: Tournament Maximum Purse Balance per Team */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm text-white">
                  Max Purse Balance
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-black">
                  {formatCurrency(snapshot.session.maxPursePerTeam || 1000000000)}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Per Team Cap
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maximum purse limit per franchise. Preserves spent funds.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {[
                { label: '₹80 Cr', val: 800000000 },
                { label: '₹90 Cr', val: 900000000 },
                { label: '₹100 Cr', val: 1000000000 },
                { label: '₹110 Cr', val: 1100000000 },
                { label: '₹120 Cr', val: 1200000000 },
              ].map((p) => {
                const isActive = (snapshot.session.maxPursePerTeam || 1000000000) === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleApplyMaxPurse(p.val, true)}
                    disabled={isApplyingPurse}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                    title={`Set Max Purse to ${p.label} & apply to all teams`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setMaxPurseInput(snapshot.session.maxPursePerTeam || 1000000000);
                setIsMaxPurseModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Custom...</span>
            </button>
          </div>
        </div>

        {/* Banner 3: Tournament Total Players per Team */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/30 border border-sky-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm text-white">
                  Total Squad Slots
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono font-black">
                  {snapshot.session.totalPlayersPerTeam || 11} Players
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Roster Cap
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maximum roster size per franchise. Limits active signings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {[
                { label: '11', val: 11 },
                { label: '15', val: 15 },
                { label: '18', val: 18 },
                { label: '20', val: 20 },
                { label: '25', val: 25 },
              ].map((p) => {
                const isActive = (snapshot.session.totalPlayersPerTeam || 11) === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleApplyTotalPlayers(p.val, true)}
                    disabled={isApplyingTotalPlayers}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-sky-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                    }`}
                    title={`Set Total Players to ${p.label} & apply to all teams`}
                  >
                    {p.label}P
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setTotalPlayersInput(snapshot.session.totalPlayersPerTeam || 11);
                setIsTotalPlayersModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Custom...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Player on Block & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player Hero & Real-time Action Deck */}
        <div className="lg:col-span-2 space-y-6">
          <PlayerHeroCard player={currentPlayer} highBidderTeam={highBidderTeam} />

          {/* Master Hammer Control Panel */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              Tactile Hammer & Session Transitions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Going Once */}
              <button
                onClick={() => handleHammerStrike('GOING_1')}
                disabled={!isBiddingActive}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
              >
                <span className="font-display font-black text-lg group-hover:scale-110 transition-transform">
                  GOING 1
                </span>
                <span className="text-[10px] font-semibold uppercase text-amber-400/80 mt-1">
                  First Call
                </span>
              </button>

              {/* Going Twice */}
              <button
                onClick={() => handleHammerStrike('GOING_2')}
                disabled={!isBiddingActive}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/40 text-orange-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
              >
                <span className="font-display font-black text-lg group-hover:scale-110 transition-transform">
                  GOING 2
                </span>
                <span className="text-[10px] font-semibold uppercase text-orange-400/80 mt-1">
                  Fair Warning
                </span>
              </button>

              {/* SOLD - Drop Hammer */}
              <button
                onClick={() => handleHammerStrike('SOLD')}
                disabled={!currentPlayer || currentPlayer.currentBid === 0}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black transition-all shadow-xl shadow-emerald-600/30 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <CheckCircle2 className="w-6 h-6 mb-1 text-slate-950 stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span className="font-display text-base tracking-wider">SOLD!</span>
                <span className="text-[9px] uppercase font-bold text-slate-900">
                  Drop Gavel
                </span>
              </button>

              {/* UNSOLD - Pass */}
              <button
                onClick={() => handleHammerStrike('UNSOLD')}
                disabled={!currentPlayer || currentPlayer.status === 'SOLD'}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
              >
                <XCircle className="w-6 h-6 mb-1 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="font-display font-black text-base">UNSOLD</span>
                <span className="text-[9px] uppercase font-bold text-rose-400/80">
                  Pass Lot
                </span>
              </button>
            </div>

            {/* Manual Bidding Floor Management Row */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Floor Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isBiddingActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isBiddingActive ? 'Floor Open for Bids' : 'Floor Closed'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isBiddingActive ? (
                  <button
                    onClick={handleStartBidding}
                    disabled={!currentPlayer || currentPlayer.status === 'SOLD'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Open Bidding</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleHammerStrike('GOING_1')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Call Going 1</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Floor Status & Live Ticker */}
        <div className="space-y-6">
          <CountdownTimer status={session.status} />

          <BiddingTicker bids={bidHistory} maxHeight="max-h-[440px]" />
        </div>
      </div>

      {/* Marquee Player Queue & Comprehensive Roster Catalogue */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        {/* Catalogue Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-display font-black text-lg text-white">
                  Official Player Queue & Roster Catalogue
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-mono font-bold">
                  {playersQueue.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse, search, or add players to the live auction floor. Click any player to put them on the block.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <button
                type="button"
                onClick={() => setPlayerViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  playerViewMode === 'GRID'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setPlayerViewMode('TABLE')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  playerViewMode === 'TABLE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table Spreadsheet View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Database API Link */}
            <a
              href="/api/players"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 shadow-sm"
              title="Open Raw JSON Players Database"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Database API</span>
            </a>

            {/* Share Registration Link Button */}
            <button
              type="button"
              onClick={handleCopyRegistrationLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 font-bold text-xs transition-all border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm cursor-pointer"
              title="Copy Direct Registration Link for Players"
            >
              {copiedRegLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share Registration Link</span>
                </>
              )}
            </button>

            {/* Prominent Add New Player Button */}
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25"
            >
              <UserPlus className="w-4 h-4 fill-slate-950" />
              <span>+ Add New Player</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              placeholder="Search players by name, role, country..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-amber-400"
            />
            {playerSearchQuery && (
              <button
                onClick={() => setPlayerSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Role Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  onClick={() => setPlayerRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                    playerRoleFilter === role
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {role === 'ALL' ? 'All Roles' : role}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              {(
                [
                  { id: 'ALL', label: 'All Status' },
                  { id: 'UPCOMING', label: 'In Queue' },
                  { id: 'SOLD', label: 'Sold' },
                  { id: 'UNSOLD', label: 'Unsold' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPlayerStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                    playerStatusFilter === st.id
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-800/40 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtered Count Indicator */}
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Showing <strong className="text-white">{filteredPlayers.length}</strong> of{' '}
            {playersQueue.length} players
          </span>
          {(playerSearchQuery || playerRoleFilter !== 'ALL' || playerStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setPlayerSearchQuery('');
                setPlayerRoleFilter('ALL');
                setPlayerStatusFilter('ALL');
              }}
              className="text-amber-400 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-800/30 border border-dashed border-slate-800">
            <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No players match the current filters</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or register a new player for the auction.
            </p>
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Player</span>
            </button>
          </div>
        ) : playerViewMode === 'TABLE' ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 text-center">Lot</th>
                  <th className="py-3 px-3.5">Player</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Country</th>
                  <th className="py-3 px-3.5">Base Reserve</th>
                  <th className="py-3 px-3.5">Status / Price</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPlayers.map((p) => {
                  const isCurrent = p.id === currentPlayer?.id;
                  const isSold = p.status === 'SOLD';
                  const isUnsold = p.status === 'UNSOLD';
                  const winningTeam = teams.find((t) => t.id === p.winningTeamId);

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10'
                          : isSold
                          ? 'bg-slate-900/40 opacity-75 hover:bg-slate-800/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-400 text-xs">
                        #{p.orderIndex}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.age && (
                                <span className="text-[10px] text-amber-300 font-mono">({p.age}y)</span>
                              )}
                              {p.isOverseas && (
                                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-black uppercase">
                                  OS
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {p.contactNumber && (
                                <span className="text-emerald-400 font-mono font-semibold">📞 {p.contactNumber}</span>
                              )}
                              <span>• {p.stats.battingStyle || p.stats.highlights || `${p.stats.matches} Matches`}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-300">{p.role}</td>
                      <td className="py-2.5 px-3.5 text-slate-300">{p.country}</td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-amber-300">
                        {formatCurrency(p.basePrice)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {isSold ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px] uppercase">
                              SOLD {formatCurrency(p.soldPrice || 0)}
                            </span>
                            {winningTeam && (
                              <span className="text-[10px] font-bold text-slate-400">
                                to {winningTeam.code}
                              </span>
                            )}
                          </div>
                        ) : isUnsold ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black text-[10px] uppercase">
                            UNSOLD
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                            ON BLOCK
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium">In Queue</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectPlayer(p.id)}
                            disabled={isSold || isCurrent}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {isCurrent ? 'Active' : 'Place on Block'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditPlayerModal(p)}
                            title={`Edit ${p.name}`}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p.id, p.name)}
                            title={`Delete ${p.name}`}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredPlayers.map((p) => {
              const isCurrent = p.id === currentPlayer?.id;
              const isSold = p.status === 'SOLD';
              const isUnsold = p.status === 'UNSOLD';

              return (
                <div
                  key={p.id}
                  className={`relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                      : isSold
                      ? 'bg-slate-900/50 border-slate-800 opacity-60'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  {/* Clickable Area to Select Player onto Block */}
                  <button
                    onClick={() => handleSelectPlayer(p.id)}
                    disabled={isSold}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-slate-950/90 text-amber-300 text-[8px] font-mono font-bold">
                        #{p.orderIndex}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="font-display font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{p.name}</span>
                        {p.age && (
                          <span className="text-[9px] text-amber-300 font-mono">({p.age}y)</span>
                        )}
                        {p.isOverseas && (
                          <span className="text-[8px] px-1 rounded bg-sky-500/20 text-sky-400 font-bold uppercase">
                            OS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                        <span>{p.role}</span>
                        <span className="font-semibold text-slate-300">
                          {formatCurrency(p.basePrice)}
                        </span>
                      </div>
                      {p.contactNumber && (
                        <div className="text-[9px] text-emerald-400 font-mono truncate mt-0.5">
                          📞 {p.contactNumber}
                        </div>
                      )}

                      <div className="mt-1">
                        {isSold ? (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            SOLD {formatCurrency(p.soldPrice || 0)}
                          </span>
                        ) : isUnsold ? (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            UNSOLD
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                            ON BLOCK
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-medium text-slate-500">
                            Lot #{p.orderIndex}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Action Buttons */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditPlayerModal(p);
                      }}
                      title={`Edit ${p.name}`}
                      className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-400 border border-slate-700 hover:border-amber-400 transition-colors shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlayer(p.id, p.name);
                      }}
                      title={`Delete ${p.name}`}
                      className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 hover:border-rose-400 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 
        ========================================================================
        MODAL 1: EDIT TEAMS / FRANCHISE NAMES & CODES
        ========================================================================
      */}
      {isEditingTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Edit Franchises & Team Names
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update franchise names and abbreviations across the entire platform
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditingTeams(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teams List */}
            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {teams.map((t, idx) => {
                const currentName = teamsState[t.id]?.name ?? t.name;
                const currentCode = teamsState[t.id]?.code ?? t.code;
                const currentLogo = teamsState[t.id]?.logo ?? t.logo;
                const isSaved = savedTeamId === t.id;

                return (
                  <div
                    key={t.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-display font-bold text-xs text-slate-500 w-14 shrink-0">
                        Team {idx + 1}
                      </span>

                      {/* Logo Thumbnail Preview */}
                      <div className="w-11 h-11 rounded-xl bg-amber-300/10 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {currentLogo ? (
                          <img
                            src={currentLogo}
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Team Name Input */}
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Franchise Name
                      </label>
                      <input
                        type="text"
                        value={currentName}
                        onChange={(e) =>
                          setTeamsState((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...prev[t.id],
                              name: e.target.value,
                              code: prev[t.id]?.code ?? t.code,
                              logo: prev[t.id]?.logo ?? t.logo ?? '',
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Team Code Input */}
                    <div className="w-20 shrink-0">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Code
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={currentCode}
                        onChange={(e) =>
                          setTeamsState((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...prev[t.id],
                              code: e.target.value.toUpperCase(),
                              name: prev[t.id]?.name ?? t.name,
                              logo: prev[t.id]?.logo ?? t.logo ?? '',
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold uppercase text-center focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Team Logo URL / Upload */}
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Logo (URL or File)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Paste image URL..."
                          value={currentLogo.startsWith('data:') ? 'Local file uploaded' : currentLogo}
                          onChange={(e) =>
                            setTeamsState((prev) => ({
                              ...prev,
                              [t.id]: {
                                ...prev[t.id],
                                logo: e.target.value,
                                name: prev[t.id]?.name ?? t.name,
                                code: prev[t.id]?.code ?? t.code,
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 truncate font-mono text-[11px]"
                        />

                        {/* File Upload Button */}
                        <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(t.id, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Max Total Purse */}
                    <div className="w-36 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">
                          Max Purse
                        </label>
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {formatCurrency(teamsState[t.id]?.totalPurse ?? t.totalPurse)}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="50000000"
                        min="10000000"
                        value={teamsState[t.id]?.totalPurse ?? t.totalPurse}
                        onChange={(e) =>
                          setTeamsState((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...prev[t.id],
                              totalPurse: Number(e.target.value),
                              name: prev[t.id]?.name ?? t.name,
                              code: prev[t.id]?.code ?? t.code,
                              logo: prev[t.id]?.logo ?? t.logo ?? '',
                              maxSlots: prev[t.id]?.maxSlots ?? t.maxSlots,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Max Squad Slots */}
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">
                          Slots
                        </label>
                        <span className="text-[10px] font-mono font-bold text-sky-400">
                          {teamsState[t.id]?.maxSlots ?? t.maxSlots}P
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="35"
                        value={teamsState[t.id]?.maxSlots ?? t.maxSlots}
                        onChange={(e) =>
                          setTeamsState((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...prev[t.id],
                              maxSlots: Math.max(1, parseInt(e.target.value) || 1),
                              name: prev[t.id]?.name ?? t.name,
                              code: prev[t.id]?.code ?? t.code,
                              logo: prev[t.id]?.logo ?? t.logo ?? '',
                              totalPurse: prev[t.id]?.totalPurse ?? t.totalPurse,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-400 text-center"
                      />
                    </div>

                    {/* Action Buttons: Save & Delete */}
                    <div className="pt-2 md:pt-4 shrink-0 flex items-center gap-1.5">
                      <button
                        onClick={() => handleSaveTeam(t.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isSaved
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Saved
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(t.id, currentName)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title={`Permanently delete franchise ${currentName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewTeamPurse(snapshot?.session.maxPursePerTeam || 1000000000);
                  setNewTeamSlots(snapshot?.session.totalPlayersPerTeam || 11);
                  setIsAddingTeam(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Team</span>
              </button>

              <button
                onClick={() => setIsEditingTeams(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: CREATE NEW FRANCHISE TEAM
        ========================================================================
      */}
      {isAddingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl p-6 relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Add New Franchise Team
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create a new bidding franchise for the live auction
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingTeam(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Franchise Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => {
                    setNewTeamName(e.target.value);
                    if (!newTeamCode && e.target.value.length >= 2) {
                      const words = e.target.value.trim().split(/\s+/);
                      const suggested = words.length > 1
                        ? words.map((w) => w[0]).join('').slice(0, 4).toUpperCase()
                        : e.target.value.slice(0, 3).toUpperCase();
                      setNewTeamCode(suggested);
                    }
                  }}
                  placeholder="e.g. Pune Warriors, Lucknow Super Giants"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-emerald-400"
                  required
                  autoFocus
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Short Code / Abbreviation * (Max 5 Chars)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={newTeamCode}
                  onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PW, LSG"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm uppercase font-bold focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              {/* Team Logo (URL or file upload) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Franchise Logo (URL or File Upload)
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {newTeamLogo ? (
                      <img src={newTeamLogo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://... or upload local file"
                    value={newTeamLogo.startsWith('data:') ? 'Local logo uploaded' : newTeamLogo}
                    onChange={(e) => setNewTeamLogo(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 truncate"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleNewTeamLogoUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Franchise Primary Brand Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'Sky', hex: '#0284c7' },
                    { label: 'Gold', hex: '#f59e0b' },
                    { label: 'Red', hex: '#dc2626' },
                    { label: 'Purple', hex: '#7c3aed' },
                    { label: 'Emerald', hex: '#059669' },
                    { label: 'Pink', hex: '#db2777' },
                    { label: 'Indigo', hex: '#4f46e5' },
                    { label: 'Cyan', hex: '#0891b2' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewTeamColor(c.hex)}
                      className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${
                        newTeamColor === c.hex ? 'scale-110 border-white shadow-lg' : 'border-slate-700 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {newTeamColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Total Purse & Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Purse */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Total Purse (INR)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {formatCurrency(Number(newTeamPurse) || 0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="50000000"
                    min="10000000"
                    value={newTeamPurse}
                    onChange={(e) => setNewTeamPurse(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Squad Slots Limit
                    </label>
                    <span className="text-[11px] font-mono font-bold text-sky-400">
                      {newTeamSlots} Players
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={newTeamSlots}
                    onChange={(e) => setNewTeamSlots(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Franchise Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: EDIT PLAYER DETAILS
        ========================================================================
      */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Edit Player Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifying Lot #{editingPlayer.orderIndex} • {editingPlayer.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4 py-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Player Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Category / Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category / Role
                </label>
                <select
                  value={playerRole}
                  onChange={(e) => setPlayerRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Base Reserve Price (INR)
                </label>
                <input
                  type="number"
                  step="1000000"
                  min="2000000"
                  value={playerBasePrice}
                  onChange={(e) => setPlayerBasePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  required
                />
                <p className="text-[11px] text-amber-400/80 mt-1">
                  Preview: {formatCurrency(Number(playerBasePrice) || 0)}
                </p>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeletePlayer(editingPlayer.id, editingPlayer.name)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title={`Permanently delete ${editingPlayer.name} from the auction pool`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Player</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Player</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 3: REGISTER NEW PLAYER FOR AUCTION
        ========================================================================
      */}
      {isAddingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl p-6 relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Register New Player for Auction
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add a player to the live pool as Lot #{playersQueue.length + 1}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingPlayer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlayer} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Player Full Name *
                </label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g. Jasprit Bumrah, Shubman Gill"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-400"
                  required
                  autoFocus
                />
              </div>

              {/* Category / Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category / Role *
                </label>
                <select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>

              {/* Base Reserve Price */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Base Reserve Price (INR) *
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      Floor: {formatCurrency(snapshot.session.minBasePrice || 20000000)}
                    </span>
                  </div>
                  <span className="font-display font-extrabold text-xs text-amber-400">
                    {formatCurrency(Number(newPlayerBasePrice) || 0)}
                  </span>
                </div>
                <input
                  type="number"
                  step="500000"
                  min="500000"
                  value={newPlayerBasePrice}
                  onChange={(e) => setNewPlayerBasePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  required
                />
                {/* Quick Price Pickers */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setNewPlayerBasePrice(snapshot.session.minBasePrice || 20000000)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all mr-1"
                    title="Reset to Tournament Common Minimum Floor"
                  >
                    Use Floor ({formatCurrency(snapshot.session.minBasePrice || 20000000)})
                  </button>
                  {[
                    { label: '₹20 L', val: 2000000 },
                    { label: '₹50 L', val: 5000000 },
                    { label: '₹1.0 Cr', val: 10000000 },
                    { label: '₹1.5 Cr', val: 15000000 },
                    { label: '₹2.0 Cr', val: 20000000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setNewPlayerBasePrice(p.val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        newPlayerBasePrice === p.val
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Avatar / Photo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Player Photo / Avatar (URL or File Upload)
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {newPlayerAvatarUrl ? (
                      <img src={newPlayerAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://... or choose local file"
                    value={newPlayerAvatarUrl.startsWith('data:') ? 'Local photo uploaded' : newPlayerAvatarUrl}
                    onChange={(e) => setNewPlayerAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400 truncate"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePlayerPhotoUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingPlayer(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25"
                >
                  <UserPlus className="w-4 h-4 fill-slate-950" />
                  <span>Register & Add to Auction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Tournament Minimum Base Price Setting */}
      {isMinPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Set Common Minimum Base Price
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure tournament-wide reserve price floor for all players
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMinPriceModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 py-4">
              {/* Current Value vs New Value Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Current Tournament Floor
                  </span>
                  <span className="font-display font-black text-sm text-slate-200">
                    {formatCurrency(snapshot.session.minBasePrice || 20000000)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Selected New Floor
                  </span>
                  <span className="font-display font-black text-lg text-amber-400">
                    {formatCurrency(Number(commonBasePriceInput) || 0)}
                  </span>
                </div>
              </div>

              {/* Price Input Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Reserve Price Floor (INR) *
                </label>
                <input
                  type="number"
                  step="500000"
                  min="500000"
                  value={commonBasePriceInput}
                  onChange={(e) => setCommonBasePriceInput(Number(e.target.value))}
                  placeholder="e.g. 20000000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              {/* Preset Quick Buttons */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Select Presets
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '₹20 L', val: 2000000 },
                    { label: '₹50 L', val: 5000000 },
                    { label: '₹1.0 Cr', val: 10000000 },
                    { label: '₹1.5 Cr', val: 15000000 },
                    { label: '₹2.0 Cr', val: 20000000 },
                  ].map((p) => {
                    const isSelected = commonBasePriceInput === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setCommonBasePriceInput(p.val)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-400/20'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Apply to All Upcoming Players Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={applyFloorToAll}
                  onChange={(e) => setApplyFloorToAll(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-700 border-slate-600 accent-amber-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-200 block">
                    Update all upcoming / unsold players in auction pool
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    When enabled, all players currently in the upcoming queue will immediately have their base price updated to this floor. Sold players and active bids will remain untouched.
                  </span>
                </div>
              </label>

              {/* Note */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <Sliders className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Any new players registered after this will also automatically default to this common minimum base price.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMinPriceModalOpen(false)}
                  disabled={isApplyingBasePrice}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCommonBasePrice(Number(commonBasePriceInput), applyFloorToAll)}
                  disabled={isApplyingBasePrice || !commonBasePriceInput || commonBasePriceInput <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Tag className="w-4 h-4 fill-slate-950" />
                  <span>{isApplyingBasePrice ? 'Applying...' : 'Apply Common Floor'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Tournament Maximum Purse Balance per Team Setting */}
      {isMaxPurseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Set Maximum Purse Balance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure tournament-wide maximum purse limit per team
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMaxPurseModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 py-4">
              {/* Current Value vs New Value Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Current Team Max Purse
                  </span>
                  <span className="font-display font-black text-sm text-slate-200">
                    {formatCurrency(snapshot.session.maxPursePerTeam || 1000000000)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Selected New Limit
                  </span>
                  <span className="font-display font-black text-lg text-emerald-400">
                    {formatCurrency(Number(maxPurseInput) || 0)}
                  </span>
                </div>
              </div>

              {/* Price Input Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Maximum Purse Balance (INR) *
                </label>
                <input
                  type="number"
                  step="50000000"
                  min="10000000"
                  value={maxPurseInput}
                  onChange={(e) => setMaxPurseInput(Number(e.target.value))}
                  placeholder="e.g. 1000000000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
              </div>

              {/* Preset Quick Buttons */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Select Presets
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '₹80 Cr', val: 800000000 },
                    { label: '₹90 Cr', val: 900000000 },
                    { label: '₹100 Cr', val: 1000000000 },
                    { label: '₹110 Cr', val: 1100000000 },
                    { label: '₹120 Cr', val: 1200000000 },
                  ].map((p) => {
                    const isSelected = maxPurseInput === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setMaxPurseInput(p.val)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-400 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-400/20'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Apply to All Teams Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={applyPurseToAll}
                  onChange={(e) => setApplyPurseToAll(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-700 border-slate-600 accent-emerald-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-200 block">
                    Update all franchise teams immediately
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    When enabled, all teams will have their total purse cap updated to this amount. Spent funds on acquired players will be preserved, and remaining purse balances will be automatically adjusted.
                  </span>
                </div>
              </label>

              {/* Note */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                <Sliders className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  You can also edit individual team purse caps anytime using the <strong>Edit Teams</strong> button in the header.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMaxPurseModalOpen(false)}
                  disabled={isApplyingPurse}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMaxPurse(Number(maxPurseInput), applyPurseToAll)}
                  disabled={isApplyingPurse || !maxPurseInput || maxPurseInput <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4 fill-slate-950" />
                  <span>{isApplyingPurse ? 'Applying...' : 'Apply Max Purse'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Tournament Total Players Per Team Setting */}
      {isTotalPlayersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-sky-500/40 p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Set Total Players Per Team
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure tournament-wide squad roster limit per team
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTotalPlayersModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 py-4">
              {/* Current Value vs New Value Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Current Squad Limit
                  </span>
                  <span className="font-display font-black text-sm text-slate-200">
                    {snapshot.session.totalPlayersPerTeam || 11} Players
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">
                    Selected New Limit
                  </span>
                  <span className="font-display font-black text-lg text-sky-400">
                    {Number(totalPlayersInput) || 0} Players
                  </span>
                </div>
              </div>

              {/* Slots Input Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Squad Size Limit (Players per Team) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="35"
                  value={totalPlayersInput}
                  onChange={(e) => setTotalPlayersInput(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 11, 15, 18, 20"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:border-sky-400"
                  autoFocus
                />
              </div>

              {/* Preset Quick Buttons */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Select Presets
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '11', val: 11 },
                    { label: '15', val: 15 },
                    { label: '18', val: 18 },
                    { label: '20', val: 20 },
                    { label: '25', val: 25 },
                  ].map((p) => {
                    const isSelected = totalPlayersInput === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setTotalPlayersInput(p.val)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? 'bg-sky-400 text-slate-950 font-black border-sky-400 shadow-md shadow-sky-400/20'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {p.label}P
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Apply to All Teams Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={applyPlayersToAll}
                  onChange={(e) => setApplyPlayersToAll(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-400 bg-slate-700 border-slate-600 accent-sky-500"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-200 block">
                    Update all franchise teams immediately
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    When enabled, all teams will have their squad limit updated to this amount. Existing acquired players are retained, and bidding eligibility will be locked once a team reaches this roster limit.
                  </span>
                </div>
              </label>

              {/* Note */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-2">
                <Sliders className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  You can also edit individual team squad limits anytime using the <strong>Edit Teams</strong> button in the header.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTotalPlayersModalOpen(false)}
                  disabled={isApplyingTotalPlayers}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTotalPlayers(Number(totalPlayersInput), applyPlayersToAll)}
                  disabled={isApplyingTotalPlayers || !totalPlayersInput || totalPlayersInput <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-display font-black uppercase tracking-wider transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="w-4 h-4 fill-slate-950" />
                  <span>{isApplyingTotalPlayers ? 'Applying...' : 'Apply Squad Limit'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
