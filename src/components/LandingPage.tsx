import React, { useEffect, useRef } from 'react';
import { Play, BookOpen, Compass, Sparkles, Orbit, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface LandingPageProps {
  onEnterSimulation: () => void;
  onOpenEducational: () => void;
  onOpenEquations: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterSimulation,
  onOpenEducational,
  onOpenEquations,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated cosmic galaxy starfield on the landing page background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const numStars = 280;
    const stars = Array.from({ length: numStars }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 1000 + 1,
      size: Math.random() * 1.8 + 0.4,
      hue: Math.random() > 0.7 ? (Math.random() > 0.5 ? 200 : 280) : 45,
      speed: Math.random() * 0.3 + 0.1,
    }));

    // Center galaxy swirl angle
    let angle = 0;

    const render = () => {
      ctx.fillStyle = '#03030c';
      ctx.fillRect(0, 0, width, height);

      // Subtle cosmic nebula glow gradients
      const cx = width / 2;
      const cy = height / 2;

      const nebula1 = ctx.createRadialGradient(cx - 200, cy - 80, 50, cx - 200, cy - 80, 500);
      nebula1.addColorStop(0, 'rgba(120, 40, 200, 0.16)');
      nebula1.addColorStop(0.5, 'rgba(60, 20, 150, 0.08)');
      nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(cx + 240, cy + 100, 40, cx + 240, cy + 100, 480);
      nebula2.addColorStop(0, 'rgba(14, 165, 233, 0.14)');
      nebula2.addColorStop(0.6, 'rgba(30, 60, 180, 0.06)');
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Starfield projection
      stars.forEach((star) => {
        star.z -= star.speed;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * width * 1.5;
          star.y = (Math.random() - 0.5) * height * 1.5;
        }

        const k = 400 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px < width && py >= 0 && py < height) {
          const alpha = Math.min(1, (1000 - star.z) / 500);
          ctx.fillStyle = `hsla(${star.hue}, 80%, 85%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, star.size * k * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Subtle celestial orbital concentric rings in center
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let r = 80; r <= 380; r += 75) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + 60, r * 1.6, r * 0.65, -0.15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Small glowing center sun proxy
      const sunGlow = ctx.createRadialGradient(cx, cy + 60, 2, cx, cy + 60, 45);
      sunGlow.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
      sunGlow.addColorStop(0.3, 'rgba(255, 140, 20, 0.4)');
      sunGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + 60, 45, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting planetary dots
      angle += 0.008;
      const orbits = [
        { rx: 130, ry: 50, speed: 1.8, color: '#60a5fa', size: 3.5 },
        { rx: 210, ry: 85, speed: 1.0, color: '#34d399', size: 4.5 },
        { rx: 320, ry: 130, speed: 0.5, color: '#fb923c', size: 6.0 },
      ];

      orbits.forEach((orb) => {
        const ox = cx + Math.cos(angle * orb.speed) * orb.rx;
        const oy = cy + 60 + Math.sin(angle * orb.speed) * orb.ry;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-slate-100 select-none">
      {/* Animated Galaxy Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-[#070919] rounded-[10px] flex items-center justify-center">
              <Orbit className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '14s' }} />
            </div>
          </div>
          <div>
            <span className="font-semibold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-indigo-300">
              ASTROPHYSICS LAB
            </span>
            <div className="text-[11px] text-indigo-300/70 tracking-widest font-mono">
              NEWTONIAN N-BODY SIMULATION
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={onOpenEducational}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900/70 hover:bg-indigo-900/40 border border-slate-700/60 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Educational Guide</span>
          </button>
          <button
            onClick={onOpenEquations}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900/70 hover:bg-indigo-900/40 border border-slate-700/60 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Physics & Formulas</span>
          </button>
          <button
            onClick={onEnterSimulation}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold tracking-wide shadow-md shadow-indigo-500/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 py-8 flex flex-col items-center justify-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono tracking-wide mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Celestial Mechanics Simulator</span>
        </div>

        {/* Large Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight uppercase leading-[1.08] mb-6">
          <span className="block text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
            Solar System
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">
            Gravity Simulator
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg sm:text-xl text-slate-300 font-light leading-relaxed mb-4">
          Explore how gravity shapes the motion of our Solar System.
        </p>

        {/* Short explanation block */}
        <p className="max-w-2xl text-sm sm:text-base text-slate-400/90 leading-relaxed mb-10 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          Explore the gravitational forces between the Sun and planets. Toggle celestial bodies,
          change simulation speed, observe vector force fields, and see in real time how removing or
          adding massive bodies alters the entire cosmic architecture.
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
          <button
            onClick={onEnterSimulation}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-base tracking-wider shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:shadow-[0_0_55px_rgba(99,102,241,0.85)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-3"
          >
            <Play className="w-5 h-5 fill-current text-white" />
            <span>START SIMULATION</span>
          </button>

          <button
            onClick={onOpenEducational}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white font-medium text-sm transition-all cursor-pointer flex items-center justify-center space-x-2 backdrop-blur-md"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Interactive Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">N-Body Gravitation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Newtonian gravitation with Symplectic Velocity Verlet integration conserving energy and angular momentum.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-500/30 flex items-center justify-center mb-3">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Planet Toggling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toggle Jupiter or the Sun off to observe catastrophic trajectory changes and instant before/after force deltas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-500/30 flex items-center justify-center mb-3">
              <Orbit className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Gravity Vectors</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic 3D vector arrows depicting acceleration magnitude and direction towards all gravitational attractors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center mb-3">
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">Spacetime Field</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize potential wells and gravitational field intensity mapped onto a 3D deforming coordinate plane.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          This simulation uses a simplified Newtonian N-body model for educational visualization. Planetary data, numerical integration, and visual scaling are approximations.
        </p>
        <span className="font-mono text-slate-400 shrink-0">
          G = 6.67430 × 10⁻¹¹ N·m²/kg²
        </span>
      </footer>
    </div>
  );
};
