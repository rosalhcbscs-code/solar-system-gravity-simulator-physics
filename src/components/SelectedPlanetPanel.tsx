import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Target, Scale, Zap, Compass, Info, ShieldAlert } from 'lucide-react';
import { BodyState, CelestialBodyDefinition } from '../types/simulation';
import { getPairwiseForces } from '../physics/calculations';
import { formatMass, formatForce, formatAcceleration, formatVelocity, formatDistance } from '../utils/formatting';

interface SelectedPlanetPanelProps {
  selectedBody: BodyState | null;
  allBodies: BodyState[];
  definitions: CelestialBodyDefinition[];
  onClose: () => void;
  onFocusCamera: (id: string) => void;
  onOpenForceComparisonWith: (id: string) => void;
  onToggleBody: (id: string) => void;
}

export const SelectedPlanetPanel: React.FC<SelectedPlanetPanelProps> = ({
  selectedBody,
  allBodies,
  definitions,
  onClose,
  onFocusCamera,
  onOpenForceComparisonWith,
  onToggleBody,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!selectedBody) return null;

  const def = definitions.find((d) => d.id === selectedBody.id);
  if (!def) return null;

  const bodyNames: Record<string, string> = {};
  definitions.forEach((d) => {
    bodyNames[d.id] = d.name;
  });

  // Calculate real-time pairwise forces acting on the selected planet from all other bodies
  const pairwiseForces = getPairwiseForces(allBodies, selectedBody.id, bodyNames);

  const distInfo = formatDistance(selectedBody.distanceFromSunAu);
  const netAcc = Math.sqrt(
    selectedBody.accMs2.x ** 2 + selectedBody.accMs2.y ** 2 + selectedBody.accMs2.z ** 2
  );

  return (
    <aside
      className={`absolute top-20 right-4 z-20 transition-all duration-300 ease-in-out pointer-events-auto ${
        isCollapsed ? 'translate-x-[calc(100%+20px)]' : 'translate-x-0'
      }`}
    >
      {/* Collapse Tab Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-8 top-6 w-8 h-12 bg-slate-900/90 hover:bg-slate-800 border border-r-0 border-indigo-500/30 rounded-l-xl flex items-center justify-center text-slate-300 hover:text-white cursor-pointer shadow-lg backdrop-blur-md"
        title={isCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main Container */}
      <div className="w-88 max-h-[calc(100vh-170px)] flex flex-col rounded-2xl glass-panel text-slate-200 shadow-2xl border border-indigo-500/20 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-md"
              style={{ backgroundColor: `${def.color}33`, color: def.color, border: `1px solid ${def.color}66` }}
            >
              {def.symbol}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white tracking-wide">{def.name}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {def.category.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {selectedBody.active ? 'Status: Active in Gravity Engine' : 'Status: Disabled (Zero Gravity)'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onFocusCamera(selectedBody.id)}
              className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer"
              title="Center Camera on this planet"
            >
              <Target className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Real-time SI Telemetry Grid */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Kinematics & Orbital Metrics</span>
              <span className="text-cyan-400">SI Units</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">MASS</span>
                <span className="font-mono font-semibold text-white">{formatMass(selectedBody.currentMassKg)}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">DISTANCE (SUN)</span>
                <span className="font-mono font-semibold text-white">
                  {selectedBody.id === 'sun' ? '0 AU' : `${distInfo.auStr}`}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">({distInfo.kmStr})</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">CURRENT VELOCITY</span>
                <span className="font-mono font-semibold text-cyan-300">{formatVelocity(selectedBody.speedKmS)}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">CURRENT ACCELERATION</span>
                <span className="font-mono font-semibold text-purple-300">{formatAcceleration(netAcc)}</span>
              </div>

              {def.axialTiltDeg !== undefined && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">AXIAL TILT</span>
                  <span className="font-mono font-semibold text-amber-300">{def.axialTiltDeg.toFixed(2)}°</span>
                </div>
              )}

              {def.rotationPeriodHours !== undefined && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-mono">ROTATION PERIOD</span>
                  <span className="font-mono font-semibold text-emerald-300">
                    {Math.abs(def.rotationPeriodHours) < 48
                      ? `${def.rotationPeriodHours.toFixed(1)} hrs`
                      : `${(def.rotationPeriodHours / 24).toFixed(1)} days`}
                    {def.rotationPeriodHours < 0 ? ' (Retrograde)' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pairwise Gravitational Forces Breakdown */}
          {selectedBody.id !== 'sun' && selectedBody.active && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Gravitational Forces Acting on {def.name}</span>
                <span className="text-rose-400">F = G·(m₁m₂)/r²</span>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5 space-y-2">
                {pairwiseForces.length === 0 ? (
                  <div className="text-xs text-slate-500 py-1 font-mono">No active attractors</div>
                ) : (
                  pairwiseForces.map((pf) => (
                    <div key={pf.fromId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-slate-300 font-medium">{pf.fromName} → {def.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-white font-semibold">{formatForce(pf.forceN)}</span>
                        <div className="text-[9px] text-slate-500">
                          {formatDistance(pf.distanceAu).auStr}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Net Force & Net Acceleration summary banner */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-300 font-semibold">Σ Net Force:</span>
                  <span className="text-white font-bold">{formatForce(selectedBody.netForceN)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300 font-semibold">Net Acceleration:</span>
                  <span className="text-cyan-300 font-bold">{formatAcceleration(netAcc)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Tools */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onOpenForceComparisonWith(selectedBody.id)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compare Forces</span>
            </button>

            <button
              onClick={() => onToggleBody(selectedBody.id)}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                selectedBody.active
                  ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/30 text-rose-300 hover:text-white'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/30 text-emerald-300 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{selectedBody.active ? 'Disable Planet' : 'Activate Planet'}</span>
            </button>
          </div>

          {/* Physical & Atmospheric Info */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Atmosphere & Surface</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{def.atmosphereComposition}</p>
            <div className="pt-1 text-[10px] font-mono text-amber-400/90 uppercase tracking-wide">Cosmic Insight</div>
            <p className="text-slate-400 text-[11px] leading-relaxed italic">{def.funFact}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
