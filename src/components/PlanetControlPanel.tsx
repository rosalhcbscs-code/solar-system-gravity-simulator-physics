import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, ShieldCheck, CheckSquare, Square, Info } from 'lucide-react';
import { BodyState, CelestialBodyDefinition } from '../types/simulation';
import { formatMass, formatVelocity, formatAcceleration } from '../utils/formatting';

interface PlanetControlPanelProps {
  bodies: BodyState[];
  definitions: CelestialBodyDefinition[];
  selectedBodyId: string | null;
  onSelectBody: (id: string) => void;
  onToggleBody: (id: string) => void;
  onEnableAll: () => void;
}

export const PlanetControlPanel: React.FC<PlanetControlPanelProps> = ({
  bodies,
  definitions,
  selectedBodyId,
  onSelectBody,
  onToggleBody,
  onEnableAll,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Map definition lookup
  const defMap = new Map<string, CelestialBodyDefinition>();
  definitions.forEach((d) => defMap.set(d.id, d));

  const activeCount = bodies.filter((b) => b.active).length;

  return (
    <aside
      className={`absolute top-20 left-4 z-20 transition-all duration-300 ease-in-out pointer-events-auto ${
        isCollapsed ? '-translate-x-[calc(100%+20px)]' : 'translate-x-0'
      }`}
    >
      {/* Outer panel container */}
      <div className="w-80 max-h-[calc(100vh-170px)] flex flex-col rounded-2xl glass-panel text-slate-200 shadow-2xl border border-indigo-500/20 overflow-hidden">
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Celestial Bodies
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
              {activeCount} / {bodies.length} Active
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onEnableAll}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline decoration-cyan-500/40 cursor-pointer"
              title="Reset and activate all celestial bodies"
            >
              Enable All
            </button>
          </div>
        </div>

        {/* Scrollable Bodies List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
          {bodies.map((body) => {
            const def = defMap.get(body.id);
            if (!def) return null;

            const isSelected = body.id === selectedBodyId;

            return (
              <div
                key={body.id}
                className={`pt-1.5 first:pt-0 rounded-xl p-2 transition-all ${
                  isSelected
                    ? 'bg-indigo-950/70 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {/* Main Row */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {/* Toggle Checkbox / Switch */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBody(body.id);
                      }}
                      className="cursor-pointer focus:outline-none"
                      title={body.active ? `Disable ${def.name}` : `Enable ${def.name}`}
                    >
                      {body.active ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400 hover:text-cyan-300" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                      )}
                    </button>

                    {/* Planet Icon & Symbol */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-sm cursor-pointer"
                      style={{ backgroundColor: `${def.color}33`, color: def.color }}
                      onClick={() => onSelectBody(body.id)}
                    >
                      {def.symbol}
                    </div>

                    {/* Name & Status */}
                    <div
                      className="cursor-pointer flex flex-col"
                      onClick={() => onSelectBody(body.id)}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-semibold ${body.active ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {def.name}
                        </span>
                        {def.id === 'sun' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                            Star
                          </span>
                        )}
                        {def.id === 'jupiter' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono">
                            Giant
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Focus Action */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onSelectBody(body.id)}
                      className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={`Inspect ${def.name}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-telemetry readout (compact) */}
                {body.active ? (
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/40">
                    <div>
                      <span className="text-slate-500 block text-[9px]">DIST</span>
                      <span className="text-slate-300">
                        {body.id === 'sun' ? 'Center' : `${body.distanceFromSunAu.toFixed(2)} AU`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">VELOCITY</span>
                      <span className="text-slate-300">{formatVelocity(body.speedKmS)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">ACCEL</span>
                      <span className="text-cyan-300">
                        {body.id === 'sun' ? '0' : formatAcceleration(Math.sqrt(body.accMs2.x ** 2 + body.accMs2.y ** 2 + body.accMs2.z ** 2))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-rose-400/80 italic font-mono pt-1">
                    Gravity disabled • No orbital influence
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Panel Footer Advice */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Disabling a planet eliminates its mass from Newton's N-body calculation. Try toggling Jupiter or the Sun!
          </span>
        </div>
      </div>

      {/* Collapse / Expand Tab Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-8 top-6 w-8 h-12 bg-slate-900/90 hover:bg-slate-800 border border-l-0 border-indigo-500/30 rounded-r-xl flex items-center justify-center text-slate-300 hover:text-white cursor-pointer shadow-lg backdrop-blur-md"
        title={isCollapsed ? 'Expand Celestial Bodies Panel' : 'Collapse Panel'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};
