import { History, Zap, Clock } from 'lucide-react';
import { BidLedgerEntry } from '../types';
import { useAuction } from '../context/AuctionContext';

interface BiddingTickerProps {
  bids: BidLedgerEntry[];
  maxHeight?: string;
}

export const BiddingTicker: React.FC<BiddingTickerProps> = ({ bids, maxHeight = 'max-h-[380px]' }) => {
  const { formatCurrency } = useAuction();

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-bold text-sm text-slate-200">Live Bidding Log</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
          {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}
        </span>
      </div>

      <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${maxHeight}`}>
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
            <Clock className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-xs">No bids entered for this lot yet.</p>
          </div>
        ) : (
          [...bids].reverse().map((bid, idx) => {
            const isHighest = idx === 0;
            const timeStr = new Date(bid.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={bid.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                  isHighest
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/5'
                    : 'bg-slate-800/40 border-slate-800/70 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isHighest
                        ? 'bg-amber-400 text-slate-950 font-display'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{bid.bidSequence}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: bid.teamColor }}
                    />
                    <div>
                      <div className="font-display font-bold text-xs text-white leading-tight flex items-center gap-1.5">
                        {bid.teamName}
                        {isHighest && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{timeStr}</span>
                        {bid.serverLatencyMs !== undefined && (
                          <span className="text-emerald-400 flex items-center gap-0.5 font-mono">
                            <Zap className="w-2.5 h-2.5" />
                            {bid.serverLatencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-display font-extrabold text-sm ${
                      isHighest ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    {formatCurrency(bid.bidAmount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
