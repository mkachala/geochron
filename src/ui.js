// ── DOM / UI helpers ───────────────────────────────────────────
import { CUSTOM_TIME_COLORS } from './config.js';
import { getModeLabel } from './utils.js';
// ── Time Inputs ────────────────────────────────────────────────

/**
 * Render three time input fields.
 *
 * @param {number[]} initialTimes Array of exactly 3 initial times
 * @param {(newTimes: number[]) => void} onChange Callback when any input changes
 */
export function buildTimeInputs(initialTimes, onChange) {
  const container = document.getElementById('timeInputs');
  
  container.innerHTML = initialTimes.map((time, idx) => {
    const color = CUSTOM_TIME_COLORS[idx];
    return `
      <div class="time-input-wrapper">
        <div class="legend-color" style="background:${color}; --glow:${color}40;"></div>
        <input type="number" 
               class="time-input" 
               value="${time}" 
               min="1" 
               max="300"
               data-idx="${idx}">
        <span class="time-input-suffix">min</span>
      </div>`;
  }).join('');

  // Delegated change listener on the container
  container.addEventListener('change', (e) => {
    if (!e.target.classList.contains('time-input')) return;
    
    // Gather all current values
    const inputs = container.querySelectorAll('.time-input');
    const newTimes = Array.from(inputs).map(input => {
      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      return val;
    });
    
    onChange(newTimes);
  });
}

// ── Mode buttons ───────────────────────────────────────────────

/**
 * Attach click delegation to the transport-mode selector.
 * @param {(mode: string) => void} onChange
 */
export function bindModeButtons(onChange) {
  const selector = document.getElementById('modeSelector');
  selector.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    selector.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    onChange(btn.dataset.mode);
  });
}



// ── Location info ──────────────────────────────────────────────

/**
 * Display or update the "Selected Location" panel section.
 * @param {number}      lat
 * @param {number}      lng
 * @param {string|null} name
 * @param {string}      mode
 */
export function updateLocationInfo(lat, lng, name, mode) {
  document.getElementById('locationInfo').style.display = 'block';
  const nameRow = name
    ? `<div class="location-name">📍 ${name}</div>`
    : '';
  document.getElementById('locationDetails').innerHTML = `
    ${nameRow}
    <div class="location-coords"><span class="coord">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</span></div>
    <div class="location-mode">Mode: ${getModeLabel(mode)}</div>
  `;
}

// ── Loading overlay ────────────────────────────────────────────

/** @param {boolean} visible */
export function showLoading(visible) {
  document.getElementById('loading').classList.toggle('visible', visible);
}

// ── Toast notifications ────────────────────────────────────────

/**
 * Display a self-dismissing toast message.
 * @param {string}  message
 * @param {boolean} [isError=false]
 */
export function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}
