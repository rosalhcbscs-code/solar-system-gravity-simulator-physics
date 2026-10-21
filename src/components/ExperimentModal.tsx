import React from 'react';
import { X, Layers, AlertTriangle, Sparkles, RotateCcw, Flame, ShieldAlert, Zap } from 'lucide-react';
import { BodyState, SimulationConfig } from '../types/simulation';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
  bodies: BodyState[];
  onUpdateConfig: (newConfig: Partial<SimulationConfig>) => void;
  onToggleBody: (id: string) => void;
  onResetExperiments: () => void;
}

export const ExperimentModal: React.FC<ExperimentModalProps> = ({
  isOpen,
  onClose,
  config,
  bodies,
  onUpdateConfig,
  onToggleBody,
  onResetExperiments,
}) => {
  if (!isOpen) return null;

  const sunBody = bodies.find((b) => b.id === 'sun');
  const jupiterBody = bodies.find((b) => b.id === 'jupiter');

  const isSunActive = sunBody?.active ?? true;
  const isJupiterActive = jupiterBody?.active ?? true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel-glow rounded-3xl p-6 text-slate-100 shadow-2xl border border-indigo-500/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Gravity Laboratory & Experiment Mode
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Test counterfactual cosmic scenarios and alter physical parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Preset Scenario 1: Remove Jupiter */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">♃</span>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Scenario 1: What happens if Jupiter disappears?
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Status: {isJupiterActive ? 'Jupiter is Active' : 'Jupiter has vanished!'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onToggleBody('jupiter')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isJupiterActive
                    ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isJupiterActive ? 'Vanish Jupiter' : 'Restore Jupiter'}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Jupiter contains 71% of planetary mass. Its gravitational tug subtly perturbs Mars,
              Earth, and Saturn. When disabled, the mutual force drops to 0 N and the outer Solar
              System relaxes into pristine unperturbed Keplerian ellipses.
            </p>
          </div>

          {/* Preset Scenario 2: Remove the Sun (Catastrophic Educational Warning) */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">☀️</span>
                <div>
                  <h3 className="font-bold text-amber-300 text-sm flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Scenario 2: What happens if the Sun disappears?</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Status: {isSunActive ? 'Sun is Active (Dominant Mass)' : 'Sun has vanished!'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onToggleBody('sun')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isSunActive
                    ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isSunActive ? 'Extinguish Sun' : 'Reignite Sun'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              <strong>Educational Observation:</strong> The Sun provides the dominant gravitational
              influence (99.86% of total mass) that keeps planets in orbit. Removing it causes the
              planets to cease orbiting and continue approximately along their instantaneous tangential
              trajectories into deep space at their current orbital velocities!
            </div>
          </div>

          {/* Mass Multiplier Sliders */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Mass Scaling Experiments</span>
            </h3>

            {/* Jupiter Mass Multiplier Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white font-medium">Jupiter Mass Multiplier</span>
                <span className="font-mono font-bold text-purple-300">
                  {config.jupiterMassMultiplier.toFixed(1)}× ({(config.jupiterMassMultiplier * 1.898e27).toExponential(2)} kg)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={config.jupiterMassMultiplier}
                onChange={(e) => onUpdateConfig({ jupiterMassMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.1× (Sub-Saturn)</span>
                <span>1.0× (Standard)</span>
                <span>5.0× (Super-Jupiter)</span>
                <span>10.0× (Near Brown Dwarf)</span>
              </div>
            </div>

            {/* Sun Mass Multiplier Slider */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white font-medium">Sun Mass Multiplier</span>
                <span className="font-mono font-bold text-amber-300">
                  {config.sunMassMultiplier.toFixed(2)}× ({(config.sunMassMultiplier * 1.989e30).toExponential(2)} kg)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={config.sunMassMultiplier}
                onChange={(e) => onUpdateConfig({ sunMassMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.5× (Red Dwarf)</span>
                <span>1.0× (G-Type Sol)</span>
                <span>2.0× (Double Gravity)</span>
              </div>
            </div>
          </div>

          {/* Reset All Experiments Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onResetExperiments}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset All Experiment Parameters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
