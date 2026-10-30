"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type HeroVariant = "a" | "b";

const STORAGE_KEY = "godev-hero-variant";

function readVariant(): HeroVariant | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "a" || value === "b" ? value : null;
}

export function HeroVariantGate({
  legacy,
  conversion,
  forcedVariant,
}: {
  legacy: ReactNode;
  conversion: ReactNode;
  forcedVariant?: HeroVariant;
}) {
  const [variant, setVariant] = useState<HeroVariant>(forcedVariant || "b");

  useEffect(() => {
    if (forcedVariant) {
      setVariant(forcedVariant);
      return;
    }

    // Marketing assignment is opt-in. Before consent the current B experience
    // remains the safe SSR fallback and no identifier is written.
    if (window.localStorage.getItem("godev-consent") !== "accepted") return;

    const existing = readVariant();
    if (existing) {
      setVariant(existing);
      return;
    }

    const assigned: HeroVariant = Math.random() < 0.5 ? "a" : "b";
    window.localStorage.setItem(STORAGE_KEY, assigned);
    setVariant(assigned);
  }, [forcedVariant]);

  return (
    <div data-hero-variant={variant} data-hero-ab="consent-local">
      {variant === "a" ? legacy : conversion}
    </div>
  );
}

