// The signature element: a phone showing the real captive portal, with a
// "+900 TZS" chip floating up to the operator's wallet pill — "your WiFi pays
// you". Pure CSS animation (no JS); reduced-motion handled in globals.css.

const packages = [
  { name: "Saa 1", price: "500", hot: false },
  { name: "Saa 3", price: "1,000", hot: true },
  { name: "Siku 1", price: "2,000", hot: false },
];

export function PortalMockup() {
  return (
    <div className="relative mx-auto w-[270px] select-none sm:w-[300px]">
      {/* Operator wallet pill (where the money lands) */}
      <div className="absolute -right-3 -top-6 z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-xl ring-1 ring-black/5">
        <span className="text-lg">💰</span>
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-navy/60">Pochi yako</p>
          <p className="tabular text-sm font-bold text-navy">48,600 TZS</p>
        </div>
      </div>

      {/* Floating earnings chip */}
      <div className="coin-float absolute right-6 top-14 z-20 rounded-full bg-earn px-3 py-1 text-xs font-bold text-white shadow-lg">
        +900 TZS
      </div>

      {/* Phone frame */}
      <div className="rounded-[2.5rem] bg-[#0b1020] p-3 shadow-2xl ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#141a2e] to-[#0b1020] p-5">
          {/* status bar */}
          <div className="mb-5 flex items-center justify-between text-[10px] text-white/50">
            <span>9:41</span>
            <span>WiFi · 📶</span>
          </div>

          {/* brand */}
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-2xl">
              🐆
            </span>
            <p className="mt-2 text-sm font-bold text-white">Cheetah Cafe</p>
            <p className="text-[11px] text-white/50">Karibu — chagua kifurushi</p>
          </div>

          {/* packages */}
          <div className="mt-5 space-y-2.5">
            {packages.map((p) => (
              <div
                key={p.name}
                className={
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm " +
                  (p.hot
                    ? "bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg"
                    : "bg-white/5 text-white ring-1 ring-white/10")
                }
              >
                <span className="font-semibold">{p.name}</span>
                <span className="tabular font-bold">{p.price} TZS</span>
              </div>
            ))}
          </div>

          {/* voucher field */}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
            <span className="text-xs text-white/40">🎟️</span>
            <span className="tabular text-xs tracking-widest text-white/40">
              XXXX-XXXX-XXXX
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-white py-2.5 text-center text-sm font-bold text-navy">
            Lipa kwa M-Pesa
          </div>
        </div>
      </div>
    </div>
  );
}
