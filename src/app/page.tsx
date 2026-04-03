"use client";

import { LandingHeader } from "./landing/header";
import { HeroSection } from "./landing/hero-section";
import { FeaturesSection } from "./landing/features-section";
import { MenuShowcase } from "./landing/menu-showcase";
import { LandingFooter } from "./landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <MenuShowcase />
      <LandingFooter />
    </div>
  );
}
