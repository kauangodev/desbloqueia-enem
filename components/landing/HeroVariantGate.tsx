"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export type HeroVariant = "a" | "b";

export function HeroVariantGate({
  legacy,
  conversion,
  forcedVariant,
}: {
  legacy: ReactNode;
  conversion: ReactNode;
  forcedVariant?: HeroVariant;
}) {
  // The public landing page has one canonical experience. Keeping the old A/B
  // branch here allowed a stale localStorage assignment to resurrect the
  // legacy animated hero on mobile, even after a new deployment.
  const [variant] = useState<HeroVariant>(forcedVariant === "a" ? "b" : "b");

  return (
    <div data-hero-variant={variant} data-hero-ab="consent-local">
      {variant === "a" ? legacy : conversion}
    </div>
  );
}
