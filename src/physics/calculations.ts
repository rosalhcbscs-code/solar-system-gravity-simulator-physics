import { G, AU_IN_METERS, AU_IN_KM, SOFTENING_METERS } from './constants';
import { BodyState, PairwiseForceDetail, Vector3D } from '../types/simulation';

/**
 * Calculates the Euclidean distance between two 3D vectors
 */
export function distance3D(a: Vector3D, b: Vector3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates the exact Newtonian gravitational force between two celestial bodies
 * F = G * (m1 * m2) / r^2
 */
export function computeGravitationalForce(
  mass1Kg: number,
  mass2Kg: number,
  pos1Au: Vector3D,
  pos2Au: Vector3D
): {
  forceN: number;
  distanceMeters: number;
  distanceAu: number;
  distanceKm: number;
  directionUnitVector: Vector3D; // Normalized from pos1 towards pos2
} {
  const dxAu = pos2Au.x - pos1Au.x;
  const dyAu = pos2Au.y - pos1Au.y;
  const dzAu = pos2Au.z - pos1Au.z;

  const distAu = Math.sqrt(dxAu * dxAu + dyAu * dyAu + dzAu * dzAu);
  if (distAu < 1e-9) {
    return {
      forceN: 0,
      distanceMeters: 0,
      distanceAu: 0,
      distanceKm: 0,
      directionUnitVector: { x: 0, y: 0, z: 0 },
    };
  }

  const distMeters = distAu * AU_IN_METERS;
  const distKm = distAu * AU_IN_KM;

  // Softened distance squared to avoid extreme infinite force when bodies collide
  const r2 = distMeters * distMeters + SOFTENING_METERS * SOFTENING_METERS;
  const forceN = (G * mass1Kg * mass2Kg) / r2;

  const invDistAu = 1 / distAu;
  return {
    forceN,
    distanceMeters: distMeters,
    distanceAu: distAu,
    distanceKm: distKm,
    directionUnitVector: {
      x: dxAu * invDistAu,
      y: dyAu * invDistAu,
      z: dzAu * invDistAu,
    },
  };
}

/**
 * Computes pairwise force breakdown between all bodies in the system
 */
export function getPairwiseForces(
  bodies: BodyState[],
  targetBodyId: string,
  bodyNames: Record<string, string>
): PairwiseForceDetail[] {
  const target = bodies.find((b) => b.id === targetBodyId);
  if (!target || !target.active) return [];

  const results: PairwiseForceDetail[] = [];

  for (const other of bodies) {
    if (other.id === targetBodyId || !other.active) continue;

    const calc = computeGravitationalForce(
      target.currentMassKg,
      other.currentMassKg,
      target.posAu,
      other.posAu
    );

    const accOnTarget = target.currentMassKg > 0 ? calc.forceN / target.currentMassKg : 0;

    results.push({
      fromId: other.id,
      toId: target.id,
      fromName: bodyNames[other.id] || other.id,
      toName: bodyNames[target.id] || target.id,
      forceN: calc.forceN,
      distanceAu: calc.distanceAu,
      distanceKm: calc.distanceKm,
      accOnTargetMs2: accOnTarget,
      vector: calc.directionUnitVector,
    });
  }

  // Sort descending by force magnitude (strongest attractor first)
  results.sort((a, b) => b.forceN - a.forceN);
  return results;
}

/**
 * Calculates gravitational potential or field strength at a given point in space
 * g(r) = sum(G * M_i / r_i^2 * r_hat)
 */
export function getGravitationalFieldAt(
  xAu: number,
  zAu: number,
  bodies: BodyState[]
): {
  fieldMagnitudeMs2: number;
  potentialJoulesKg: number;
} {
  let gx = 0;
  let gz = 0;
  let potential = 0;

  for (const b of bodies) {
    if (!b.active || b.currentMassKg <= 0) continue;

    const dxAu = b.posAu.x - xAu;
    const dzAu = b.posAu.z - zAu;
    const distAu = Math.sqrt(dxAu * dxAu + dzAu * dzAu);

    const distMeters = Math.max(distAu * AU_IN_METERS, SOFTENING_METERS);
    const r2 = distMeters * distMeters;

    const gMag = (G * b.currentMassKg) / r2;
    gx += gMag * (dxAu / (distAu || 1));
    gz += gMag * (dzAu / (distAu || 1));

    potential -= (G * b.currentMassKg) / distMeters;
  }

  return {
    fieldMagnitudeMs2: Math.sqrt(gx * gx + gz * gz),
    potentialJoulesKg: potential,
  };
}
