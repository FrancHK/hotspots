import Link from "next/link";
import { Reveal } from "./Reveal";

export function CtaSection() {
  return (
    <section className="py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy to-[#0b1020] px-6 py-16 text-center">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white md:text-4xl">
            Tayari kupata pesa kutoka WiFi yako?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/70">
            Jisajili bure leo. Hakuna kadi ya benki inayohitajika.
          </p>
          <Link
            href="/register"
            className="neu-brand relative mt-8 inline-block rounded-2xl px-9 py-4 text-base font-semibold"
          >
            Fungua Akaunti Bure 🚀
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
