"use client";

import { useState } from "react";

const prices = [
  { label: "500 TZS", value: 500 },
  { label: "1,000 TZS", value: 1000 },
  { label: "2,000 TZS", value: 2000 },
];

// "If X customers buy a Y package each day, you keep 90% — here's your month."
export function EarningsCalculator() {
  const [customers, setCustomers] = useState(40);
  const [price, setPrice] = useState(1000);

  const monthlyGross = customers * price * 30;
  const yourShare = Math.round(monthlyGross * 0.9);

  return (
    <div className="rounded-3xl neu p-7 md:p-9">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        {/* Controls */}
        <div>
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-muted">
                Wateja kwa siku
              </span>
              <span className="tabular text-lg font-bold text-content">
                {customers}
              </span>
            </span>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={customers}
              onChange={(e) => setCustomers(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
              aria-label="Wateja kwa siku"
            />
          </label>

          <div className="mt-6">
            <span className="text-sm font-medium text-muted">
              Bei ya kifurushi
            </span>
            <div className="mt-2 flex gap-2">
              {prices.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPrice(p.value)}
                  className={
                    "tabular flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold " +
                    (price === p.value
                      ? "neu-brand"
                      : "neu-press text-content")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-3xl neu-inset p-7 text-center">
          <p className="text-sm font-medium text-muted">
            Makadirio ya mapato yako kwa mwezi
          </p>
          <p className="tabular mt-2 text-4xl font-extrabold text-earn md:text-5xl">
            {yourShare.toLocaleString("en-US")}
          </p>
          <p className="text-sm font-semibold text-muted">TZS / mwezi</p>
          <p className="mt-4 text-xs text-muted">
            Baada ya commission ya 10%. Mauzo ghafi:{" "}
            <span className="tabular font-semibold text-content">
              {monthlyGross.toLocaleString("en-US")} TZS
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
