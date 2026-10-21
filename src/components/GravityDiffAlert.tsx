import React from 'react';
import { Zap, X, ArrowRight, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { GravityChangeAlert } from '../types/simulation';
import { formatForce } from '../utils/formatting';

interface GravityDiffAlertProps {
  alert: GravityChangeAlert | null;
  onDismiss: () => void;
}

export const GravityDiffAlert: React.FC<GravityDiffAlertProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;

  const isDecrease = alert.percentChange < 0;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="glass-panel-glow rounded-2xl p-4 text-slate-100 border border-cyan-500/50 shadow-2xl shadow-cyan-500/10">
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-cyan-300 font-mono">
                {alert.title}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 ${
                isDecrease
                  ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
              }`}
            >
              {isDecrease ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{alert.percentChange > 0 ? `+${alert.percentChange}%` : `${alert.percentChange}%`}</span>
            </span>

            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mb-3">{alert.description}</p>

        {/* Before vs After comparison bar */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Before Action</span>
            <span className="text-slate-200 font-semibold">{formatForce(alert.beforeForceN)}</span>
          </div>

          <div>
            <span className="text-[10px] text-cyan-400 uppercase block">After Action</span>
            <span className="text-cyan-300 font-bold">{formatForce(alert.afterForceN)}</span>
          </div>
        </div>

        {/* Additional bulleted details */}
        {alert.details && alert.details.length > 0 && (
          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            {alert.details.map((detail, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="text-cyan-400">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
