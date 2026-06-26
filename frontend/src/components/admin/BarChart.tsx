"use client";

export interface BarPoint {
  label: string;
  value: number;
}

// Dependency-free SVG bar chart. Scales to its container via viewBox.
export function BarChart({
  data,
  unit = "",
}: {
  data: BarPoint[];
  unit?: string;
}) {
  const W = 720;
  const H = 240;
  const padX = 28;
  const padTop = 20;
  const padBottom = 34;

  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const innerW = W - padX * 2;
  const slot = n > 0 ? innerW / n : innerW;
  const barW = Math.max(2, slot * 0.62);
  const plotH = H - padTop - padBottom;
  const y = (v: number) => padTop + (1 - v / max) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Operators wapya">
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={padX}
          x2={W - padX}
          y1={padTop + g * plotH}
          y2={padTop + g * plotH}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}

      {data.map((d, i) => {
        const x = padX + i * slot + (slot - barW) / 2;
        const barH = (d.value / max) * plotH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y(d.value)}
              width={barW}
              height={Math.max(0, barH)}
              rx={Math.min(5, barW / 2)}
              fill="url(#barFill)"
            />
            <title>{`${d.label}: ${d.value}${unit ? ` ${unit}` : ""}`}</title>
            <text
              x={x + barW / 2}
              y={H - 12}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize="11"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
