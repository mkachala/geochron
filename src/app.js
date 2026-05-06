// ── Application entry point ────────────────────────────────────
import { initMap, setMarker, getMarkerLatLng, renderIsochrones } from './map.js';
import { buildTimeInputs, bindModeButtons, bindHeatmapToggle, updateLocationInfo, showLoading, showToast } from './ui.js';
import { fetchValhallaIsochrones } from './api.js';
import { generateFallbackIsochrones } from './fallback.js';
import { DEFAULT_TIMES } from './config.js';

// ── State ──────────────────────────────────────────────────────
let selectedMode = 'auto';
let isLoading    = false;
let currentTimes = [...DEFAULT_TIMES];
let isHeatmapMode = false;

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap(handleMapClick);
  buildTimeInputs(currentTimes, handleTimeChange);
  bindModeButtons((newMode) => {
    selectedMode = newMode;
    const pos = getMarkerLatLng();
    if (pos) generateIsochrones(pos.lat, pos.lng);
  });
  bindHeatmapToggle((enabled) => {
    isHeatmapMode = enabled;
    const pos = getMarkerLatLng();
    if (pos) generateIsochrones(pos.lat, pos.lng);
  });
});

// ── Handlers ───────────────────────────────────────────────────

/** @param {number} lat @param {number} lng */
async function handleMapClick(lat, lng) {
  await generateIsochrones(lat, lng);
}

/** @param {number[]} newTimes - New array of times from inputs */
function handleTimeChange(newTimes) {
  currentTimes = [...newTimes];
  const pos = getMarkerLatLng();
  if (pos) generateIsochrones(pos.lat, pos.lng);
}

// ── Core logic ─────────────────────────────────────────────────

/**
 * Fetch (or fall back to) isochrones and render them on the map.
 * @param {number}      lat
 * @param {number}      lng
 * @param {string|null} [locationName]
 */
async function generateIsochrones(lat, lng, locationName = null) {
  if (isLoading) return;
  isLoading = true;
  showLoading(true);

  try {
    setMarker(lat, lng);
    updateLocationInfo(lat, lng, locationName, selectedMode);

    let timesArray;
    if (isHeatmapMode) {
      const maxTime = Math.max(...currentTimes);
      timesArray = [];
      for (let t = 5; t <= maxTime; t += 5) {
        timesArray.push(t);
      }
      if (!timesArray.includes(maxTime)) timesArray.push(maxTime);
    } else {
      timesArray = [...currentTimes].sort((a, b) => a - b);
    }

    if (timesArray.length === 0) {
      renderIsochrones([], selectedMode, currentTimes, isHeatmapMode);
      return;
    }

    let features;
    try {
      features = await fetchValhallaIsochrones(lat, lng, selectedMode, timesArray);
    } catch (apiErr) {
      console.warn('Valhalla API failed — using geometric fallback:', apiErr.message);
      features = generateFallbackIsochrones(lat, lng, selectedMode, timesArray);
      showToast('Using estimated travel times (routing service unavailable)');
    }

    renderIsochrones(features, selectedMode, currentTimes, isHeatmapMode);
  } catch (err) {
    console.error('Unexpected error generating isochrones:', err);
    showToast('Something went wrong. Please try again.', true);
  } finally {
    isLoading = false;
    showLoading(false);
  }
}
