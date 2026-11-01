import React, { useState } from 'react';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import { CricketProvider, useCricket } from './context/CricketContext';
import { Navbar, ActiveView } from './components/Navbar';
import { AdminConsole } from './views/AdminConsole';
import { FranchiseDesk } from './views/FranchiseDesk';
import { PublicLiveTracker } from './views/PublicLiveTracker';
import { PlayerRegistration } from './views/PlayerRegistration';
import { ScorerConsole } from './views/ScorerConsole';
import { PublicMatchCenter } from './views/PublicMatchCenter';
import { TournamentHub } from './views/TournamentHub';

const parseViewFromUrl = (): ActiveView => {
  if (typeof window === 'undefined') return 'admin';
  const hash = window.location.hash.toLowerCase().replace('#', '');
  const params = new URLSearchParams(window.location.search);
  const viewParam = (params.get('view') || params.get('tab') || '').toLowerCase();
  const path = window.location.pathname.toLowerCase().replace('/', '');

  const target = hash || viewParam || path;
  if (target === 'scorer' || target === 'cricket-scorer') return 'cricket-scorer';
  if (target === 'match' || target === 'cricket-match' || target === 'live-match') return 'cricket-match';
  if (target === 'tournament' || target === 'tournaments' || target === 'cricket-tournament') return 'cricket-tournament';
  if (target === 'register' || target === 'registration') return 'register';
  if (target === 'franchise' || target === 'bid' || target === 'team') return 'franchise';
  if (target === 'public' || target === 'stadium' || target === 'live') return 'public';
  return 'admin';
};

export const AppContent: React.FC = () => {
  const { isEffectiveAdmin } = useAuction();
  const { selectMatch } = useCricket();
  const [currentView, setCurrentView] = useState<ActiveView>(parseViewFromUrl);

  // Sync state if URL hash changes
  React.useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(parseViewFromUrl());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleSelectView = (view: ActiveView) => {
    setCurrentView(view);
    if (window.location.hash !== `#${view}`) {
      window.location.hash = view;
    }
  };

  const handleNavigateToScorer = (matchId: string) => {
    selectMatch(matchId);
    handleSelectView('cricket-scorer');
  };

  const handleNavigateToMatch = (matchId: string) => {
    selectMatch(matchId);
    handleSelectView('cricket-match');
  };

  return (
    <div className="min-h-screen bg-auction-dark text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar currentView={currentView} onSelectView={handleSelectView} />

      {/* Main View Area */}
      <main className={`flex-1 ${isEffectiveAdmin ? 'pb-16' : 'pb-8'}`}>
        {/* Auction Suite */}
        {currentView === 'admin' && <AdminConsole />}
        {currentView === 'franchise' && <FranchiseDesk />}
        {currentView === 'public' && <PublicLiveTracker />}
        {currentView === 'register' && <PlayerRegistration onNavigate={handleSelectView} />}

        {/* Cricket Tournament & Scoring Suite */}
        {currentView === 'cricket-scorer' && <ScorerConsole />}
        {currentView === 'cricket-match' && <PublicMatchCenter />}
        {currentView === 'cricket-tournament' && (
          <TournamentHub
            onNavigateToScorer={handleNavigateToScorer}
            onNavigateToMatch={handleNavigateToMatch}
          />
        )}
      </main>

      {/* Admin Quick Switch Footer */}
      {isEffectiveAdmin && (
        <footer className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-300">Sports Auction & Live Cricket Engine Online:</span>
              <span className="hidden sm:inline">Real-time socket duplex sync active across all match & bidding desks.</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-mono">Auction:</span>
              <button
                onClick={() => handleSelectView('admin')}
                className={`hover:underline ${currentView === 'admin' ? 'text-amber-400 font-bold' : ''}`}
              >
                Auctioneer
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('franchise')}
                className={`hover:underline ${currentView === 'franchise' ? 'text-blue-400 font-bold' : ''}`}
              >
                Franchise
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('public')}
                className={`hover:underline ${currentView === 'public' ? 'text-purple-400 font-bold' : ''}`}
              >
                Stadium
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('register')}
                className={`hover:underline ${currentView === 'register' ? 'text-emerald-400 font-bold' : ''}`}
              >
                Registration
              </button>

              <span className="text-slate-600 mx-1">|</span>

              <span className="text-slate-500 font-mono">Cricket:</span>
              <button
                onClick={() => handleSelectView('cricket-scorer')}
                className={`hover:underline ${currentView === 'cricket-scorer' ? 'text-emerald-400 font-bold' : ''}`}
              >
                Scorer Desk
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('cricket-match')}
                className={`hover:underline ${currentView === 'cricket-match' ? 'text-rose-400 font-bold' : ''}`}
              >
                Match Center
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('cricket-tournament')}
                className={`hover:underline ${currentView === 'cricket-tournament' ? 'text-amber-400 font-bold' : ''}`}
              >
                Tournaments
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuctionProvider>
      <CricketProvider>
        <AppContent />
      </CricketProvider>
    </AuctionProvider>
  );
};

export default App;
