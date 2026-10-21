import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PLANETS_DATA } from './data/planets';
import { BodyState, SimulationConfig, GravityChangeAlert, ScaleMode } from './types/simulation';
import { initializeBodyStates, stepPhysics } from './physics/engine';
import { computeGravitationalForce } from './physics/calculations';
import { LandingPage } from './components/LandingPage';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TopNav } from './components/TopNav';
import { PlanetControlPanel } from './components/PlanetControlPanel';
import { SelectedPlanetPanel } from './components/SelectedPlanetPanel';
import { BottomControls } from './components/BottomControls';
import { ForceComparisonModal } from './components/ForceComparisonModal';
import { EquationModal } from './components/EquationModal';
import { ExperimentModal } from './components/ExperimentModal';
import { ForceMatrixModal } from './components/ForceMatrixModal';
import { EducationalModal } from './components/EducationalModal';
import { GravityDiffAlert } from './components/GravityDiffAlert';
import { formatAcceleration, formatForce } from './utils/formatting';

export default function App() {
  // Navigation View: 'landing' vs 'simulation'
  const [viewMode, setViewMode] = useState<'landing' | 'simulation'>('landing');

  // Simulation Configuration
  const [config, setConfig] = useState<SimulationConfig>({
    speedMultiplier: 2.0,
    scaleMode: 'visual',
    showLabels: true,
    showOrbits: true,
    showVectors: true,
    showTrails: true,
    showDistanceLines: true,
    showGravityField: false,
    isPaused: false,
    sunMassMultiplier: 1.0,
    jupiterMassMultiplier: 1.0,
    vectorScale: 1.0,
    trailLength: 120,
  });

  // Celestial Bodies Physics States
  const [bodies, setBodies] = useState<BodyState[]>(() =>
    initializeBodyStates(PLANETS_DATA, 'visual')
  );

  // Simulation Time Elapsed (in simulated seconds)
  const [simSecondsElapsed, setSimSecondsElapsed] = useState<number>(0);

  // Selected & Camera Target Body
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>('earth');
  const [cameraFocusId, setCameraFocusId] = useState<string | null>(null);

  // Comparison Initial targets
  const [compareTargetA, setCompareTargetA] = useState<string>('earth');
  const [compareTargetB, setCompareTargetB] = useState<string>('sun');

  // Modal Dialogs
  const [isForceComparisonOpen, setIsForceComparisonOpen] = useState(false);
  const [isEquationsOpen, setIsEquationsOpen] = useState(false);
  const [isExperimentsOpen, setIsExperimentsOpen] = useState(false);
  const [isForceMatrixOpen, setIsForceMatrixOpen] = useState(false);
  const [isEducationalOpen, setIsEducationalOpen] = useState(false);

  // Gravity Difference Alert banner
  const [gravityAlert, setGravityAlert] = useState<GravityChangeAlert | null>(null);

  // Mutable refs for high-frequency physics simulation loop
  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;

  const configRef = useRef(config);
  configRef.current = config;

  const simSecondsRef = useRef(simSecondsElapsed);
  simSecondsRef.current = simSecondsElapsed;

  // 1. Simulation Loop (requestAnimationFrame)
  useEffect(() => {
    if (viewMode !== 'simulation') return;

    let animId: number;
    let lastTime = performance.now();
    let lastUIUpdateTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dtReal = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const currentConfig = configRef.current;
      if (!currentConfig.isPaused) {
        const { updatedBodies, simSecondsElapsed: stepSec } = stepPhysics(
          bodiesRef.current,
          dtReal,
          currentConfig.speedMultiplier,
          currentConfig.scaleMode,
          currentConfig.sunMassMultiplier,
          currentConfig.jupiterMassMultiplier,
          currentConfig.trailLength
        );

        bodiesRef.current = updatedBodies;
        simSecondsRef.current += stepSec;

        // Throttle React state updates to 30 FPS for silky performance and zero UI stutter
        if (now - lastUIUpdateTime >= 33) {
          lastUIUpdateTime = now;
          setBodies(updatedBodies);
          setSimSecondsElapsed(simSecondsRef.current);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [viewMode]);

  // Handle Config Updates
  const handleUpdateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      // If scale mode changed, re-map visual coordinates
      if (newConfig.scaleMode && newConfig.scaleMode !== prev.scaleMode) {
        setBodies((current) =>
          current.map((b) => ({
            ...b,
            visualPosition: b.visualPosition,
          }))
        );
      }
      return updated;
    });
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    setConfig((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // Reset Simulation to epoch
  const handleResetSim = useCallback(() => {
    const fresh = initializeBodyStates(PLANETS_DATA, config.scaleMode);
    setBodies(fresh);
    bodiesRef.current = fresh;
    setSimSecondsElapsed(0);
    simSecondsRef.current = 0;
    setGravityAlert(null);
  }, [config.scaleMode]);

  // Step Forward by 1 day when paused
  const handleStepForward = useCallback(() => {
    if (!config.isPaused) return;
    const { updatedBodies, simSecondsElapsed: stepSec } = stepPhysics(
      bodiesRef.current,
      1 / 12.5, // 1 day
      1.0,
      config.scaleMode,
      config.sunMassMultiplier,
      config.jupiterMassMultiplier,
      config.trailLength
    );
    setBodies(updatedBodies);
    bodiesRef.current = updatedBodies;
    const newTime = simSecondsElapsed + stepSec;
    setSimSecondsElapsed(newTime);
    simSecondsRef.current = newTime;
  }, [config, simSecondsElapsed]);

  // Toggle Scale Mode (Visual vs Realistic)
  const handleToggleScaleMode = useCallback(() => {
    const newMode: ScaleMode = config.scaleMode === 'visual' ? 'realistic' : 'visual';
    handleUpdateConfig({ scaleMode: newMode });
  }, [config.scaleMode, handleUpdateConfig]);

  // Toggle Body Active / Inactive (Calculates before and after forces)
  const handleToggleBody = useCallback(
    (id: string) => {
      const current = bodiesRef.current;
      const targetBody = current.find((b) => b.id === id);
      const earthBody = current.find((b) => b.id === 'earth');
      const sunBody = current.find((b) => b.id === 'sun');
      if (!targetBody || !earthBody || !sunBody) return;

      const willBeActive = !targetBody.active;

      // Calculate before forces on Earth
      const earthSunBefore = computeGravitationalForce(
        earthBody.currentMassKg,
        sunBody.currentMassKg,
        earthBody.posAu,
        sunBody.posAu
      ).forceN;

      const earthTargetBefore = computeGravitationalForce(
        earthBody.currentMassKg,
        targetBody.currentMassKg,
        earthBody.posAu,
        targetBody.posAu
      ).forceN;

      const netAccBefore = Math.sqrt(
        earthBody.accMs2.x ** 2 + earthBody.accMs2.y ** 2 + earthBody.accMs2.z ** 2
      );

      // Create updated bodies
      const updated = current.map((b) => (b.id === id ? { ...b, active: willBeActive } : b));
      setBodies(updated);
      bodiesRef.current = updated;

      // Calculate after forces on Earth
      const updatedTarget = updated.find((b) => b.id === id);
      const earthTargetAfter = willBeActive
        ? earthTargetBefore
        : 0;

      const def = PLANETS_DATA.find((d) => d.id === id);
      const bodyName = def?.name || id;

      let pctChange = 0;
      if (id === 'sun') {
        pctChange = willBeActive ? 100 : -100;
      } else if (earthTargetBefore > 0) {
        pctChange = willBeActive ? 100 : -100;
      }

      // Trigger Gravity Change Event Alert
      setGravityAlert({
        id: `${id}-${Date.now()}`,
        timestamp: Date.now(),
        title: 'Gravity Change Detected',
        description: willBeActive
          ? `${bodyName} restored to simulation. Gravitational field recalculated.`
          : `${bodyName} removed from simulation. Gravitational influence ceased.`,
        affectedBody: bodyName,
        beforeForceN: willBeActive ? 0 : earthTargetBefore,
        afterForceN: willBeActive ? earthTargetBefore : 0,
        percentChange: pctChange,
        details: [
          `Direct Earth ↔ ${bodyName} force changed from ${formatForce(willBeActive ? 0 : earthTargetBefore)} to ${formatForce(willBeActive ? earthTargetBefore : 0)}`,
          id === 'sun'
            ? 'Earth and planets are now in unbound rectilinear motion (inertial drift)'
            : `Earth's orbital perturbation from ${bodyName} is now ${willBeActive ? 'active' : 'zero'}.`,
        ],
      });
    },
    []
  );

  // Enable all bodies
  const handleEnableAll = useCallback(() => {
    setBodies((prev) => prev.map((b) => ({ ...b, active: true })));
    setGravityAlert(null);
  }, []);

  // Reset experiment sliders
  const handleResetExperiments = useCallback(() => {
    handleUpdateConfig({
      sunMassMultiplier: 1.0,
      jupiterMassMultiplier: 1.0,
    });
    handleEnableAll();
  }, [handleEnableAll, handleUpdateConfig]);

  // Open Force Comparison with specific planet
  const handleOpenForceComparisonWith = useCallback((id: string) => {
    if (id === 'sun') {
      setCompareTargetA('earth');
      setCompareTargetB('sun');
    } else {
      setCompareTargetA(id);
      setCompareTargetB('sun');
    }
    setIsForceComparisonOpen(true);
  }, []);

  const selectedBody = bodies.find((b) => b.id === selectedBodyId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#03040c] text-slate-100 select-none">
      {viewMode === 'landing' ? (
        <LandingPage
          onEnterSimulation={() => setViewMode('simulation')}
          onOpenEducational={() => setIsEducationalOpen(true)}
          onOpenEquations={() => setIsEquationsOpen(true)}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* Main 3D Three.js WebGL Simulation Viewport */}
          <SimulationCanvas
            bodies={bodies}
            definitions={PLANETS_DATA}
            selectedBodyId={selectedBodyId}
            onSelectBody={(id) => {
              setSelectedBodyId(id);
              if (id) setCameraFocusId(id);
            }}
            config={config}
            cameraFocusId={cameraFocusId}
            onCameraFocusChange={setCameraFocusId}
          />

          {/* Top Header Navigation */}
          <TopNav
            config={config}
            simSecondsElapsed={simSecondsElapsed}
            onTogglePlay={handleTogglePlay}
            onResetSim={handleResetSim}
            onToggleScaleMode={handleToggleScaleMode}
            onResetCamera={() => setCameraFocusId(null)}
            onTopDownCamera={() => setCameraFocusId(null)}
            onFocusSun={() => setCameraFocusId('sun')}
            onOpenForceComparison={() => setIsForceComparisonOpen(true)}
            onOpenExperiments={() => setIsExperimentsOpen(true)}
            onOpenEquations={() => setIsEquationsOpen(true)}
            onOpenForceMatrix={() => setIsForceMatrixOpen(true)}
            onOpenEducational={() => setIsEducationalOpen(true)}
            onBackToLanding={() => setViewMode('landing')}
          />

          {/* Left Panel: Planet Toggle & Mini Telemetry List */}
          <PlanetControlPanel
            bodies={bodies}
            definitions={PLANETS_DATA}
            selectedBodyId={selectedBodyId}
            onSelectBody={(id) => {
              setSelectedBodyId(id);
              setCameraFocusId(id);
            }}
            onToggleBody={handleToggleBody}
            onEnableAll={handleEnableAll}
          />

          {/* Right Panel: Selected Planet Telemetry Inspector */}
          <SelectedPlanetPanel
            selectedBody={selectedBody}
            allBodies={bodies}
            definitions={PLANETS_DATA}
            onClose={() => setSelectedBodyId(null)}
            onFocusCamera={(id) => setCameraFocusId(id)}
            onOpenForceComparisonWith={handleOpenForceComparisonWith}
            onToggleBody={handleToggleBody}
          />

          {/* Bottom Dock: Controls, Playback & Layers */}
          <BottomControls
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onTogglePlay={handleTogglePlay}
            onResetSim={handleResetSim}
            onStepForward={handleStepForward}
          />

          {/* Dynamic Gravity Change Alert Banner */}
          <GravityDiffAlert
            alert={gravityAlert}
            onDismiss={() => setGravityAlert(null)}
          />
        </div>
      )}

      {/* Force Comparison Modal */}
      <ForceComparisonModal
        isOpen={isForceComparisonOpen}
        onClose={() => setIsForceComparisonOpen(false)}
        bodies={bodies}
        definitions={PLANETS_DATA}
        initialBodyAId={compareTargetA}
        initialBodyBId={compareTargetB}
      />

      {/* Physics Equations Modal */}
      <EquationModal
        isOpen={isEquationsOpen}
        onClose={() => setIsEquationsOpen(false)}
      />

      {/* Gravity Experiments Modal */}
      <ExperimentModal
        isOpen={isExperimentsOpen}
        onClose={() => setIsExperimentsOpen(false)}
        config={config}
        bodies={bodies}
        onUpdateConfig={handleUpdateConfig}
        onToggleBody={handleToggleBody}
        onResetExperiments={handleResetExperiments}
      />

      {/* N×N Gravitational Interaction Matrix Modal */}
      <ForceMatrixModal
        isOpen={isForceMatrixOpen}
        onClose={() => setIsForceMatrixOpen(false)}
        bodies={bodies}
        definitions={PLANETS_DATA}
      />

      {/* Educational Celestial Guide Modal */}
      <EducationalModal
        isOpen={isEducationalOpen}
        onClose={() => setIsEducationalOpen(false)}
      />
    </div>
  );
}
