import React, { useState } from 'react';
import {
  Tv,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  Plane,
  Shield,
  Layers,
  ChevronRight,
  Flame,
  Search,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { BiddingTicker } from '../components/BiddingTicker';

export const PublicLiveTracker: React.FC = () => {
  const { snapshot, formatCurrency, hammerNotification } = useAuction();
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
          <p>Connecting to Stadium Live Broadcast...</p>
        </div>
      </div>
    );
  }

  const { session, currentPlayer, teams, bidHistory, recentSales, playersQueue } = snapshot;
  const highBidderTeam = teams.find((t) => t.id === currentPlayer?.currentHighBidderId) || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Stadium Jumbo Screen Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl text-white tracking-wide">
                STADIUM LIVE BROADCAST TRACKER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> ON AIR
              </span>
            </div>
            <p className="text-xs text-purple-300 font-medium">
              Official Spectator Arena Feed • Sub-50ms Synchronized Frame Delivery
            </p>
          </div>
        </div>

        {/* Live Hammer Strike Overlay Toast if active */}
        {hammerNotification && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-2xl animate-bounce-subtle">
            <Flame className="w-5 h-5 fill-slate-950" />
            <span>{hammerNotification.message}</span>
          </div>
        )}
      </div>

      {/* Main Stadium Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Center Player Spotlight & Escalating War */}
        <div className="lg:col-span-2 space-y-6">
          {currentPlayer ? (
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 lg:p-8 backdrop-blur-xl">
              {/* Dynamic Franchise Colored Ambient Light */}
              <div
                className="absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
                style={{ backgroundColor: highBidderTeam?.primaryColor || '#a855f7' }}
              />

              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
                {/* Giant Player Avatar */}
                <div className="relative shrink-0">
                  <div className="w-40 h-40 md:w-52 md:h-52 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-800">
                    <img
                      src={currentPlayer.avatarUrl}
                      alt={currentPlayer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {currentPlayer.isOverseas && (
                    <span className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-sky-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xl">
                      <Plane className="w-3.5 h-3.5" /> Overseas
                    </span>
                  )}
                </div>

                {/* Player Profile & Stats */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {currentPlayer.role}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                      {currentPlayer.country}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      Lot #{currentPlayer.orderIndex}
                    </span>
                  </div>

                  <h1 className="font-display font-black text-3xl md:text-5xl text-white tracking-wide">
                    {currentPlayer.name}
                  </h1>

                  <p className="text-sm text-slate-400 mt-1 italic flex items-center justify-center md:justify-start gap-1.5">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    "{currentPlayer.stats.highlights}"
                  </p>

                  {/* Career Highlights Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Matches</div>
                      <div className="font-display text-lg font-black text-white">
                        {currentPlayer.stats.matches}
                      </div>
                    </div>

                    {currentPlayer.stats.runs !== undefined && (
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Runs</div>
                        <div className="font-display text-lg font-black text-emerald-400">
                          {currentPlayer.stats.runs.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {currentPlayer.stats.strikeRate !== undefined && (
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">SR</div>
                        <div className="font-display text-lg font-black text-amber-400">
                          {currentPlayer.stats.strikeRate}
                        </div>
                      </div>
                    )}

                    {currentPlayer.stats.wickets !== undefined && (
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Wickets
                        </div>
                        <div className="font-display text-lg font-black text-sky-400">
                          {currentPlayer.stats.wickets}
                        </div>
                      </div>
                    )}

                    {currentPlayer.stats.economy !== undefined && (
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Economy
                        </div>
                        <div className="font-display text-lg font-black text-teal-400">
                          {currentPlayer.stats.economy}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Massive Stadium Price Callout */}
              <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Base Price</div>
                  <div className="font-display font-extrabold text-xl text-slate-300">
                    {formatCurrency(currentPlayer.basePrice)}
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="text-xs uppercase font-extrabold text-amber-400 tracking-wider flex items-center justify-center md:justify-end gap-1.5">
                    <TrendingUp className="w-4 h-4" /> HIGHEST ACTIVE BID
                  </div>
                  <div className="font-display font-black text-4xl md:text-5xl text-amber-300 tracking-tight">
                    {currentPlayer.currentBid > 0
                      ? formatCurrency(currentPlayer.currentBid)
                      : 'Awaiting Bids'}
                  </div>
                </div>

                {highBidderTeam && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
                    <span
                      className="w-4 h-4 rounded-full shadow-md"
                      style={{ backgroundColor: highBidderTeam.primaryColor }}
                    />
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Leading</div>
                      <div className="font-display font-black text-base text-white">
                        {highBidderTeam.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl text-slate-300">
                Stadium Intermission
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The next marquee player is being prepared for the auction block.
              </p>
            </div>
          )}

          {/* Recent Sales Reel / Marquee */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-extrabold text-base text-white">
                  Recent Closed Sales & Transactions
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {recentSales.length} Completed Deals
              </span>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No players sold yet in this session.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {recentSales.map((sale, idx) => (
                  <div
                    key={`${sale.player.id}-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <img
                      src={sale.player.avatarUrl}
                      alt={sale.player.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-xs text-white truncate">
                        {sale.player.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sale.team.primaryColor }}
                        />
                        <span className="truncate">{sale.team.code}</span>
                      </div>
                      <div className="font-display font-extrabold text-xs text-emerald-400 mt-0.5">
                        {formatCurrency(sale.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Floor Status & Live Ticker */}
        <div className="space-y-6">
          <CountdownTimer status={session.status} />

          <BiddingTicker bids={bidHistory} maxHeight="max-h-[440px]" />
        </div>
      </div>

      {/* Tournament Franchise Purse & Standings Leaderboard */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="font-display font-extrabold text-base text-white">
            Franchise Purse & Roster Standings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Franchise</th>
                <th className="py-3 px-4">Remaining Purse</th>
                <th className="py-3 px-4">Purse Spent</th>
                <th className="py-3 px-4">Total Squad</th>
                <th className="py-3 px-4 text-right">Signings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {teams.map((team) => {
                const spent = team.totalPurse - team.remainingPurse;
                return (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      <span className="font-display font-bold text-white text-sm">
                        {team.name} ({team.code})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-display font-bold text-emerald-400 text-sm">
                      {formatCurrency(team.remainingPurse)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{formatCurrency(spent)}</td>
                    <td className="py-3 px-4 text-white">
                      {team.currentSlots} / {team.maxSlots}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-300">
                      {team.playersAcquired.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Tournament Player Pool & Catalogue */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  Tournament Player Roster & Status
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-purple-400 text-xs font-mono font-bold">
                  {playersQueue.length} Players
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full roster of marquee players, reserve prices, and current sale status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search player or country..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-1">
              {['ALL', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    roleFilter === role
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {role === 'ALL' ? 'All' : role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {playersQueue
            .filter((p) => {
              if (playerSearch.trim()) {
                const q = playerSearch.toLowerCase();
                if (!p.name.toLowerCase().includes(q) && !p.country.toLowerCase().includes(q)) return false;
              }
              if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
              return true;
            })
            .map((p) => {
              const winningTeam = teams.find((t) => t.id === p.winningTeamId);
              const isCurrent = p.id === currentPlayer?.id;
              const isSold = p.status === 'SOLD';
              const isUnsold = p.status === 'UNSOLD';

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
                      : isSold
                      ? 'bg-slate-900/40 border-slate-800 opacity-80'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-slate-950/90 text-purple-300 text-[8px] font-mono font-bold">
                      #{p.orderIndex}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-xs text-white truncate flex items-center gap-1">
                      <span>{p.name}</span>
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

                    <div className="mt-1">
                      {isSold ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            SOLD {formatCurrency(p.soldPrice || 0)}
                          </span>
                          {winningTeam && (
                            <span className="text-[9px] font-bold text-slate-400 truncate">
                              ({winningTeam.code})
                            </span>
                          )}
                        </div>
                      ) : isUnsold ? (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          UNSOLD
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-purple-500 text-white">
                          ON BLOCK
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-medium text-slate-500">
                          Upcoming Lot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
