// ── Valhalla isochrone API client ──────────────────────────────
import { VALHALLA_URL, VALHALLA_TIMEOUT } from './config.js';

/**
 * Fetch isochrone polygons from the Valhalla routing engine via POST.
 *
 * @param {number}   lat
 * @param {number}   lng
 * @param {'auto'|'bicycle'|'pedestrian'} mode
 * @param {number[]} times  - Active contour values in minutes, pre-sorted ascending.
 * @returns {Promise<Array<{time: number, geometry: GeoJSON.Geometry}>>}
 * @throws {Error} on non-OK HTTP status, timeout, or empty feature set.
 */
export async function fetchValhallaIsochrones(lat, lng, mode, times) {
  const body = JSON.stringify({
    locations:  [{ lat, lon: lng }],
    costing:    mode,
    contours:   times.map((time) => ({ time })),
    polygons:   true,
    denoise:    0.4,
    generalize: 120,
  });

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), VALHALLA_TIMEOUT);

  let response;
  try {
    const url = `${VALHALLA_URL}?json=${encodeURIComponent(body)}`;
    response = await fetch(url, {
      method:  'GET',
      signal:  controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Valhalla responded with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.features?.length) {
    throw new Error('No isochrone features returned by Valhalla');
  }

  return data.features.map((f) => ({
    time:     f.properties.contour,
    geometry: f.geometry,
  }));
}
