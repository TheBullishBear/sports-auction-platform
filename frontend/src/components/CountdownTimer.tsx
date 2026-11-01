import React from 'react';
import { Gavel, CheckCircle2, XCircle, Flame, Layers } from 'lucide-react';
import { AuctionStatus } from '../types';

interface CountdownTimerProps {
  status: AuctionStatus;
  seconds?: number;
  maxSeconds?: number;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ status }) => {
  const getVisualConfig = () => {
    switch (status) {
      case 'SOLD':
        return {
          icon: <CheckCircle2 className="w-10 h-10 text-emerald-400 stroke-[2.5]" />,
          title: 'OFFICIALLY SOLD',
          subtitle: 'Hammer dropped by Auctioneer',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          glow: 'glow-green',
        };
      case 'UNSOLD':
        return {
          icon: <XCircle className="w-10 h-10 text-rose-400 stroke-[2.5]" />,
          title: 'LOT UNSOLD',
          subtitle: 'Passed by Auctioneer',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glow: 'glow-red',
        };
      case 'HAMMER_GOING_1':
        return {
          icon: <Gavel className="w-10 h-10 text-amber-400 animate-gavel" />,
          title: 'GOING ONCE',
          subtitle: 'First warning call',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glow: 'glow-gold',
        };
      case 'HAMMER_GOING_2':
        return {
          icon: <Gavel className="w-10 h-10 text-orange-400 animate-gavel" />,
          title: 'GOING TWICE',
          subtitle: 'Fair warning call',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          glow: 'glow-gold',
        };
      case 'HAMMER_FINAL_CALL':
        return {
          icon: <Flame className="w-10 h-10 text-rose-400 animate-bounce-subtle" />,
          title: 'FINAL CALL',
          subtitle: 'Last chance to bid',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glow: 'glow-red',
        };
      case 'BIDDING_ACTIVE':
        return {
          icon: <Gavel className="w-10 h-10 text-sky-400" />,
          title: 'BIDDING OPEN',
          subtitle: 'Manual Floor Active',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          glow: 'glow-blue',
        };
      case 'BID_PENDING':
        return {
          icon: <Layers className="w-10 h-10 text-amber-400" />,
          title: 'ON THE BLOCK',
          subtitle: 'Awaiting Auctioneer to Open',
          badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          glow: '',
        };
      default:
        return {
          icon: <Layers className="w-10 h-10 text-slate-500" />,
          title: 'FLOOR IDLE',
          subtitle: 'No active player',
          badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
          glow: '',
        };
    }
  };

  const config = getVisualConfig();

  return (
    <div
      className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md transition-all ${config.glow}`}
    >
      <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 shadow-inner">
        {config.icon}
      </div>

      <div className="text-center">
        <h4 className="font-display font-black text-lg text-white tracking-wide">
          {config.title}
        </h4>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{config.subtitle}</p>
      </div>

      <div
        className={`mt-3 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${config.badgeColor}`}
      >
        {status.replace(/_/g, ' ')}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-medium">
        Floor Pace: Auctioneer Manual Gavel Control
      </div>
    </div>
  );
};
