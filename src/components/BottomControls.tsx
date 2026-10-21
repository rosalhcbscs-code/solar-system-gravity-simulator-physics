import React, { useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, ChevronDown, ChevronUp, Eye, Compass, Orbit, ArrowUpRight, Grid, Navigation } from 'lucide-react';
import { SimulationConfig } from '../types/simulation';

interface BottomControlsProps {
  config: SimulationConfig;
  onUpdateConfig: (newConfig: Partial<SimulationConfig>) => void;
  onTogglePlay: () => void;
  onResetSim: () => void;
  onStepForward: () => void;
}

const SPEED_PRESETS = [0.1, 0.5, 1, 2, 5, 10, 50, 100];

export const BottomControls: React.FC<BottomControlsProps> = ({
  config,
  onUpdateConfig,
  onTogglePlay,
  onResetSim,
  onStepForward,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl flex flex-col items-center pointer-events-auto select-none">
      {/* Collapse/Expand Toggle Pill Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all"
        title="Toggle HUD controls"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Show Simulation Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hide Controls (Cinema Mode)</span>
          </>
        )}
      </button>

      {/* Main Glassmorphic Dock Container */}
      {!isCollapsed && (
        <div className="w-full glass-panel-glow rounded-2xl p-3 md:p-4 text-slate-200 flex flex-col gap-3 shadow-2xl transition-all">
          {/* Top Row: Playback Controls & Speed Multipliers */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            {/* Play/Pause, Step, Reset Group */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onTogglePlay}
                className={`px-4 py-2 rounded-xl font-semibold text-xs tracking-wide flex items-center space-x-2 cursor-pointer transition-all shadow-md ${
                  config.isPaused
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {config.isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>START</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE</span>
                  </>
                )}
              </button>

              <button
                onClick={onStepForward}
                disabled={!config.isPaused}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                  config.isPaused
                    ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Advance simulation by 1 day (when paused)"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>+1 Day</span>
              </button>

              <button
                onClick={onResetSim}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Reset simulation time and planetary positions"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Multiplier Pills */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline">
                SPEED:
              </span>
              <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
                {SPEED_PRESETS.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onUpdateConfig({ speedMultiplier: spd })}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      config.speedMultiplier === spd
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Visual Layer Switches */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
              VISUAL LAYERS:
            </span>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Orbit Paths Toggle */}
              <button
                onClick={() => onUpdateConfig({ showOrbits: !config.showOrbits })}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  config.showOrbits
                    ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
                title="Toggle visual orbital path guides"
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Orbit Paths</span>
              </button>

              {/* Gravity Vectors Toggle */}
              <button
                onClick={() => onUpdateConfig({ showVectors: !config.showVectors })}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  config.showVectors
                    ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
                title="Toggle 3D gravitational acceleration and force arrows"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gravity Vectors</span>
              </button>

              {/* Planet Trails Toggle */}
              <button
                onClick={() => onUpdateConfig({ showTrails: !config.showTrails })}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  config.showTrails
                    ? 'bg-purple-950/70 border-purple-500/40 text-purple-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
                title="Toggle trajectory trails tracing orbital movement"
              >
                <Navigation className="w-3.5 h-3.5 text-purple-400" />
                <span>Trails</span>
              </button>

              {/* Spacetime Grid / Gravity Field View */}
              <button
                onClick={() => onUpdateConfig({ showGravityField: !config.showGravityField })}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  config.showGravityField
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
                title="Toggle 3D spacetime curvature grid depicting gravitational potential wells"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-400" />
                <span>Field Grid</span>
              </button>

              {/* Distance Line Toggle */}
              <button
                onClick={() => onUpdateConfig({ showDistanceLines: !config.showDistanceLines })}
                className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  config.showDistanceLines
                    ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
                title="Toggle direct center-to-center distance line to Sun"
              >
                <span className="font-mono text-xs">r</span>
                <span>Distance Line</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
