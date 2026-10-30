"use client";

import type { ReactNode } from "react";

export type HeroVariant = "a" | "b";

export function HeroVariantGate({
  conversion,
}: {
  conversion: ReactNode;
}) {
  // The public landing page has one canonical experience. Keeping the old A/B
  // branch here allowed a stale localStorage assignment to resurrect the
  // legacy animated hero on mobile, even after a new deployment.
  const variant: HeroVariant = "b";

  return (
    <div data-hero-variant={variant} data-hero-ab="consent-local">
      {conversion}
    </div>
  );
}
