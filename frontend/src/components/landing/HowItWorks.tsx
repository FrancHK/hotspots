import { Reveal } from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Mteja anaunganisha WiFi",
    desc: "Anapofungua WiFi yako, ukurasa wako wa malipo unajitokeza wenye nembo na rangi zako.",
  },
  {
    n: "02",
    title: "Analipa kwa simu au vocha",
    desc: "M-Pesa, Airtel, Mixx by Yas, Halotel — au anaweka vocha. Malipo yanathibitishwa papo hapo.",
  },
  {
    n: "03",
    title: "Internet inafunguka, unapata pesa",
    desc: "Mteja anaunganishwa moja kwa moja na 90% ya malipo inaingia pochini mwako.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <Reveal>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">
          Jinsi inavyofanya kazi
        </p>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold text-content md:text-4xl">
          Hatua tatu kutoka WiFi hadi pesa
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div className="h-full rounded-3xl neu p-7">
              <span className="tabular text-5xl font-extrabold text-brand/30">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-content">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
