import { Reveal } from "./Reveal";

const small = [
  { icon: "📱", title: "Malipo ya simu", desc: "M-Pesa, Airtel, Mixx by Yas na Halotel — moja kwa moja." },
  { icon: "🎟️", title: "Vocha", desc: "Tengeneza na chapisha vocha kwa wingi." },
  { icon: "📡", title: "Omada & MikroTik", desc: "Portal hufanya kazi sawa kwa vifaa vyote." },
  { icon: "🎨", title: "Portal yako", desc: "Rangi, nembo na jina lako kwenye ukurasa wa WiFi." },
];

export function FeatureBento() {
  return (
    <section className="py-20">
      <Reveal>
        <h2 className="max-w-xl font-display text-3xl font-bold text-content md:text-4xl">
          Zana kamili za biashara yako ya WiFi
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3 md:grid-rows-2">
        {/* Hero tile: the commission split */}
        <Reveal className="md:col-span-1 md:row-span-2">
          <div className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-7 text-white shadow-xl">
            <div>
              <p className="text-sm font-semibold text-white/80">
                Commission wazi
              </p>
              <p className="tabular mt-3 text-6xl font-extrabold leading-none">
                90%
              </p>
              <p className="mt-2 text-sm text-white/85">
                ni yako kwa kila malipo ya simu. Sisi tunachukua 10% pekee —
                na 3% tu kwa vocha.
              </p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/15 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Malipo 1,000 TZS</span>
                <span className="tabular font-bold">+900 TZS</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[90%] rounded-full bg-white" />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Wide tile: analytics */}
        <Reveal className="md:col-span-2" delay={80}>
          <div className="flex h-full items-start gap-4 rounded-3xl neu p-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl neu-sm text-2xl">
              📊
            </span>
            <div>
              <h3 className="text-lg font-bold text-content">
                Dashibodi ya mapato
              </h3>
              <p className="mt-1.5 text-sm text-muted">
                Ona mapato ya leo, wiki na mwezi, sessions zinazoendelea, na
                uchanganue kwa njia ya malipo — yote sehemu moja.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Four small tiles */}
        {small.map((f, i) => (
          <Reveal key={f.title} delay={120 + i * 60}>
            <div className="h-full rounded-3xl neu p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl neu-sm text-xl">
                {f.icon}
              </span>
              <h3 className="mt-3.5 font-bold text-content">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
