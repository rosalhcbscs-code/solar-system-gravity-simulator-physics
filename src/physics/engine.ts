import { CelestialBodyDefinition, BodyState, Vector3D, ScaleMode } from '../types/simulation';
import { G, AU_IN_METERS, AU_IN_KM, SOFTENING_METERS, auToCompressedVisual, auToRealisticVisual } from './constants';

// 1 second real time at 1x speed corresponds to 12.5 simulation days
export const BASE_SIMULATION_DAYS_PER_SECOND = 12.5;
export const BASE_DT_SECONDS = BASE_SIMULATION_DAYS_PER_SECOND * 86400; // in seconds

/**
 * Initializes physical states of all celestial bodies based on astronomical data
 */
export function initializeBodyStates(
  definitions: CelestialBodyDefinition[],
  scaleMode: ScaleMode = 'visual'
): BodyState[] {
  return definitions.map((def, index) => {
    // Spread planets around the Sun initially at their real orbital radii
    // Use slightly staggered angles so they start nicely distributed in their orbits
    const initialAngle = def.orbitalRadiusAu === 0 
      ? 0 
      : (index * 1.05 + 0.3) % (2 * Math.PI);

    // Initial position in AU (in ecliptic plane XZ, with subtle inclination Y)
    const incRad = (def.inclinationDeg * Math.PI) / 180;
    const rAu = def.orbitalRadiusAu;

    const posX = rAu * Math.cos(initialAngle);
    const posZ = rAu * Math.sin(initialAngle);
    const posY = rAu * Math.sin(incRad) * Math.sin(initialAngle) * 0.1; // minor vertical tilt

    // Calculate circular orbital speed v = sqrt(G * M_sun / r) in m/s
    let speedMs = 0;
    if (rAu > 0) {
      const sunMass = definitions.find((d) => d.id === 'sun')?.massKg || 1.9885e30;
      const rMeters = rAu * AU_IN_METERS;
      speedMs = Math.sqrt((G * sunMass) / rMeters);
    }

    // Velocity vector perpendicular to position vector in XZ plane
    // v = (-sin(theta), 0, cos(theta)) * speedMs
    const velX = -Math.sin(initialAngle) * speedMs;
    const velZ = Math.cos(initialAngle) * speedMs;
    const velY = 0;

    const posAu: Vector3D = { x: posX, y: posY, z: posZ };
    const visualPos = computeVisualPosition(posAu, scaleMode);

    return {
      id: def.id,
      visualPosition: visualPos,
      posAu,
      velKmS: {
        x: velX / 1000,
        y: velY / 1000,
        z: velZ / 1000,
      },
      accMs2: { x: 0, y: 0, z: 0 },
      netForceN: 0,
      forceVectorN: { x: 0, y: 0, z: 0 },
      distanceFromSunAu: rAu,
      distanceFromSunKm: rAu * AU_IN_KM,
      speedKmS: speedMs / 1000,
      currentMassKg: def.massKg,
      active: true,
      trail: [visualPos],
    };
  });
}

/**
 * Maps physical AU coordinates to 3D rendering scene coordinates
 */
