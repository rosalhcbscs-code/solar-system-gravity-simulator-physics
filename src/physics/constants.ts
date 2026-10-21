/**
 * Physical and Astronomical Constants (CODATA 2018 / IAU standard values)
 */

// Universal Gravitational Constant in N·m²/kg²
export const G = 6.67430e-11;

// 1 Astronomical Unit in meters
export const AU_IN_METERS = 1.495978707e11;

// 1 Astronomical Unit in kilometers
export const AU_IN_KM = 1.495978707e8;

// Seconds in a Julian year (365.25 days)
export const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

// Seconds in a standard day (24 hours)
export const SECONDS_PER_DAY = 86400;

// Softening parameter in meters to prevent numerical singularity when bodies get close
export const SOFTENING_METERS = 1e8; // 100,000 km

/**
 * Visual Scale vs Realistic Scale coordinate transformation helpers
 */

// Convert AU to realistic 3D scene units
export function auToRealisticVisual(au: number): number {
  return au * 14.0;
}

// Convert AU to visually balanced 3D scene units (power-law compression for ergonomic viewing)
export function auToCompressedVisual(au: number): number {
  if (au === 0) return 0;
  // Keeps planets spaced nicely across the screen: Mercury ~16, Earth ~32, Jupiter ~65, Neptune ~145
  return 12 + Math.pow(au, 0.6) * 19;
}

// Get visual planet radius for rendering
export function getVisualRadius(radiusKm: number, isStar: boolean, scaleMode: 'visual' | 'realistic'): number {
  if (isStar) {
    return scaleMode === 'visual' ? 5.2 : 2.5;
  }
  if (scaleMode === 'visual') {
    // Exaggerate planet sizes with logarithmic scale so Mercury is visible and Jupiter is grand
    return Math.max(0.65, Math.log10(radiusKm) * 0.55);
  } else {
    // Realistic mode: slightly smaller but still renderable
    return Math.max(0.35, Math.log10(radiusKm) * 0.3);
  }
}
