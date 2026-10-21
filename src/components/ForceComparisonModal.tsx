import React, { useState } from 'react';
import { X, Scale, ArrowRightLeft, Sparkles, Compass } from 'lucide-react';
import { BodyState, CelestialBodyDefinition } from '../types/simulation';
import { computeGravitationalForce } from '../physics/calculations';
import { formatMass, formatForce, formatAcceleration, formatDistance } from '../utils/formatting';

interface ForceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodies: BodyState[];
  definitions: CelestialBodyDefinition[];
  initialBodyAId?: string;
  initialBodyBId?: string;
}

export const ForceComparisonModal: React.FC<ForceComparisonModalProps> = ({
  isOpen,
  onClose,
  bodies,
  definitions,
  initialBodyAId = 'earth',
  initialBodyBId = 'sun',
}) => {
  const [bodyAId, setBodyAId] = useState(initialBodyAId);
  const [bodyBId, setBodyBId] = useState(initialBodyBId === initialBodyAId ? 'jupiter' : initialBodyBId);

  if (!isOpen) return null;

  const defA = definitions.find((d) => d.id === bodyAId);
  const defB = definitions.find((d) => d.id === bodyBId);
  const stateA = bodies.find((b) => b.id === bodyAId);
  const stateB = bodies.find((b) => b.id === bodyBId);

  if (!defA || !defB || !stateA || !stateB) return null;

  // Compute gravitational force and distances
  const result = computeGravitationalForce(
    stateA.currentMassKg,
    stateB.currentMassKg,
    stateA.posAu,
    stateB.posAu
  );

  const accA = stateA.currentMassKg > 0 ? result.forceN / stateA.currentMassKg : 0;
  const accB = stateB.currentMassKg > 0 ? result.forceN / stateB.currentMassKg : 0;

  // Ratio calculation
  const massRatio = stateA.currentMassKg / (stateB.currentMassKg || 1);
  const accRatio = accA / (accB || 1e-15);

  const distFormatted = formatDistance(result.distanceAu);

  const swapBodies = () => {
    const temp = bodyAId;
    setBodyAId(bodyBId);
    setBodyBId(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel-glow rounded-3xl p-6 text-slate-100 shadow-2xl border border-indigo-500/30 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Scale className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Gravitational Force Comparison
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Newton's Third Law & Universal Gravitation Analyzer
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

        {/* Body Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center mb-6">
          {/* Object A Selector */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
              Primary Body (Object A)
            </label>
            <select
              value={bodyAId}
              onChange={(e) => setBodyAId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {definitions.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id === bodyBId}>
                  {d.symbol} {d.name} ({d.category})
                </option>
              ))}
            </select>
            <div className="mt-2 text-[11px] font-mono text-slate-400">
              Mass: <span className="text-slate-200">{formatMass(stateA.currentMassKg)}</span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapBodies}
            className="mx-auto p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Swap Object A and B"
          >
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Object B Selector */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-purple-400 mb-1">
              Secondary Body (Object B)
            </label>
            <select
              value={bodyBId}
              onChange={(e) => setBodyBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {definitions.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id === bodyAId}>
                  {d.symbol} {d.name} ({d.category})
                </option>
              ))}
            </select>
            <div className="mt-2 text-[11px] font-mono text-slate-400">
              Mass: <span className="text-slate-200">{formatMass(stateB.currentMassKg)}</span>
            </div>
          </div>
        </div>

        {/* Calculation Result Hero Card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-950 to-purple-950/50 border border-indigo-500/30 p-5 mb-5 shadow-xl text-center">
          <div className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 mb-1">
            Mutual Gravitational Attraction (F₁₂ = F₂₁)
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono text-white tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {formatForce(result.forceN)}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono flex items-center justify-center space-x-2">
            <span>Separation Distance:</span>
            <span className="text-cyan-300 font-semibold">{distFormatted.auStr}</span>
            <span>({distFormatted.kmStr})</span>
          </div>
        </div>

        {/* Acceleration Asymmetry & Comparison Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 mb-1 text-cyan-400 font-mono font-medium">
              <span>{defA.symbol} Acceleration of {defA.name}</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mb-1">
              {formatAcceleration(accA)}
            </div>
            <p className="text-[11px] text-slate-400">
              a₁ = F / m₁ = {formatForce(result.forceN)} / {formatMass(stateA.currentMassKg)}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 mb-1 text-purple-400 font-mono font-medium">
              <span>{defB.symbol} Acceleration of {defB.name}</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mb-1">
              {formatAcceleration(accB)}
            </div>
            <p className="text-[11px] text-slate-400">
              a₂ = F / m₂ = {formatForce(result.forceN)} / {formatMass(stateB.currentMassKg)}
            </p>
          </div>
        </div>

        {/* Educational Physics Takeaway */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Newton's Third Law in Action:</strong> Both {defA.name} and {defB.name} experience the
            exact same magnitude of gravitational force towards each other. However, because acceleration
            is inversely proportional to mass (a = F/m), the less massive body accelerates{' '}
            <span className="text-cyan-300 font-mono font-bold">
              {accRatio > 1 ? `${accRatio.toFixed(1)}× faster` : `${(1 / accRatio).toFixed(1)}× slower`}
            </span>
            !
          </p>
        </div>
      </div>
    </div>
  );
};
