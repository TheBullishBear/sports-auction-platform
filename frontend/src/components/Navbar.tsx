import React from 'react';
import { Gavel, ShieldCheck, Tv, Zap, RefreshCw, Radio, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export type ActiveView = 'admin' | 'franchise' | 'public' | 'register';

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
    <header className="sticky top-0 z-50 bg-auction-dark/90 backdrop-blur-md border-b border-auction-border px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={isEffectiveAdmin ? () => onSelectView('admin') : undefined}
          className={`flex items-center gap-3 ${isEffectiveAdmin ? 'cursor-pointer group' : 'cursor-default'}`}
          title="Premier Auction Pro 2026"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gavel className="w-5 h-5 text-gray-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-wider text-white">
                PREMIER<span className="text-amber-400">AUCTION</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PRO 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Sub-50ms Real-Time Concurrency Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner flex-wrap gap-1">
          {isEffectiveAdmin ? (
            /* ADMIN VIEW: All 4 navigation tabs visible */
            <>
              <button
                onClick={() => onSelectView('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </button>

              <button
                onClick={() => onSelectView('franchise')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  currentView === 'franchise'
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Franchise Desk</span>
              </button>

              <button
                onClick={() => onSelectView('public')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  currentView === 'public'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Stadium Live Tracker</span>
              </button>

              <button
                onClick={() => onSelectView('register')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  currentView === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Player Registration</span>
              </button>
            </>
          ) : (
            /* SHARED USER VIEW: Clean Player Portal tab only */
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Official Player Registration Portal</span>
            </div>
          )}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Admin Mode Player-View Preview Toggle (for Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminPreviewAsPlayer((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                adminPreviewAsPlayer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={
                adminPreviewAsPlayer
                  ? 'Currently Previewing as External Player. Click to restore Admin View.'
                  : 'Click to test/preview the clean view that external players see.'
              }
            >
              {adminPreviewAsPlayer ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exit Player Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview as Player</span>
                </>
              )}
            </button>
          )}

          {/* Telemetry & Controls - VISIBLE ONLY FOR ADMIN */}
          {isEffectiveAdmin && (
            <>
              {/* Real-time Sub-50ms Latency Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {lastLatencyMs !== null ? `${lastLatencyMs} ms latency` : '< 25 ms ping'}
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
                  }`}
                />
                <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'RECONNECTING'}</span>
              </div>

              {/* Reset Demo */}
              <button
                onClick={handleReset}
                title="Reset Auction Demo"
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
