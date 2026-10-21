import React, { useState } from 'react';
import { X, Grid, Info, Sparkles } from 'lucide-react';
import { BodyState, CelestialBodyDefinition } from '../types/simulation';
import { computeGravitationalForce } from '../physics/calculations';
import { formatForce, formatDistance, formatAcceleration } from '../utils/formatting';

interface ForceMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodies: BodyState[];
  definitions: CelestialBodyDefinition[];
}

export const ForceMatrixModal: React.FC<ForceMatrixModalProps> = ({
  isOpen,
  onClose,
  bodies,
  definitions,
}) => {
  const [selectedPair, setSelectedPair] = useState<{ id1: string; id2: string } | null>(null);

  if (!isOpen) return null;

  // Filter bodies to only active ones
  const activeBodies = bodies.filter((b) => b.active);

  // Compute force between selected pair if any
  let pairDetail = null;
  if (selectedPair) {
    const b1 = bodies.find((b) => b.id === selectedPair.id1);
    const b2 = bodies.find((b) => b.id === selectedPair.id2);
    const d1 = definitions.find((d) => d.id === selectedPair.id1);
    const d2 = definitions.find((d) => d.id === selectedPair.id2);

    if (b1 && b2 && d1 && d2) {
      const calc = computeGravitationalForce(b1.currentMassKg, b2.currentMassKg, b1.posAu, b2.posAu);
      pairDetail = {
        d1,
        d2,
        b1,
        b2,
        calc,
        a1: b1.currentMassKg > 0 ? calc.forceN / b1.currentMassKg : 0,
        a2: b2.currentMassKg > 0 ? calc.forceN / b2.currentMassKg : 0,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl glass-panel-glow rounded-3xl p-6 text-slate-100 shadow-2xl border border-indigo-500/30 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Grid className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                N×N Gravitational Interaction Matrix
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time pairwise forces (F = G · m₁m₂ / r²) between all active bodies
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

        {/* Scrollable Matrix Grid */}
        <div className="flex-1 overflow-auto border border-slate-800/80 rounded-2xl bg-slate-950/70 p-3 mb-4">
          <table className="w-full border-collapse text-[11px] font-mono">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 font-normal border-b border-slate-800">
                  Body
                </th>
                {activeBodies.map((b) => {
                  const def = definitions.find((d) => d.id === b.id);
                  return (
                    <th key={b.id} className="p-2 text-center border-b border-slate-800 text-slate-300">
                      <span className="block text-xs">{def?.symbol}</span>
                      <span className="text-[10px] text-slate-400">{def?.name.substring(0, 3)}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeBodies.map((rowBody) => {
                const rowDef = definitions.find((d) => d.id === rowBody.id);
                return (
                  <tr key={rowBody.id} className="hover:bg-slate-900/40 border-b border-slate-800/40">
                    <td className="p-2 font-medium text-slate-300 whitespace-nowrap">
                      {rowDef?.symbol} {rowDef?.name}
                    </td>

                    {activeBodies.map((colBody) => {
                      if (rowBody.id === colBody.id) {
                        return (
                          <td key={colBody.id} className="p-2 text-center text-slate-600 bg-slate-900/20">
                            —
                          </td>
                        );
                      }

                      const calc = computeGravitationalForce(
                        rowBody.currentMassKg,
                        colBody.currentMassKg,
                        rowBody.posAu,
                        colBody.posAu
                      );

                      // Intensity styling based on log force
                      const logF = Math.log10(Math.max(1, calc.forceN));
                      let bgClass = 'text-slate-400';
                      if (logF >= 22) {
                        bgClass = 'bg-rose-950/40 text-rose-300 font-bold border border-rose-500/30';
                      } else if (logF >= 20) {
                        bgClass = 'bg-purple-950/30 text-purple-300 font-medium';
                      } else if (logF >= 18) {
                        bgClass = 'bg-indigo-950/30 text-indigo-300';
                      }

                      const isSelected =
                        selectedPair &&
                        ((selectedPair.id1 === rowBody.id && selectedPair.id2 === colBody.id) ||
                          (selectedPair.id1 === colBody.id && selectedPair.id2 === rowBody.id));

                      return (
                        <td
                          key={colBody.id}
                          onClick={() => setSelectedPair({ id1: rowBody.id, id2: colBody.id })}
                          className={`p-2 text-center cursor-pointer transition-all ${bgClass} ${
                            isSelected ? 'ring-2 ring-cyan-400 bg-cyan-950/60' : 'hover:opacity-80'
                          }`}
                          title={`Force between ${rowDef?.name} and ${colBody.id}: ${formatForce(calc.forceN)}`}
                        >
                          {calc.forceN === 0 ? '0' : formatForce(calc.forceN).split(' ')[0]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Pair Detail Card */}
        {pairDetail ? (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white flex items-center space-x-2">
                <span>{pairDetail.d1.symbol} {pairDetail.d1.name}</span>
                <span className="text-slate-400">↔</span>
                <span>{pairDetail.d2.symbol} {pairDetail.d2.name}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                Mutual Attraction: <span className="text-cyan-300 font-bold">{formatForce(pairDetail.calc.forceN)}</span>
                {' • '}
                Separation: <span className="text-slate-200">{formatDistance(pairDetail.calc.distanceAu).auStr}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
              <div>
                <span>{pairDetail.d1.name} Acc: </span>
                <span className="text-white font-semibold">{formatAcceleration(pairDetail.a1)}</span>
              </div>
              <div>
                <span>{pairDetail.d2.name} Acc: </span>
                <span className="text-white font-semibold">{formatAcceleration(pairDetail.a2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-slate-500 text-center py-2">
            Click any cell in the matrix above to view detailed interaction analysis
          </div>
        )}
      </div>
    </div>
  );
};
