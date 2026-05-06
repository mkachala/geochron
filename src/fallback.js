// ── Geometric fallback isochrones ──────────────────────────────
// Used when the Valhalla API is unavailable.
import { SPEEDS, CORRIDORS } from './config.js';
import { angleDiff, smoothNoise } from './utils.js';

/**
 * Generate approximate isochrone polygons using multi-octave noise
 * and directional corridor stretching.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {'auto'|'bicycle'|'pedestrian'} mode
 * @param {number[]} times
 * @returns {Array<{time: number, geometry: GeoJSON.Geometry}>}
 */
export function generateFallbackIsochrones(lat, lng, mode, times) {
  const speed = SPEEDS[mode];
  return times.map((time) => {
    const radiusKm = (speed * time) / 60;
    return { time, geometry: buildIrregularPolygon(lat, lng, radiusKm, time, mode) };
  });
}

/**
 * Build a GeoJSON Polygon that mimics an organic isochrone shape.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm  - Base radius in kilometres.
 * @param {number} seed      - Deterministic noise seed (usually the time value).
 * @param {'auto'|'bicycle'|'pedestrian'} mode
 * @returns {GeoJSON.Geometry}
 */
export function buildIrregularPolygon(lat, lng, radiusKm, seed, mode) {
  const NUM_POINTS = 96;
  const coords = [];

  for (let i = 0; i < NUM_POINTS; i++) {
    const angle = (2 * Math.PI * i) / NUM_POINTS;

    // Multi-octave noise for organic shape variation
    const n1 = smoothNoise(angle,     seed + lat * 100, 8);
    const n2 = smoothNoise(angle * 2, seed + lng * 77,  12) * 0.5;
    const n3 = smoothNoise(angle * 4, seed * 3.7,        16) * 0.25;
    const baseNoise = 0.68 + 0.52 * ((n1 + n2 + n3) / 1.75);

    // Boost radius along likely transit/road corridors
    const corridorBoost = computeCorridorBoost(angle);

    // Mode-specific stretching: cars follow highways more than walkers
    const modeStretch = getModeStretch(mode, corridorBoost);

    const r    = radiusKm * baseNoise * modeStretch;
    const dLat = (r * Math.sin(angle)) / 111.32;
    const dLng = (r * Math.cos(angle)) / (111.32 * Math.cos((lat * Math.PI) / 180));

    coords.push([lng + dLng, lat + dLat]);
  }

  coords.push(coords[0]); // close ring
  return { type: 'Polygon', coordinates: [coords] };
}

// ── Private helpers ────────────────────────────────────────────

/**
 * Peak corridor boost factor for a given ray angle.
 * @param {number} angle - Radians.
 * @returns {number} Value in [0, 0.18].
 */
function computeCorridorBoost(angle) {
  const THRESHOLD = 0.35;
  let boost = 0;
  for (const cAngle of CORRIDORS) {
    const diff = Math.abs(angleDiff(angle, cAngle));
    if (diff < THRESHOLD) {
      boost = Math.max(boost, ((THRESHOLD - diff) / THRESHOLD) * 0.18);
    }
  }
  return boost;
}

/**
 * @param {'auto'|'bicycle'|'pedestrian'} mode
 * @param {number} corridorBoost
 * @returns {number}
 */
function getModeStretch(mode, corridorBoost) {
  if (mode === 'auto')      return 1.0 + corridorBoost * 1.3;
  if (mode === 'bicycle')   return 1.0 + corridorBoost * 0.7;
  /* pedestrian */          return 1.0 + corridorBoost * 0.2;
}
