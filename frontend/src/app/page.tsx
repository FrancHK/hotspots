import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { EarningsCalculator } from "@/components/landing/EarningsCalculator";
import { PricingSection } from "@/components/landing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Reveal } from "@/components/landing/Reveal";

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <Hero />

      <TrustStrip />

      <div className="mx-auto w-full max-w-6xl px-6">
        <HowItWorks />
        <FeatureBento />

        {/* Earnings calculator band */}
        <section className="py-12">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold text-content md:text-4xl">
              Utapata kiasi gani?
            </h2>
            <p className="mx-auto mb-10 mt-2 max-w-md text-center text-muted">
              Sogeza chini uone makadirio ya mapato yako ya mwezi.
            </p>
          </Reveal>
          <Reveal>
            <EarningsCalculator />
          </Reveal>
        </section>

        <PricingSection />
        <CtaSection />
        <SiteFooter />
      </div>
    </>
  );
}