export function computeVisualPosition(posAu: Vector3D, scaleMode: ScaleMode): Vector3D {
  const rAu = Math.sqrt(posAu.x * posAu.x + posAu.z * posAu.z);
  if (rAu === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const angle = Math.atan2(posAu.z, posAu.x);
  const visualR = scaleMode === 'visual'
    ? auToCompressedVisual(rAu)
    : auToRealisticVisual(rAu);

  // Maintain vertical inclination proportion
  const visualY = posAu.y * (scaleMode === 'visual' ? 20 : 14);

  return {
    x: visualR * Math.cos(angle),
    y: visualY,
    z: visualR * Math.sin(angle),
  };
}

/**
 * Performs a high-accuracy N-body gravitational integration step
 * Uses substepping and Symplectic Velocity Verlet integration
 */
export function stepPhysics(
  bodies: BodyState[],
  dtRealSeconds: number,
  speedMultiplier: number,
  scaleMode: ScaleMode,
  sunMassMultiplier: number = 1.0,
  jupiterMassMultiplier: number = 1.0,
  maxTrailLength: number = 120
): { updatedBodies: BodyState[]; simSecondsElapsed: number } {
  // Total simulation seconds to advance
  const totalSimSeconds = dtRealSeconds * BASE_DT_SECONDS * speedMultiplier;
  // Substepping: divide into multiple steps for orbital stability
  const numSubsteps = Math.min(12, Math.max(4, Math.ceil(speedMultiplier * 2)));
  const subDt = totalSimSeconds / numSubsteps;

  // Work with a shallow copy of states
  const working = bodies.map((b) => {
    let mass = b.currentMassKg;
    if (b.id === 'sun') {
      const baseSun = 1.9885e30;
      mass = baseSun * sunMassMultiplier;
    } else if (b.id === 'jupiter') {
      const baseJup = 1.8982e27;
      mass = baseJup * jupiterMassMultiplier;
    }

    return {
      ...b,
      currentMassKg: mass,
      posMeters: {
        x: b.posAu.x * AU_IN_METERS,
        y: b.posAu.y * AU_IN_METERS,
        z: b.posAu.z * AU_IN_METERS,
      },
      velMs: {
        x: b.velKmS.x * 1000,
        y: b.velKmS.y * 1000,
        z: b.velKmS.z * 1000,
      },
      accMs2: { x: 0, y: 0, z: 0 },
      netForceN: 0,
      forceVectorN: { x: 0, y: 0, z: 0 },
    };
  });

  // Execute substepping loop
  for (let step = 0; step < numSubsteps; step++) {
    // 1. Calculate pairwise gravitational forces and accelerations for all active bodies
    for (let i = 0; i < working.length; i++) {
      const bi = working[i];
      if (!bi.active) continue;

      let netFx = 0;
      let netFy = 0;
      let netFz = 0;

      for (let j = 0; j < working.length; j++) {
        if (i === j) continue;
        const bj = working[j];
        if (!bj.active || bj.currentMassKg <= 0) continue;

        const dx = bj.posMeters.x - bi.posMeters.x;
        const dy = bj.posMeters.y - bi.posMeters.y;
        const dz = bj.posMeters.z - bi.posMeters.z;

        const distSquared = dx * dx + dy * dy + dz * dz + SOFTENING_METERS * SOFTENING_METERS;
        const dist = Math.sqrt(distSquared);

        if (dist > 1e-6) {
          // F = G * m1 * m2 / dist^2
          const fMag = (G * bi.currentMassKg * bj.currentMassKg) / distSquared;
          netFx += fMag * (dx / dist);
          netFy += fMag * (dy / dist);
          netFz += fMag * (dz / dist);
        }
      }

      const m = bi.currentMassKg > 0 ? bi.currentMassKg : 1;
      bi.accMs2 = {
        x: netFx / m,
        y: netFy / m,
        z: netFz / m,
      };
      bi.forceVectorN = { x: netFx, y: netFy, z: netFz };
      bi.netForceN = Math.sqrt(netFx * netFx + netFy * netFy + netFz * netFz);
    }

    // 2. Velocity and Position update (Symplectic Euler / Verlet step)
    for (let i = 0; i < working.length; i++) {
      const bi = working[i];
      if (!bi.active) continue;

      // Update velocity: v += a * dt
      bi.velMs.x += bi.accMs2.x * subDt;
      bi.velMs.y += bi.accMs2.y * subDt;
      bi.velMs.z += bi.accMs2.z * subDt;

      // Update position: x += v * dt
      bi.posMeters.x += bi.velMs.x * subDt;
      bi.posMeters.y += bi.velMs.y * subDt;
      bi.posMeters.z += bi.velMs.z * subDt;
    }
  }

  // 3. Finalize updated body states and visual positions
  const updatedBodies: BodyState[] = working.map((b) => {
    const posAu: Vector3D = {
      x: b.posMeters.x / AU_IN_METERS,
      y: b.posMeters.y / AU_IN_METERS,
      z: b.posMeters.z / AU_IN_METERS,
    };

    const visualPos = computeVisualPosition(posAu, scaleMode);
    const rAu = Math.sqrt(posAu.x * posAu.x + posAu.y * posAu.y + posAu.z * posAu.z);
    const speedMs = Math.sqrt(b.velMs.x * b.velMs.x + b.velMs.y * b.velMs.y + b.velMs.z * b.velMs.z);

    // Update trail
    const updatedTrail = b.active ? [...b.trail, visualPos] : b.trail;
    if (updatedTrail.length > maxTrailLength) {
      updatedTrail.splice(0, updatedTrail.length - maxTrailLength);
    }

    return {
      id: b.id,
      visualPosition: visualPos,
      posAu,
      velKmS: {
        x: b.velMs.x / 1000,
        y: b.velMs.y / 1000,
        z: b.velMs.z / 1000,
      },
      accMs2: b.accMs2,
      netForceN: b.netForceN,
      forceVectorN: b.forceVectorN,
      distanceFromSunAu: rAu,
      distanceFromSunKm: rAu * AU_IN_KM,
      speedKmS: speedMs / 1000,
      currentMassKg: b.currentMassKg,
      active: b.active,
      trail: updatedTrail,
    };
  });

  return {
    updatedBodies,
    simSecondsElapsed: totalSimSeconds,
  };
}
