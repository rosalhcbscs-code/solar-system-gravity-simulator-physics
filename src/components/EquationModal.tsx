import React, { useState } from 'react';
import { X, Cpu, BookOpen, CheckCircle2 } from 'lucide-react';
import { PHYSICS_EQUATIONS } from '../data/educational';

interface EquationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EquationModal: React.FC<EquationModalProps> = ({ isOpen, onClose }) => {
  const [selectedEqId, setSelectedEqId] = useState(PHYSICS_EQUATIONS[0].id);

  if (!isOpen) return null;

  const currentEquation = PHYSICS_EQUATIONS.find((e) => e.id === selectedEqId) || PHYSICS_EQUATIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-3xl p-6 text-slate-100 shadow-2xl border border-indigo-500/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Physics & Mathematical Foundations
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                The governing formulas of Newtonian celestial mechanics
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

        {/* Horizontal Equation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-slate-800/80 mb-4 shrink-0">
          {PHYSICS_EQUATIONS.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEqId(eq.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                selectedEqId === eq.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {eq.title.split(' ')[0]} {eq.title.includes('Verlet') ? 'Verlet' : eq.title.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Main Equation Detail Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Formula Display Box */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 p-5 text-center shadow-inner">
            <div className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1">
              {currentEquation.title}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wider my-2 text-glow">
              {currentEquation.formula}
            </div>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              {currentEquation.purpose}
            </p>
          </div>

          {/* Variable Breakdown Table */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Variable Definitions & Physical Units</span>
            </h3>

            <div className="divide-y divide-slate-800/80">
              {currentEquation.variables.map((v) => (
                <div key={v.symbol} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0">
                      {v.symbol}
                    </span>
                    <div>
                      <span className="font-semibold text-white">{v.name}</span>
                      <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                        {v.description}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-purple-300 sm:text-right shrink-0">
                    {v.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Explanation */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wide text-cyan-400">
              Scientific Explanation
            </h4>
            <p className="leading-relaxed text-slate-300">{currentEquation.explanation}</p>
            <div className="pt-2 border-t border-slate-800/60">
              <span className="font-semibold text-amber-300 block mb-0.5">Real Solar System Example:</span>
              <p className="text-slate-400 font-mono text-[11px]">{currentEquation.example}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
