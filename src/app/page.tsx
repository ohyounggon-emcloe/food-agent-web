"use client";

import { LandingHeader } from "./landing/header";
import { HeroSection } from "./landing/hero-section";
import { FeaturesSection } from "./landing/features-section";
import { AgentArchitecture } from "./landing/agent-architecture";
import { InsightSlider } from "./landing/insight-slider";
import { MenuShowcase } from "./landing/menu-showcase";
import { ShieldSection } from "./landing/shield-section";
import { TrustSection } from "./landing/trust-section";
import { LandingFooter } from "./landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <AgentArchitecture />
      <InsightSlider />
      <MenuShowcase />
      <ShieldSection />
      <TrustSection />
      <LandingFooter />
    </div>
  );
}
