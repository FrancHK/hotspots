const integrations = [
  "TP-Link Omada",
  "MikroTik",
  "M-Pesa",
  "Airtel Money",
  "Mixx by Yas",
  "Halotel",
];

// Honest social proof: the real hardware + payment rails HotspotX speaks to.
export function TrustStrip() {
  return (
    <section className="border-y border-line py-8">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted">
        Inafanya kazi na
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {integrations.map((name) => (
          <span
            key={name}
            className="rounded-full neu-sm px-4 py-2 text-sm font-semibold text-content"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
