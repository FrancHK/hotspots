import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "./Reveal";

const plans = [
  {
    name: "Starter",
    price: "Bure",
    suffix: "",
    aps: "Access Point 1",
    highlight: false,
    perks: ["Vocha & malipo ya simu", "Portal yako", "Dashibodi ya msingi"],
  },
  {
    name: "Basic",
    price: "16,000",
    suffix: "TZS /mwezi",
    aps: "Access Points 5",
    highlight: true,
    perks: ["Kila kitu cha Starter", "Sites nyingi", "Takwimu kamili"],
  },
  {
    name: "Pro",
    price: "35,000",
    suffix: "TZS /mwezi",
    aps: "Access Points 10",
    highlight: false,
    perks: ["Kila kitu cha Basic", "Msaada wa kipaumbele", "Kiwango cha juu"],
  },
];

export function PricingSection() {
  return (
    <section className="py-20">
      <Reveal>
        <h2 className="text-center font-display text-3xl font-bold text-content md:text-4xl">
          Bei nafuu, wazi
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-muted">
          Una MikroTik? Hakuna ada ya kila mwezi — unalipa commission pekee.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 100}>
            <div
              className={
                "flex h-full flex-col rounded-3xl p-7 " +
                (p.highlight
                  ? "neu ring-2 ring-brand/60 md:-translate-y-3"
                  : "neu")
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-content">{p.name}</h3>
                {p.highlight && <Badge tone="brand">Maarufu</Badge>}
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="tabular text-3xl font-extrabold text-brand">
                  {p.price}
                </span>
                {p.suffix && (
                  <span className="text-sm font-medium text-muted">
                    {p.suffix}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm font-semibold text-muted">{p.aps}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {p.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm text-content"
                  >
                    <span className="text-brand">✓</span> {perk}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={
                  (p.highlight ? "neu-brand" : "neu-press text-content") +
                  " mt-6 block rounded-2xl py-3 text-center text-sm font-semibold"
                }
              >
                Chagua {p.name}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
