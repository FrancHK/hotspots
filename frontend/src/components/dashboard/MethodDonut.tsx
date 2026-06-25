"use client";

import { formatTZS } from "@/lib/format";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// Dependency-free SVG donut with centre total + legend.
export function MethodDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const size = 180;
  const r = 70;
  const stroke = 26;
  const c = 2 * Math.PI * r;

  const visible = segments.filter((s) => s.value > 0);
  const arcs = visible.map((s, i) => {
    // Cumulative value of all preceding segments drives the start angle.
    const precede = visible.slice(0, i).reduce((sum, p) => sum + p.value, 0);
    const frac = total > 0 ? s.value / total : 0;
    return {
      ...s,
      dash: frac * c,
      gap: c - frac * c,
      rot: (precede / (total || 1)) * 360 - 90,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44 shrink-0" role="img" aria-label="Mgawanyo wa mapato">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={0}
            transform={`rotate(${a.rot} ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
        <text x="50%" y="46%" textAnchor="middle" className="fill-[var(--muted)]" fontSize="11">
          Jumla
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-[var(--text)]" fontSize="16" fontWeight="700">
          {total >= 1000 ? `${(total / 1000).toFixed(0)}k` : total}
        </text>
      </svg>

      <ul className="flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-content">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="tabular font-semibold text-muted">{formatTZS(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
