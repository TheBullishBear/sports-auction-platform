import React from 'react';
import { Globe, Plane, Award, BarChart3, TrendingUp, ShieldAlert } from 'lucide-react';
import { Player, Team } from '../types';
import { useAuction } from '../context/AuctionContext';

interface PlayerHeroCardProps {
  player: Player | null;
  highBidderTeam: Team | null;
  size?: 'normal' | 'large';
}

export const PlayerHeroCard: React.FC<PlayerHeroCardProps> = ({
  player,
  highBidderTeam,
  size = 'normal',
}) => {
  const { formatCurrency } = useAuction();

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-300">No Player on the Block</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          The auctioneer will place the next marquee candidate on the auction block shortly.
        </p>
      </div>
    );
  }

  const roleColor = {
    Batter: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Bowler: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'All-Rounder': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Wicketkeeper: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }[player.role];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 lg:p-8 backdrop-blur-xl">
      {/* Background Ambient Glow */}
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{
          backgroundColor: highBidderTeam?.primaryColor || '#fbbf24',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-start">
        {/* Player Avatar */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-800">
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {player.isOverseas && (
            <span
              title="Overseas Player"
              className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-lg"
            >
              <Plane className="w-3 h-3" /> Overseas
            </span>
          )}
        </div>

        {/* Player Details */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${roleColor}`}>
              {player.role}
            </span>
            {player.country && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                {player.country}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-400">
              Lot #{player.orderIndex}
            </span>
          </div>

          <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white tracking-wide">
            {player.name}
          </h2>

          {player.stats?.highlights && (
            <p className="text-xs text-slate-400 mt-1 max-w-xl italic flex items-center gap-1.5 justify-center md:justify-start">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              "{player.stats.highlights}"
            </p>
          )}

          {/* Stats Bar */}
          {player.stats && (player.stats.matches > 0 || player.stats.runs !== undefined || player.stats.wickets !== undefined) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 max-w-lg">
              {player.stats.matches > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Matches</div>
                  <div className="font-display text-base font-extrabold text-slate-200">
                    {player.stats.matches}
                  </div>
                </div>
              )}

            {player.stats.runs !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Runs</div>
                <div className="font-display text-base font-extrabold text-emerald-400">
                  {player.stats.runs.toLocaleString()}
                </div>
              </div>
            )}

            {player.stats.strikeRate !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Strike Rate</div>
                <div className="font-display text-base font-extrabold text-amber-400">
                  {player.stats.strikeRate}
                </div>
              </div>
            )}

            {player.stats.wickets !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Wickets</div>
                <div className="font-display text-base font-extrabold text-sky-400">
                  {player.stats.wickets}
                </div>
              </div>
            )}

            {player.stats.economy !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Economy</div>
                <div className="font-display text-base font-extrabold text-teal-400">
                  {player.stats.economy}
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Pricing & High Bidder Badge */}
        <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Base Reserve Price
          </div>
          <div className="font-display text-lg font-bold text-slate-300">
            {formatCurrency(player.basePrice)}
          </div>

          <div className="w-full my-3 border-t border-slate-800" />

          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Current Highest Bid
          </div>
          <div className="font-display text-3xl font-black text-amber-300 tracking-tight">
            {player.currentBid > 0 ? formatCurrency(player.currentBid) : 'No Bids Yet'}
          </div>

          {highBidderTeam ? (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-md">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: highBidderTeam.primaryColor }}
              />
              <span className="font-display font-bold text-xs text-white">
                {highBidderTeam.name} ({highBidderTeam.code})
              </span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 italic">Awaiting opening bid</div>
          )}
        </div>
      </div>
    </div>
  );
};
