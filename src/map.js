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
 * Render isochrone feature set as Leaflet polygons.
 * @param {Array<{time: number, geometry: GeoJSON.Geometry}>} features
 * @param {string} mode - Current transport mode (for tooltip label).
 * @param {number[]} currentTimes - Active contour values.
 */
export function renderIsochrones(features, mode, currentTimes) {
  isochroneGroup.clearLayers();

  const center = getMarkerLatLng();
  if (!center) return;

  renderIsochronePolygons(features, mode, currentTimes);
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
