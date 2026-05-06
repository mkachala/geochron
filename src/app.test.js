// ── Unit test suite ────────────────────────────────────────────
// Tests pure utility functions that have no external dependencies.
// Run via test.html — no build step required.

import { formatDuration, getModeLabel, angleDiff, seededRand, smoothNoise } from './utils.js';
import { buildIrregularPolygon } from './fallback.js';
import { DEFAULT_TIMES, CUSTOM_TIME_COLORS } from './config.js';

/**
 * Minimal test runner.
 * @param {string} suiteName
 * @param {Array<{name: string, fn: () => void}>} tests
 * @returns {{ passed: number, failed: number }}
 */
export function runSuite(suiteName, tests) {
  const results = { passed: 0, failed: 0, details: [] };

  for (const { name, fn } of tests) {
    try {
      fn();
      results.passed++;
      results.details.push({ name, status: 'pass' });
    } catch (err) {
      results.failed++;
      results.details.push({ name, status: 'fail', message: err.message });
    }
  }

  return { suiteName, ...results };
}

/** Simple assertion helper. */
function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertApprox(actual, expected, tolerance = 1e-9, label = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${label}: expected ~${expected}, got ${actual} (diff ${diff})`);
  }
}

// ── Test suites ────────────────────────────────────────────────

export const suites = [

  runSuite('DEFAULT_TIMES & CUSTOM_TIME_COLORS', [
    {
      name: 'DEFAULT_TIMES matches expected set',
      fn() {
        const expected = [10, 30, 60];
        assert(
          DEFAULT_TIMES.length === expected.length &&
          expected.every((v, i) => DEFAULT_TIMES[i] === v),
          `DEFAULT_TIMES mismatch: ${JSON.stringify(DEFAULT_TIMES)}`
        );
      },
    },
    {
      name: 'CUSTOM_TIME_COLORS has an entry for every DEFAULT_TIMES value',
      fn() {
        assert(
          CUSTOM_TIME_COLORS.length === DEFAULT_TIMES.length,
          `Length mismatch: ${CUSTOM_TIME_COLORS.length} colors for ${DEFAULT_TIMES.length} times`
        );
        for (const color of CUSTOM_TIME_COLORS) {
          assert(typeof color === 'string', `color must be string, got ${typeof color}`);
        }
      },
    },
  ]),

  runSuite('formatDuration', [
    {
      name: 'whole hours → "X hr"',
      fn() {
        assert(formatDuration(60)  === '1 hr',  `60 → '${formatDuration(60)}'`);
        assert(formatDuration(120) === '2 hr',  `120 → '${formatDuration(120)}'`);
        assert(formatDuration(300) === '5 hr',  `300 → '${formatDuration(300)}'`);
        assert(formatDuration(180) === '3 hr',  `180 → '${formatDuration(180)}'`);
      },
    },
    {
      name: 'mixed hours and minutes → "Xh Ym"',
      fn() {
        assert(formatDuration(90)  === '1h 30m', `90 → '${formatDuration(90)}'`);
        assert(formatDuration(150) === '2h 30m', `150 → '${formatDuration(150)}'`);
      },
    },
    {
      name: 'sub-hour → "X min"',
      fn() {
        assert(formatDuration(0)  === '0 min',  `0 → '${formatDuration(0)}'`);
        assert(formatDuration(5)  === '5 min',  `5 → '${formatDuration(5)}'`);
        assert(formatDuration(10) === '10 min', `10 → '${formatDuration(10)}'`);
        assert(formatDuration(15) === '15 min', `15 → '${formatDuration(15)}'`);
        assert(formatDuration(20) === '20 min', `20 → '${formatDuration(20)}'`);
        assert(formatDuration(30) === '30 min', `30 → '${formatDuration(30)}'`);
        assert(formatDuration(40) === '40 min', `40 → '${formatDuration(40)}'`);
        assert(formatDuration(50) === '50 min', `50 → '${formatDuration(50)}'`);
        assert(formatDuration(45) === '45 min', `45 → '${formatDuration(45)}'`);
      },
    },
    {
      name: 'throws on invalid input',
      fn() {
        let threw = false;
        try { formatDuration(-1); } catch { threw = true; }
        assert(threw, 'expected RangeError for negative input');

        threw = false;
        try { formatDuration('x'); } catch { threw = true; }
        assert(threw, 'expected RangeError for string input');
      },
    },
  ]),

  runSuite('getModeLabel', [
    {
      name: 'known modes return emoji + text',
      fn() {
        assert(getModeLabel('auto')       === '🚗 car',  'auto');
        assert(getModeLabel('bicycle')    === '🚲 bike', 'bicycle');
        assert(getModeLabel('pedestrian') === '🚶 foot', 'pedestrian');
      },
    },
    {
      name: 'unknown mode falls back to the mode key itself',
      fn() {
        assert(getModeLabel('hovercraft') === 'hovercraft', 'unknown mode');
      },
    },
  ]),

  runSuite('angleDiff', [
    {
      name: 'same angle → 0',
      fn() {
        assertApprox(angleDiff(1, 1), 0, 1e-12, 'same');
      },
    },
    {
      name: 'wraps correctly across ±π boundary',
      fn() {
        assertApprox(angleDiff(Math.PI, -Math.PI), 0, 1e-10, 'π vs -π');
        assertApprox(angleDiff(-Math.PI, Math.PI), 0, 1e-10, '-π vs π');
      },
    },
    {
      name: 'result is in (-π, π]',
      fn() {
        for (let i = 0; i < 20; i++) {
          const a = (Math.random() - 0.5) * 6 * Math.PI;
          const b = (Math.random() - 0.5) * 6 * Math.PI;
          const d = angleDiff(a, b);
          assert(d > -Math.PI && d <= Math.PI, `out of range: ${d}`);
        }
      },
    },
  ]),

  runSuite('seededRand', [
    {
      name: 'output is in [0, 1)',
      fn() {
        for (let i = 0; i < 100; i++) {
          const v = seededRand(i * 13.7 + 0.3);
          assert(v >= 0 && v < 1, `out of range: ${v}`);
        }
      },
    },
    {
      name: 'is deterministic',
      fn() {
        assert(seededRand(42) === seededRand(42), 'not deterministic');
        assert(seededRand(0)  === seededRand(0),  'not deterministic at 0');
      },
    },
    {
      name: 'different seeds produce different values',
      fn() {
        assert(seededRand(1) !== seededRand(2), 'same output for different seeds');
      },
    },
  ]),

  runSuite('smoothNoise', [
    {
      name: 'output is in [0, 1)',
      fn() {
        for (let i = 0; i < 20; i++) {
          const angle = (2 * Math.PI * i) / 20;
          const v = smoothNoise(angle, 42, 8);
          assert(v >= 0 && v < 1, `out of range: ${v} at i=${i}`);
        }
      },
    },
    {
      name: 'is deterministic',
      fn() {
        const a = smoothNoise(1.5, 99, 12);
        const b = smoothNoise(1.5, 99, 12);
        assert(a === b, 'not deterministic');
      },
    },
  ]),

  runSuite('buildIrregularPolygon', [
    {
      name: 'returns a closed GeoJSON Polygon',
      fn() {
        const geo  = buildIrregularPolygon(52.52, 13.405, 100, 60, 'auto');
        assert(geo.type === 'Polygon', `type: ${geo.type}`);
        const ring = geo.coordinates[0];
        assert(Array.isArray(ring), 'ring is not an array');
        const first = ring[0];
        const last  = ring[ring.length - 1];
        assert(first[0] === last[0] && first[1] === last[1], 'ring not closed');
      },
    },
    {
      name: 'polygon has 97 points (96 + closure)',
      fn() {
        const geo  = buildIrregularPolygon(48.86, 2.35, 50, 120, 'bicycle');
        const ring = geo.coordinates[0];
        assert(ring.length === 97, `expected 97 points, got ${ring.length}`);
      },
    },
    {
      name: 'all coordinates are finite numbers',
      fn() {
        const geo  = buildIrregularPolygon(51.5, -0.12, 200, 360, 'pedestrian');
        const ring = geo.coordinates[0];
        for (const [lng, lat] of ring) {
          assert(isFinite(lng) && isFinite(lat), `non-finite coord: [${lng}, ${lat}]`);
        }
      },
    },
    {
      name: 'larger radius produces larger polygon',
      fn() {
        const smallRing = buildIrregularPolygon(52, 13, 50,  60, 'auto').coordinates[0];
        const largeRing = buildIrregularPolygon(52, 13, 200, 60, 'auto').coordinates[0];

        const avgDist = (ring) => {
          const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
          const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;
          return ring.reduce((s, c) => s + Math.hypot(c[0] - cx, c[1] - cy), 0) / ring.length;
        };

        assert(avgDist(largeRing) > avgDist(smallRing), 'larger radius not larger polygon');
      },
    },
    {
      name: 'works with new short time intervals (5, 10, 15 min)',
      fn() {
        for (const t of [5, 10, 15, 20, 30]) {
          const speed   = 60; // km/h (auto mode)
          const radiusKm = (speed * t) / 60;
          const geo     = buildIrregularPolygon(52.52, 13.405, radiusKm, t, 'auto');
          assert(geo.type === 'Polygon', `type wrong for t=${t}`);
          const ring = geo.coordinates[0];
          assert(ring.length === 97, `wrong point count for t=${t}`);
          for (const [lng, lat] of ring) {
            assert(isFinite(lng) && isFinite(lat), `non-finite coord at t=${t}`);
          }
        }
      },
    },
  ]),

];
