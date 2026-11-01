import React, { useState } from 'react';
import {
  Zap,
  Wallet,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Crown,
  Plane,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { Team } from '../types';

export const FranchiseDesk: React.FC = () => {
  const {
    snapshot,
    placeBid,
    formatCurrency,
    lastLatencyMs,
  } = useAuction();

  const [bidError, setBidError] = useState<{ teamId: string; message: string } | null>(null);
  const [biddingTeamId, setBiddingTeamId] = useState<string | null>(null);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Loading Franchise Desk...</p>
      </div>
    );
  }

  const { session, currentPlayer, teams, nextMinimumBid, nextIncrement, bidHistory } = snapshot;

  const isBiddingActive =
    session.status === 'BIDDING_ACTIVE' ||
    session.status === 'HAMMER_GOING_1' ||
    session.status === 'HAMMER_GOING_2' ||
    session.status === 'HAMMER_FINAL_CALL';

  const handleTeamBid = async (team: Team) => {
    if (!currentPlayer) return;
    setBidError(null);
    setBiddingTeamId(team.id);

    try {
      const res = await placeBid(currentPlayer.id, team.id, nextMinimumBid);
      if (!res.success) {
        setBidError({
          teamId: team.id,
          message: res.reason || 'Bid rejected by rules engine',
        });
        setTimeout(() => setBidError(null), 4000);
      }
    } finally {
      setBiddingTeamId(null);
    }
  };

  const highBidderTeam = teams.find((t) => t.id === currentPlayer?.currentHighBidderId) || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white tracking-wide">
              FRANCHISE DESK
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Live 8-Team Grid War Room • One-Click Tactical Bidding
            </p>
          </div>
        </div>

        {/* Global Latency & Floor Status Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isBiddingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              {session.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>{lastLatencyMs ? `${lastLatencyMs} ms` : '< 20 ms'}</span>
          </div>
        </div>
      </div>

      {/* Current Player on the Block - Spotlight Strip */}
      <div className="relative overflow-hidden rounded-3xl p-5 lg:p-6 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: highBidderTeam?.primaryColor || '#38bdf8' }}
        />

        {currentPlayer ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Player Info */}
            <div className="flex items-center gap-4 text-center lg:text-left">
              <div className="relative shrink-0">
                <img
                  src={currentPlayer.avatarUrl}
                  alt={currentPlayer.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
                />
                {currentPlayer.isOverseas && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                    <Plane className="w-2.5 h-2.5" /> Overseas
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-amber-400">
                    Lot #{currentPlayer.orderIndex} • {currentPlayer.role}
                  </span>
                  <span className="text-xs text-slate-400">{currentPlayer.country}</span>
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-white mt-0.5">
                  {currentPlayer.name}
                </h2>
                <p className="text-xs text-slate-400 italic max-w-md line-clamp-1 mt-0.5">
                  "{currentPlayer.stats.highlights}"
                </p>
              </div>
            </div>

            {/* Current Price & High Bidder Callout */}
            <div className="flex items-center gap-4 sm:gap-6 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl shrink-0">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Base Price</div>
                <div className="font-display font-extrabold text-sm text-slate-300">
                  {formatCurrency(currentPlayer.basePrice)}
                </div>
              </div>

              <div className="w-px h-8 bg-slate-800" />

              <div>
                <div className="text-[10px] uppercase font-extrabold text-amber-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Current High Bid
                </div>
                <div className="font-display font-black text-xl md:text-2xl text-amber-300">
                  {currentPlayer.currentBid > 0
                    ? formatCurrency(currentPlayer.currentBid)
                    : 'Awaiting Bid'}
                </div>
              </div>

              <div className="w-px h-8 bg-slate-800" />

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Leader</div>
                {highBidderTeam ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: highBidderTeam.primaryColor }}
                    />
                    <span className="font-display font-bold text-xs text-white">
                      {highBidderTeam.code}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">None</span>
                )}
              </div>

              <div className="w-px h-8 bg-slate-800" />

              <div>
                <div className="text-[10px] uppercase font-bold text-sky-400">Next Bid</div>
                <div className="font-display font-black text-sm text-sky-300">
                  {formatCurrency(nextMinimumBid)}
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">
                  (+{formatCurrency(nextIncrement)})
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Auctioneer is preparing the next player for the block.</span>
          </div>
        )}
      </div>

      {/* Global Bid Error Banner if any */}
      {bidError && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2.5 shadow-xl animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong className="font-bold text-rose-300">Bid Rejection:</strong> {bidError.message}
          </span>
        </div>
      )}

      {/* 
        ========================================================================
        8-TEAM GRID MODE LAYOUT (Matching User Wireframe 4x2 Matrix)
        Row 1: Team 1, Team 2, Team 3, Team 4
        Row 2: Team 5, Team 6, Team 7, Team 8
        Inside each box:
        - Team Name / Label
        - Themed Yellow / Franchise Logo Container
        - Wallet Bal: ₹XX.XX Cr
        - Players: 0/11
        - Big tactile [BID] button right below the box
        ========================================================================
      */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Franchise Floor Matrix (Grid Mode)
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Click [BID] on any franchise to fire a live bid with sub-50ms latency
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teams.map((team, idx) => {
            const isLeading = currentPlayer?.currentHighBidderId === team.id;
            const basePriceReserve = session.minBasePrice || 20000000;
            const targetSlots = session.totalPlayersPerTeam || team.maxSlots || team.minSlots || 11;
            const remainingSlotsNeeded = Math.max(0, targetSlots - team.currentSlots - 1);
            const requiredReserve = remainingSlotsNeeded * basePriceReserve;
            const maxAffordableBid = Math.max(0, team.remainingPurse - requiredReserve);

            const hasPureFunds = team.remainingPurse >= nextMinimumBid;
            const canAfford = nextMinimumBid <= maxAffordableBid;
            const isReserveLocked = hasPureFunds && !canAfford;
            const hasSlots = team.currentSlots < team.maxSlots;
            const hasOverseasSlots =
              !currentPlayer?.isOverseas || team.currentOverseas < team.maxOverseas;
            const isSubmitting = biddingTeamId === team.id;

            const isBidDisabled =
              !isBiddingActive ||
              isLeading ||
              !canAfford ||
              !hasSlots ||
              !hasOverseasSlots ||
              isSubmitting ||
              !currentPlayer;

            return (
              <div
                key={team.id}
                className={`flex flex-col rounded-3xl bg-slate-900 border transition-all duration-300 shadow-xl overflow-hidden relative group ${
                  isLeading
                    ? 'border-emerald-400/90 ring-4 ring-emerald-500/20 shadow-emerald-500/10 glow-green'
                    : isReserveLocked
                    ? 'border-amber-500/30 hover:border-amber-500/60'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-2xl'
                }`}
              >
                {/* Team Label on Top (e.g. Team 1, Team 2) */}
                <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="font-display font-black text-xs text-white uppercase tracking-wider">
                    Team {idx + 1}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${team.primaryColor}25`,
                      color: team.primaryColor === '#000000' ? '#ffffff' : team.primaryColor,
                      border: `1px solid ${team.primaryColor}55`,
                    }}
                  >
                    {team.code}
                  </span>
                </div>

                {/* 
                  Yellow / Franchise Logo Box
                  (styled in prominent gold/yellow container as shown in the wireframe)
                */}
                <div className="p-4 flex flex-col items-center justify-center bg-gradient-to-b from-amber-400/15 via-amber-300/10 to-transparent border-b border-slate-800/60 relative">
                  {/* Leading Crown Badge */}
                  {isLeading && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-display font-black text-[9px] uppercase tracking-wider shadow-md animate-bounce-subtle">
                      <Crown className="w-3 h-3 fill-slate-950" />
                      <span>LEADER</span>
                    </div>
                  )}

                  {/* Logo Display */}
                  <div
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 transition-transform duration-300 group-hover:scale-105 overflow-hidden"
                    style={{
                      backgroundColor: '#fef08a', // Distinctive yellow box background from wireframe
                      borderColor: team.primaryColor,
                    }}
                  >
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-full h-full object-contain p-1.5"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <>
                        <span
                          className="font-display font-black text-2xl tracking-wider"
                          style={{ color: team.primaryColor }}
                        >
                          {team.code}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase text-slate-900 tracking-tight">
                          LOGO
                        </span>
                      </>
                    )}
                  </div>

                  <div className="font-display font-extrabold text-sm text-white mt-2 text-center truncate w-full px-2">
                    {team.name}
                  </div>
                </div>

                {/* 
                  Box Information (Matching user wireframe note exactly):
                  Wallet Bal: ...
                  Players: 0/11
                */}
                <div className="p-4 space-y-2 bg-slate-900/50 flex-1">
                  {/* Wallet Balance */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Wallet Bal:</span>
                    </span>
                    <div className="text-right">
                      <span className="font-display font-extrabold text-sm text-emerald-400 block">
                        {formatCurrency(team.remainingPurse)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Max: {formatCurrency(team.totalPurse)}
                      </span>
                    </div>
                  </div>

                  {/* Players Slots: 0/11 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>Players:</span>
                    </span>
                    <span className="font-display font-bold text-xs text-white">
                      {team.currentSlots} / {team.maxSlots}
                      {team.currentOverseas > 0 && (
                        <span className="text-amber-400 ml-1">({team.currentOverseas} OS)</span>
                      )}
                    </span>
                  </div>

                  {/* Slot Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(team.currentSlots / team.maxSlots) * 100}%`,
                        backgroundColor: team.primaryColor,
                      }}
                    />
                  </div>

                  {/* Purse Reserve & Max Bid Limit Indicator */}
                  {remainingSlotsNeeded > 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>Max Bid Cap:</span>
                      </span>
                      <span className={`font-bold ${isReserveLocked ? 'text-amber-400' : 'text-slate-300'}`}>
                        {formatCurrency(maxAffordableBid)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 
                  Dedicated One-Click [BID] Button
                  (Centered under each box as shown in wireframe)
                */}
                <div className="p-3 bg-slate-950/90 border-t border-slate-800">
                  <button
                    onClick={() => handleTeamBid(team)}
                    disabled={isBidDisabled}
                    className={`w-full py-3 px-4 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg ${
                      isLeading
                        ? 'bg-emerald-500 text-slate-950 cursor-default font-black shadow-emerald-500/25 ring-2 ring-emerald-400'
                        : isReserveLocked
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40 cursor-not-allowed text-xs'
                        : !hasPureFunds
                        ? 'bg-slate-800 text-rose-400 border border-rose-900/50 cursor-not-allowed text-xs'
                        : !hasSlots
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed text-xs'
                        : !isBiddingActive
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:scale-[1.02] active:scale-[0.97] shadow-amber-400/20'
                    }`}
                  >
                    {isLeading ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-400 stroke-[3]" />
                        <span>HIGHEST BIDDER</span>
                      </>
                    ) : isSubmitting ? (
                      <span>TRANSACTING...</span>
                    ) : isReserveLocked ? (
                      <span className="text-[11px] leading-tight text-center">
                        RESERVE LOCKED
                        <span className="block text-[9px] font-normal opacity-80">
                          (Save {formatCurrency(requiredReserve)} for {remainingSlotsNeeded} slots)
                        </span>
                      </span>
                    ) : !hasPureFunds ? (
                      <span>LOW BALANCE</span>
                    ) : !hasSlots ? (
                      <span>SQUAD FULL ({team.maxSlots}/{team.maxSlots})</span>
                    ) : !isBiddingActive ? (
                      <span>BID CLOSED</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>BID {formatCurrency(nextMinimumBid)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Activity Stream (Recent Bids) */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="font-display font-bold text-sm text-slate-200">
              Live Bid Ticker for Current Lot
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {bidHistory.length} total bids placed
          </span>
        </div>

        {bidHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No bids submitted yet for this lot. Click [BID] on any franchise above to place the
            opening bid!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...bidHistory].reverse().slice(0, 8).map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  i === 0
                    ? 'bg-amber-500/10 border-amber-400/50 text-amber-300 font-bold shadow-sm'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: b.teamColor }}
                />
                <span className="font-display font-bold">{b.teamCode}</span>
                <span>{formatCurrency(b.bidAmount)}</span>
                {b.serverLatencyMs !== undefined && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {b.serverLatencyMs}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
