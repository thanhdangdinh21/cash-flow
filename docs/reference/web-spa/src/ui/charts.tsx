/* Plain-SVG charts, DS colors only — ported from web/ui.jsx. */
import { money } from "../data/format";

export function WBars({
  weeks,
  w = 480,
  h = 150,
  barW = 16,
  labels = true,
  monthAbbr = "Mar",
}: {
  weeks: { label: string; spent: number; income: number }[];
  w?: number;
  h?: number;
  barW?: number;
  labels?: boolean;
  monthAbbr?: string;
}) {
  const padB = labels ? 20 : 4;
  const chartH = h - padB;
  const max = Math.max(1, ...weeks.map((d) => Math.max(d.income, d.spent)));
  const slot = w / weeks.length;
  return (
    <svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}>
      <line x1="0" y1={chartH + 0.5} x2={w} y2={chartH + 0.5} stroke="var(--line-2)" />
      {weeks.map((d, i) => {
        const cx = slot * i + slot / 2;
        const ih = Math.max(3, (d.income / max) * (chartH - 10));
        const sh = Math.max(3, (d.spent / max) * (chartH - 10));
        return (
          <g key={i}>
            <rect x={cx - barW - 2} y={chartH - ih} width={barW} height={ih} rx="4" fill="var(--positive)" opacity={d.income ? 1 : 0.25} />
            <rect x={cx + 2} y={chartH - sh} width={barW} height={sh} rx="4" fill="var(--negative)" opacity="0.9" />
            {labels && (
              <text x={cx} y={h - 4} textAnchor="middle" fill="var(--ink-3)" fontSize="10" fontFamily="var(--font-mono)">
                {monthAbbr} {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function WLine({
  data,
  w = 480,
  h = 150,
  stroke = "var(--ink)",
  labels = true,
  dot = true,
}: {
  data: { m: string; v: number }[];
  w?: number;
  h?: number;
  stroke?: string;
  labels?: boolean;
  dot?: boolean;
}) {
  const padB = labels ? 20 : 4;
  const padT = 8;
  const chartH = h - padB;
  const vs = data.map((d) => d.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const stepX = w / (data.length - 1 || 1);
  const pts = data.map((d, i) => [i * stepX, padT + (1 - (d.v - min) / span) * (chartH - padT - 6)] as const);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${w} ${chartH} L 0 ${chartH} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}>
      <path d={area} fill="var(--ink)" opacity="0.05" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {dot && <circle cx={last[0] - 2} cy={last[1]} r="3.5" fill={stroke} />}
      <line x1="0" y1={chartH + 0.5} x2={w} y2={chartH + 0.5} stroke="var(--line-2)" />
      {labels && data.map((d, i) => (
        <text key={i} x={Math.min(Math.max(pts[i][0], 10), w - 12)} y={h - 4} textAnchor="middle" fill="var(--ink-3)" fontSize="10" fontFamily="var(--font-mono)">
          {d.m}
        </text>
      ))}
    </svg>
  );
}

export function WDonut({ slices, size = 150, thick = 20 }: { slices: { v: number; color: string }[]; size?: number; thick?: number }) {
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.v, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ display: "block", transform: "rotate(-90deg)" }}>
      {slices.map((s, i) => {
        const frac = s.v / total;
        const dash = Math.max(0, frac * c - 2.5);
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thick}
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-acc * c}
          />
        );
        acc += frac;
        return el;
      })}
    </svg>
  );
}

export function HBar({
  label,
  v,
  max,
  color = "var(--ink)",
  fmt = (n: number) => money(n, { cents: false }),
}: {
  label: string;
  v: number;
  max: number;
  color?: string;
  fmt?: (n: number) => string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>{label}</span>
        <span className="w-amount" style={{ fontSize: 12.5, fontWeight: 600 }}>{fmt(v)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--paper-2)" }}>
        <div style={{ height: 6, width: `${Math.min(100, (v / (max || 1)) * 100)}%`, borderRadius: 999, background: color }} />
      </div>
    </div>
  );
}
