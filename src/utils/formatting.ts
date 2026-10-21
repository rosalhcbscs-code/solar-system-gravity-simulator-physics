/**
 * Utility functions for scientific notation and astronomical formatting
 */

/**
 * Formats a number in clean scientific notation: e.g. 5.972 × 10²⁴
 */
export function formatScientific(val: number, precision: number = 3): string {
  if (val === 0 || !isFinite(val)) return '0';
  if (Math.abs(val) >= 0.01 && Math.abs(val) < 10000) {
    return val.toLocaleString(undefined, { maximumFractionDigits: precision });
  }

  const expStr = val.toExponential(precision);
  const [mantissa, exponent] = expStr.split('e');
  const expNum = parseInt(exponent, 10);

  // Convert exponent to unicode superscript numbers
  const superscripts: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };

  const expFormatted = exponent
    .split('')
    .map((char) => superscripts[char] || char)
    .join('');

  return `${mantissa} × 10${expFormatted}`;
}

/**
 * Formats force in Newtons with unit
 */
export function formatForce(newtons: number): string {
  if (!isFinite(newtons) || newtons === 0) return '0 N';
  return `${formatScientific(newtons, 2)} N`;
}

/**
 * Formats mass in kilograms
 */
export function formatMass(kg: number): string {
  return `${formatScientific(kg, 3)} kg`;
}

/**
 * Formats acceleration in m/s²
 */
export function formatAcceleration(ms2: number): string {
  if (!isFinite(ms2) || ms2 === 0) return '0 m/s²';
  if (Math.abs(ms2) < 0.0001) {
    return `${formatScientific(ms2, 2)} m/s²`;
  }
  return `${ms2.toFixed(4)} m/s²`;
}

/**
 * Formats distance in AU and Million km
 */
export function formatDistance(au: number): { auStr: string; kmStr: string } {
  const km = au * 149597870.7;
  const millionKm = (km / 1e6).toFixed(1);
  return {
    auStr: `${au.toFixed(3)} AU`,
    kmStr: `${millionKm}M km`,
  };
}

/**
 * Formats velocity in km/s
 */
export function formatVelocity(kmS: number): string {
  return `${kmS.toFixed(2)} km/s`;
}

/**
 * Formats simulation time in elapsed years and days
 */
export function formatSimTime(seconds: number): { years: string; days: string } {
  const totalDays = seconds / 86400;
  const years = (totalDays / 365.25).toFixed(2);
  const days = Math.floor(totalDays % 365.25);
  return {
    years: `${years} yr`,
    days: `${Math.floor(totalDays).toLocaleString()} days`,
  };
}
