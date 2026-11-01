import React from 'react';
import {
  Gavel,
  ShieldCheck,
  Tv,
  Zap,
  RefreshCw,
  Radio,
  UserPlus,
  Eye,
  EyeOff,
  Flame,
  Trophy,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export type ActiveView =
  | 'admin'
  | 'franchise'
  | 'public'
  | 'register'
  | 'cricket-scorer'
  | 'cricket-match'
  | 'cricket-tournament';

interface NavbarProps {
  currentView: ActiveView;
  onSelectView: (view: ActiveView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  const {
    isConnected,
    lastLatencyMs,
    resetAuction,
    isAdmin,
    isEffectiveAdmin,
    adminPreviewAsPlayer,
    setAdminPreviewAsPlayer,
  } = useAuction();

  const handleReset = async () => {
    if (window.confirm('Reset auction state, team budgets, and player roster to initial seed?')) {
      await resetAuction();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-auction-dark/95 backdrop-blur-md border-b border-auction-border px-3 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div
          onClick={isEffectiveAdmin ? () => onSelectView('admin') : undefined}
          className={`flex items-center gap-2.5 ${isEffectiveAdmin ? 'cursor-pointer group' : 'cursor-default'}`}
          title="Premier Sports & Cricket Platform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gavel className="w-4 h-4 text-gray-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-lg tracking-wider text-white">
                SPORTS<span className="text-amber-400">PRO</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                AUCTION & SCORING
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner flex-wrap gap-1">
          {isEffectiveAdmin ? (
            /* ADMIN VIEW: Auction + Cricket tabs */
            <>
              {/* Auction Suite */}
              <button
                onClick={() => onSelectView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auction Desk</span>
              </button>

              <button
                onClick={() => onSelectView('franchise')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'franchise'
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Franchise</span>
              </button>

              <button
                onClick={() => onSelectView('public')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'public'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Auction Stadium</span>
              </button>

              <button
                onClick={() => onSelectView('register')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registration</span>
              </button>

              <span className="w-px h-5 bg-slate-700 mx-1 hidden sm:inline-block"></span>

              {/* Cricket Suite */}
              <button
                onClick={() => onSelectView('cricket-scorer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'cricket-scorer'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Scorer</span>
              </button>

              <button
                onClick={() => onSelectView('cricket-match')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'cricket-match'
                    ? 'bg-rose-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Match Center</span>
              </button>

              <button
                onClick={() => onSelectView('cricket-tournament')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'cricket-tournament'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tournaments</span>
              </button>
            </>
          ) : (
            /* SHARED USER VIEW: Clean context-dependent pill */
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-slate-800/80 text-slate-200 border border-slate-700">
              {currentView === 'cricket-match' ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Live Match Broadcast</span>
                </>
              ) : currentView === 'cricket-scorer' ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ground Scorer Desk</span>
                </>
              ) : currentView === 'cricket-tournament' ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tournament Points Table & Fixtures</span>
                </>
              ) : currentView === 'public' ? (
                <>
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>Auction Live Stadium</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Player Registration Portal</span>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Admin Mode Player-View Preview Toggle */}
          {isAdmin && (
            <button
              onClick={() => setAdminPreviewAsPlayer(!adminPreviewAsPlayer)}
              title={adminPreviewAsPlayer ? 'Switch back to Admin view' : 'Preview screen as a shared user'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                adminPreviewAsPlayer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {adminPreviewAsPlayer ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Exit Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              )}
            </button>
          )}

          {/* Connection & Latency Indicator */}
          {isEffectiveAdmin && (
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${
                isConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{isConnected ? `${lastLatencyMs}ms` : 'Offline'}</span>
            </div>
          )}

          {/* Reset Database Button (Admin Only) */}
          {isEffectiveAdmin && (
            <button
              onClick={handleReset}
              title="Reset Database to Seed State"
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
