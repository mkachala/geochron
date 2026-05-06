// ── Map layer management ───────────────────────────────────────
import { BERLIN_CENTER, DEFAULT_ZOOM, CUSTOM_TIME_COLORS } from './config.js';
import { formatDuration, getModeLabel, calculateDistance } from './utils.js';

/** @type {L.Map} */
let map;
/** @type {L.Marker|null} */
let marker = null;
/** @type {L.LayerGroup} */
let isochroneGroup;

// ── Init ───────────────────────────────────────────────────────

/**
 * Create and configure the Leaflet map.
 * @param {(lat: number, lng: number) => void} onMapClick
 * @returns {L.Map}
 */
export function initMap(onMapClick) {
  map = L.map('map', {
    center:       BERLIN_CENTER,
    zoom:         DEFAULT_ZOOM,
    zoomControl:  false,
    preferCanvas: true,
  });

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
      maxZoom:    19,
      subdomains: 'abcd',
    }
  ).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  isochroneGroup = L.layerGroup().addTo(map);

  map.on('click', (e) => onMapClick(e.latlng.lat, e.latlng.lng));

  return map;
}

// ── Marker ─────────────────────────────────────────────────────

/**
 * Place (or move) the pulsing marker at the given coordinates.
 * @param {number} lat
 * @param {number} lng
 */
export function setMarker(lat, lng) {
  if (marker) map.removeLayer(marker);

  const icon = L.divIcon({
    className: 'pulse-marker',
    html:      '<div class="ring"></div><div class="dot"></div>',
    iconSize:  [40, 40],
    iconAnchor:[20, 20],
  });

  marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
}

/** @returns {{lat: number, lng: number}|null} */
export function getMarkerLatLng() {
  return marker ? marker.getLatLng() : null;
}

// ── Isochrones ─────────────────────────────────────────────────

/**
 * Render isochrone feature set as Leaflet polygons or heatmap.
 * @param {Array<{time: number, geometry: GeoJSON.Geometry}>} features
 * @param {string} mode - Current transport mode (for tooltip label).
 * @param {number[]} currentTimes - Active contour values.
 * @param {boolean} isHeatmapMode - Whether to render as a speed distortion heatmap.
 */
export function renderIsochrones(features, mode, currentTimes, isHeatmapMode = false) {
  isochroneGroup.clearLayers();

  const center = getMarkerLatLng();
  if (!center) return;

  if (isHeatmapMode) {
    renderHeatmapPolylines(features, mode, center);
  } else {
    renderIsochronePolygons(features, mode, currentTimes);
  }
}

/**
 * Render heatmap segmented polylines.
 * @param {Array<{time: number, geometry: GeoJSON.Geometry}>} features
 * @param {string} mode 
 * @param {{lat: number, lng: number}} center 
 */
function renderHeatmapPolylines(features, mode, center) {
  features.forEach((feat) => {
    const timeHours = feat.time / 60;
    const coords = feat.geometry.coordinates[0];
    
    for (let i = 0; i < coords.length - 1; i++) {
      const c1 = coords[i];
      const c2 = coords[i+1];
      
      const midLon = (c1[0] + c2[0]) / 2;
      const midLat = (c1[1] + c2[1]) / 2;
      const distKm = calculateDistance(center.lat, center.lng, midLat, midLon);
      
      const speed = distKm / timeHours;
      
      let max = mode === 'pedestrian' ? 8 : (mode === 'bicycle' ? 25 : 80);
      let min = mode === 'pedestrian' ? 3 : (mode === 'bicycle' ? 10 : 15);
      let ratio = (speed - min) / (max - min);
      ratio = Math.max(0, Math.min(1, ratio));
      
      const hue = ratio * 120;
      const color = `hsl(${hue}, 90%, 50%)`;
      
      const segment = L.polyline([
        [c1[1], c1[0]], 
        [c2[1], c2[0]]
      ], {
        color: color,
        weight: 4,
        opacity: 0.85,
        className: 'heatmap-poly'
      });
      
      isochroneGroup.addLayer(segment);
    }
  });
}

/**
 * Render standard isochrone polygons.
 * @param {Array<{time: number, geometry: GeoJSON.Geometry}>} features
 * @param {string} mode 
 * @param {number[]} currentTimes 
 */
function renderIsochronePolygons(features, mode, currentTimes) {
  const sorted = [...features].sort((a, b) => b.time - a.time);

  sorted.forEach((feat, idx) => {
    const timeIdx = currentTimes.indexOf(feat.time);
    if (timeIdx === -1) return;
    
    const polyColor = CUSTOM_TIME_COLORS[timeIdx % CUSTOM_TIME_COLORS.length];
    const latlngs = feat.geometry.coordinates[0].map((c) => [c[1], c[0]]);
    const baseFillOpacity = 0.12 + (sorted.length - idx) * 0.015;

    const polygon = L.polygon(latlngs, {
      color:       polyColor,
      weight:      1.5,
      opacity:     0.7,
      fillColor:   polyColor,
      fillOpacity: baseFillOpacity,
      smoothFactor:1.5,
      className:   'isochrone-poly',
    });

    polygon.bindTooltip(
      `${formatDuration(feat.time)} by ${getModeLabel(mode)}`,
      { className: 'iso-tooltip', sticky: true }
    );

    polygon.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.3, weight: 2.5 });
    });
    polygon.on('mouseout', function () {
      this.setStyle({ fillOpacity: baseFillOpacity, weight: 1.5 });
    });

    isochroneGroup.addLayer(polygon);
  });
}
