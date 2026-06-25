import Link from "next/link";
import Image from "next/image";
import { EarningsTicker } from "./EarningsTicker";
import { PortalMockup } from "./PortalMockup";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden">
      {/* Ambient world-map background, fills the screen */}
      <Image
        src="/landimg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-[1] bg-gradient-to-b from-[#0b1020]/85 via-[#0b1020]/75 to-[#0b1020]/95" />
      {/* Soft orange glow to tie the brand in */}
      <div className="pointer-events-none absolute -left-32 top-1/3 -z-[1] h-96 w-96 rounded-full bg-brand/20 blur-3xl arc-pulse" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-36">
        {/* Left: message */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
            🐆 Haraka · Nguvu · Imara
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl">
            Geuza <span className="text-brand">WiFi</span> yako
            <br /> kuwa biashara
          </h1>
          <p className="mt-5 max-w-md text-base text-white/75 md:text-lg">
            Wateja wanalipa kwa simu au vocha, internet inafunguka papo hapo —
            wewe unapata <span className="font-semibold text-white">90%</span> ya
            kila malipo.
          </p>

          {/* Live earnings chip */}
          <div className="mt-7 inline-flex flex-col rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <span className="text-xs font-medium text-white/55">
              Mfano: umepata leo
            </span>
            <EarningsTicker target={142500} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="neu-brand rounded-2xl px-8 py-4 text-base font-semibold"
            >
              Anza Bure 🚀
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/40 px-8 py-4 text-base font-semibold text-white hover:bg-white/10"
            >
              Ona Demo
            </Link>
          </div>
        </div>

        {/* Right: the signature portal mockup */}
        <div className="flex justify-center md:justify-end">
          <PortalMockup />
        </div>
      </div>
    </section>
  );
}
