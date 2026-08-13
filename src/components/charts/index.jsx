import React, { useState } from 'react';

/**
 * Chart primitives, as inline SVG.
 *
 * No charting library on purpose. Recharts or similar would add ~100KB gzipped
 * to a bundle aimed at basic Android phones on 2G — more than the entire offline
 * database layer costs — to draw a handful of bars.
 *
 * Colour follows the dataviz rules: every chart here is a single series, so it
 * uses one hue light→dark (sequential) rather than a categorical palette. The
 * job-stage ramp below is ordinal — four ordered stages — and was validated with
 * the palette checker: monotone lightness, adjacent ΔL ≥ 0.06, and a light end
 * that clears 2:1 against a white surface. Do not hand-tune these values without
 * re-running that check.
 */

const BRAND = '#D4AF37';

// gold 400 / 600 / 700 / 900 — validated ordinal ramp (cutting → delivered).
export const STAGE_RAMP = ['#e5ac3e', '#c08e1d', '#a06d1a', '#6b481a'];

const AXIS = '#9ca3af';
const GRID = '#f3f4f6';

function formatNaira(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

export function formatCount(value) {
  const n = Number(value) || 0;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * A single headline number. The dataviz form heuristic is explicit that one
 * value is a stat tile, never a one-bar chart.
 */
export function StatTile({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'text-gray-900',
    good: 'text-emerald-600',
    warn: 'text-amber-600',
    muted: 'text-gray-400',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-heading font-bold tabular-nums ${tones[tone] || tones.default}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * Column chart for a single series over time.
 *
 * One hue, recessive grid, 4px rounded tops anchored to the baseline, and a
 * hover tooltip — an SVG chart in a browser is interactive by default, so the
 * tooltip is not an extra.
 */
export function BarTrend({ data, xKey, yKey, height = 140, money = false, emptyLabel = 'No data yet' }) {
  const [hover, setHover] = useState(null);
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const values = rows.map((r) => Number(r[yKey]) || 0);
  const max = Math.max(...values, 1);
  const gap = 4;
  const barW = Math.max(6, Math.min(28, 260 / rows.length - gap));
  const width = rows.length * (barW + gap);
  const plotH = height - 22; // leave room for the value label on hover

  const fmt = money ? formatNaira : formatCount;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`Trend chart, ${rows.length} points, highest value ${fmt(max)}`}
      >
        {/* Recessive baseline — present for reference, never competing with data */}
        <line x1="0" y1={plotH} x2={width} y2={plotH} stroke={GRID} strokeWidth="1" />
        {rows.map((row, i) => {
          const v = Number(row[yKey]) || 0;
          const h = Math.max(v > 0 ? 2 : 0, (v / max) * (plotH - 6));
          const x = i * (barW + gap);
          return (
            <g key={row[xKey] ?? i}>
              {/* Hit target spans the full column height, not just the bar */}
              <rect
                x={x}
                y={0}
                width={barW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={x}
                y={plotH - h}
                width={barW}
                height={h}
                rx="4"
                fill={BRAND}
                opacity={hover === null || hover === i ? 1 : 0.45}
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && rows[hover] && (
        <div className="absolute -top-1 left-0 right-0 flex justify-center pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap">
            {rows[hover][xKey]} · {fmt(rows[hover][yKey])}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Part-to-whole across ordered stages.
 *
 * Horizontal stacked bar with a 2px surface gap between segments so adjacent
 * stages never bleed into one another. Every segment is labelled — identity is
 * never carried by colour alone.
 */
export function StageBar({ segments, total }) {
  const sum = total ?? segments.reduce((a, s) => a + (Number(s.value) || 0), 0);

  if (!sum) {
    return (
      <p className="text-xs text-gray-400 py-3">No active jobs right now.</p>
    );
  }

  return (
    <div>
      <div className="flex gap-[2px] h-3 rounded-full overflow-hidden">
        {segments.map((s, i) => {
          const v = Number(s.value) || 0;
          if (!v) return null;
          return (
            <div
              key={s.label}
              style={{ width: `${(v / sum) * 100}%`, backgroundColor: STAGE_RAMP[i % STAGE_RAMP.length] }}
              title={`${s.label}: ${v}`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: STAGE_RAMP[i % STAGE_RAMP.length] }}
            />
            <span className="text-gray-500 capitalize">{s.label}</span>
            <span className="ml-auto font-semibold text-gray-800 tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Ranked horizontal bars — magnitude, so one hue with length doing the work.
 * Values are direct-labelled because there's no axis to read them against.
 */
export function RankedBars({ items, money = false, emptyLabel = 'Nothing to show yet' }) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return <p className="text-xs text-gray-400 py-3">{emptyLabel}</p>;

  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  const fmt = money ? formatNaira : formatCount;

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs text-gray-600 truncate">{row.label}</span>
            <span className="text-xs font-semibold text-gray-800 tabular-nums shrink-0">
              {fmt(row.value)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, ((Number(row.value) || 0) / max) * 100)}%`, backgroundColor: BRAND }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export { formatNaira };
