// ── Configuration ─────────────────────────────────────────────

export const BERLIN_CENTER = [52.52, 13.405];
export const DEFAULT_ZOOM = 6;

//export const VALHALLA_URL     = 'http://localhost:8002/isochrone';
export const VALHALLA_URL = 'https://isochron.duckdns.org/isochrone';

export const VALHALLA_TIMEOUT = 12_000; // ms

/** Default custom times (minutes) */
export const DEFAULT_TIMES = [10, 30, 60];

/** Colors assigned to the 3 custom time inputs */
export const CUSTOM_TIME_COLORS = ['#34d399', '#fb923c', '#e879f9'];

/** Average travel speeds (km/h) used by the geometric fallback. */
export const SPEEDS = { auto: 60, bicycle: 18, pedestrian: 5 };

/**
 * Radial corridor angles (radians) used to stretch the fallback polygon
 * along likely road/rail axes radiating from any central point.
 */
export const CORRIDORS = [
  0,               // East
  Math.PI * 0.25,  // NE
  Math.PI * 0.5,   // North
  Math.PI * 0.75,  // NW
  Math.PI,         // West
  Math.PI * 1.5,   // South
  Math.PI * 1.75,  // SE
];
