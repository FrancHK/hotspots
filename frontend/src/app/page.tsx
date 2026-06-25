import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatTZS } from "@/lib/format";

const features = [
  { icon: "📱", title: "Malipo ya Simu", desc: "M-Pesa, Airtel, Mixx by Yas na Halotel — moja kwa moja kwenye portal." },
  { icon: "🎟️", title: "Vocha", desc: "Tengeneza, chuja na chapisha vocha za XXXX-XXXX-XXXX kwa wingi." },
  { icon: "📊", title: "Dashibodi ya Mapato", desc: "Ona mapato ya leo, wiki na mwezi pamoja na sessions zinazoendelea." },
  { icon: "📡", title: "Omada & MikroTik", desc: "Unganisha vifaa vyako — portal hufanya kazi sawa kwa vyote." },
  { icon: "💰", title: "Commission Wazi", desc: "Pata 90% ya kila malipo. Sisi tunachukua 10% pekee (3% kwa vocha)." },
  { icon: "🎨", title: "Portal Yako", desc: "Weka rangi, nembo na jina la biashara yako kwenye ukurasa wa WiFi." },
];

const plans = [
  {
    name: "Starter",
    price: 0,
    priceLabel: "Bure",
    aps: "Access Point 1",
    highlight: false,
    perks: ["Vocha & malipo ya simu", "Portal yako", "Dashibodi ya msingi"],
  },
  {
    name: "Basic",
    price: 16000,
    priceLabel: formatTZS(16000),
    aps: "Access Points 5",
    highlight: true,
    perks: ["Kila kitu cha Starter", "Sites nyingi", "Takwimu kamili"],
  },
  {
    name: "Pro",
    price: 35000,
    priceLabel: formatTZS(35000),
    aps: "Access Points 10",
    highlight: false,
    perks: ["Kila kitu cha Basic", "Vipaumbele vya msaada", "Kiwango cha juu"],
  },
];

export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      {/* Nav */}
      <header className="flex items-center justify-between py-6">
        <Brand withTagline size="md" />
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="neu-press rounded-2xl px-5 py-3 text-sm font-semibold text-content"
          >
            Ingia
          </Link>
          <Link
            href="/register"
            className="neu-brand rounded-2xl px-5 py-3 text-sm font-semibold"
          >
            Anza Sasa
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center py-16 text-center md:py-24">
        <span className="mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] neu-brand text-6xl">
          🐆
        </span>
        <Badge tone="brand" className="mb-5">
          Haraka · Nguvu · Imara
        </Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-content md:text-6xl">
          Uza <span className="text-brand">WiFi</span> kwa wateja wako,
          pata pesa kila dakika
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted md:text-lg">
          HotspotX ni mfumo wa kusimamia hotspot za WiFi kwa hoteli, migahawa
          na hospitali Tanzania. Wateja hulipa kwa simu au vocha, internet
          hufunguka papo hapo.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="neu-brand rounded-2xl px-8 py-4 text-base font-semibold"
          >
            Anza Bure 🚀
          </Link>
          <Link
            href="/login"
            className="neu-press rounded-2xl px-8 py-4 text-base font-semibold text-content"
          >
            Ingia kwenye Akaunti
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-center text-3xl font-bold text-content">
          Kila kitu unachohitaji
        </h2>
        <p className="mt-2 text-center text-muted">
          Zana kamili za kuendesha biashara yako ya WiFi.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl neu-sm text-2xl">
                {f.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-content">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <h2 className="text-center text-3xl font-bold text-content">
          Bei nafuu, wazi
        </h2>
        <p className="mt-2 text-center text-muted">
          MikroTik? Hakuna ada ya kila mwezi — unalipa commission pekee.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={
                p.highlight
                  ? "ring-2 ring-brand/60 md:-translate-y-3"
                  : undefined
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-content">{p.name}</h3>
                {p.highlight && <Badge tone="brand">Maarufu</Badge>}
              </div>
              <p className="mt-4 text-3xl font-extrabold text-brand">
                {p.priceLabel}
                {p.price > 0 && (
                  <span className="text-sm font-medium text-muted"> /mwezi</span>
                )}
              </p>
              <p className="mt-1 text-sm font-semibold text-muted">{p.aps}</p>
              <ul className="mt-5 space-y-2">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-content">
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
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <Card className="flex flex-col items-center gap-6 py-14 text-center">
          <h2 className="max-w-2xl text-3xl font-bold text-content md:text-4xl">
            Tayari kuanza kupata pesa kutoka WiFi yako?
          </h2>
          <p className="max-w-md text-muted">
            Jisajili bure leo. Hakuna kadi ya benki inayohitajika.
          </p>
          <Link
            href="/register"
            className="neu-brand rounded-2xl px-9 py-4 text-base font-semibold"
          >
            Fungua Akaunti Bure
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-3 border-t border-line py-10 text-center text-sm text-muted">
        <Brand size="sm" />
        <p>© {new Date().getFullYear()} HotspotX · Haraka · Nguvu · Imara</p>
      </footer>
    </div>
  );
}
