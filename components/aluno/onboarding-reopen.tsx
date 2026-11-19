"use client";

/** Botão em "Minha conta": reabre o modal de metas e ritmo (etapas 2 e 3). Só é renderizado com a chave do onboarding ligada. */
export default function OnboardingReopen() {
  return <button type="button" className="as-btn" onClick={() => window.dispatchEvent(new Event("godev-onboarding-open"))}>Rever metas e ritmo de estudo</button>;
}
