"use client";

import { formatTZS } from "@/lib/format";

export interface ChartPoint {
  label: string;
  value: number;
}

// Dependency-free SVG area+line chart. Scales to its container via viewBox.
export function RevenueChart({ data }: { data: ChartPoint[] }) {
  const W = 720;
  const H = 240;
  const padX = 28;
  const padTop = 20;
  const padBottom = 34;

  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const stepX = n > 1 ? (W - padX * 2) / (n - 1) : 0;
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath =
    n > 0
      ? `${linePath} L ${x(n - 1)} ${H - padBottom} L ${x(0)} ${H - padBottom} Z`
      : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Mapato siku 7">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={padX}
          x2={W - padX}
          y1={padTop + g * (H - padTop - padBottom)}
          y2={padTop + g * (H - padTop - padBottom)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}

      {areaPath && <path d={areaPath} fill="url(#revFill)" />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--brand)" />
          <title>{`${d.label}: ${formatTZS(d.value)}`}</title>
          <text
            x={x(i)}
            y={H - 12}
            textAnchor="middle"
            className="fill-[var(--muted)]"
            fontSize="12"
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
