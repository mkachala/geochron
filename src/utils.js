// ── Pure utility helpers ───────────────────────────────────────

/**
 * Format a duration in minutes as a human-readable string.
 * @param {number} minutes - Total minutes (must be positive integer).
 * @returns {string} e.g. "1 hr", "2h 30m", "45 min"
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || !isFinite(minutes) || minutes < 0) {
    throw new RangeError(`formatDuration expects a non-negative number, got: ${minutes}`);
  }
  const hrs  = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0)              return `${hrs} hr`;
  return `${mins} min`;
}

/**
 * Map a transport mode key to a display label with emoji.
 * @param {'auto'|'bicycle'|'pedestrian'} mode
 * @returns {string}
 */
export function getModeLabel(mode) {
  const labels = { auto: '🚗 car', bicycle: '🚲 bike', pedestrian: '🚶 foot' };
  return labels[mode] ?? mode;
}

/**
 * Signed angular difference, normalised to (-π, π].
 * @param {number} a - Angle in radians.
 * @param {number} b - Angle in radians.
 * @returns {number}
 */
export function angleDiff(a, b) {
  let d = a - b;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Deterministic pseudo-random value in [0, 1) from a single float seed.
 * @param {number} n
 * @returns {number}
 */
export function seededRand(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Smooth (smoothstep) interpolation between two seeded random values
 * sampled around `angle` on a circular lattice of `segments` nodes.
 * @param {number} angle   - Current angle (radians).
 * @param {number} seed    - Offset for the lattice hash.
 * @param {number} segments - Lattice resolution.
 * @returns {number} Value in [0, 1).
 */
export function smoothNoise(angle, seed, segments) {
  const pos  = (angle / (2 * Math.PI)) * segments;
  const i0   = Math.floor(pos);
  const frac = pos - i0;
  const v0   = seededRand(i0     + seed * 137);
  const v1   = seededRand(i0 + 1 + seed * 137);
  const t    = frac * frac * (3 - 2 * frac); // smoothstep
  return v0 + (v1 - v0) * t;
}

/**
 * Calculate the straight-line distance between two coordinates in kilometers using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
