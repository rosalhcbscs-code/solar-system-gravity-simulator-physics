import React from 'react';
import { Orbit, Play, Pause, RotateCcw, Eye, Compass, BookOpen, Cpu, Grid, Layers, Scale } from 'lucide-react';
import { SimulationConfig } from '../types/simulation';
import { formatSimTime } from '../utils/formatting';

interface TopNavProps {
  config: SimulationConfig;
  simSecondsElapsed: number;
  onTogglePlay: () => void;
  onResetSim: () => void;
  onToggleScaleMode: () => void;
  onResetCamera: () => void;
  onTopDownCamera: () => void;
  onFocusSun: () => void;
  onOpenForceComparison: () => void;
  onOpenExperiments: () => void;
  onOpenEquations: () => void;
  onOpenForceMatrix: () => void;
  onOpenEducational: () => void;
  onBackToLanding: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  config,
  simSecondsElapsed,
  onTogglePlay,
  onResetSim,
  onToggleScaleMode,
  onResetCamera,
  onTopDownCamera,
  onFocusSun,
  onOpenForceComparison,
  onOpenExperiments,
  onOpenEquations,
  onOpenForceMatrix,
  onOpenEducational,
  onBackToLanding,
}) => {
  const timeFormatted = formatSimTime(simSecondsElapsed);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 h-16 px-4 md:px-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-[#050716]/95 via-[#070a20]/80 to-transparent backdrop-blur-md border-b border-slate-800/60 select-none">
      {/* Left branding and back button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBackToLanding}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer group"
          title="Return to landing page"
        >
          <Orbit className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Overview</span>
        </button>

        <div className="hidden lg:block h-5 w-[1px] bg-slate-800" />

        <div className="hidden md:flex flex-col">
          <div className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            Solar System Gravity Simulator
          </div>
          <div className="text-[10px] text-cyan-400/80 font-mono flex items-center space-x-1.5">
            <span>Newtonian N-Body Physics Engine</span>
          </div>
        </div>

        {/* Scale Mode Switch Pill */}
        <button
          onClick={onToggleScaleMode}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all cursor-pointer ${
            config.scaleMode === 'visual'
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
              : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
          }`}
          title="Toggle between Visual Compressed Scale and Realistic Astronomical Scale"
        >
          <Scale className="w-3.5 h-3.5" />
          <span className="capitalize">{config.scaleMode} Scale</span>
        </button>
      </div>

      {/* Center status and time elapsed */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-md ${
            config.isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-amber-500/10'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-emerald-500/10'
          }`}
          title={config.isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {config.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
        </button>

        {/* Reset button */}
        <button
          onClick={onResetSim}
          className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Reset Planetary Positions and Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Time display */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Simulated Time
          </div>
          <div className="text-xs sm:text-sm font-mono font-semibold text-white tracking-wide">
            {timeFormatted.years} <span className="text-slate-400 font-normal">({timeFormatted.days})</span>
          </div>
        </div>

        {/* Speed indicator */}
        <div className="hidden sm:flex flex-col items-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Warp Speed
          </div>
          <div className="text-xs font-mono font-semibold text-cyan-300">
            {config.speedMultiplier}×
          </div>
        </div>
      </div>

      {/* Right Action Tools & Modals */}
      <div className="flex items-center space-x-1.5 md:space-x-2">
        {/* Quick Camera Presets */}
        <button
          onClick={onFocusSun}
          className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
          title="Center Camera on the Sun"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Center Sun</span>
        </button>

        <button
          onClick={onTopDownCamera}
          className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
          title="Top-down Ecliptic View"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Top-Down</span>
        </button>

        {/* Force Comparison Tool */}
        <button
          onClick={onOpenForceComparison}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-400 text-indigo-200 hover:text-white text-xs transition-all cursor-pointer"
          title="Compare Gravitational Forces between any two bodies"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* Experiment Mode */}
        <button
          onClick={onOpenExperiments}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 text-purple-200 hover:text-white text-xs transition-all cursor-pointer"
          title="Run Gravity Experiments (remove Jupiter, increase Sun mass, etc.)"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Experiment</span>
        </button>

        {/* Physics & Equations */}
        <button
          onClick={onOpenEquations}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
          title="View Physics Equations & Variables"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Equations</span>
        </button>

        {/* Force Matrix */}
        <button
          onClick={onOpenForceMatrix}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
          title="View N×N Gravitational Interaction Matrix"
        >
          <Grid className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Matrix</span>
        </button>

        {/* Educational Guide */}
        <button
          onClick={onOpenEducational}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
          title="Open Educational Gravity Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Guide</span>
        </button>
      </div>
    </header>
  );
};
