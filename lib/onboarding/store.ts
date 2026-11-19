import "server-only";
import type { Kv } from "../operacao/kv";
import { applyStep, emptyState, ONBOARDING_VERSION, type OnboardingState, type StepInput } from "./model";

const KIND = "onboarding";
const REF = `v${ONBOARDING_VERSION}`;

export async function loadOnboarding(kv: Kv): Promise<OnboardingState> {
  const row = await kv.get<Partial<OnboardingState>>(KIND, REF);
  return { ...emptyState(), ...(row ?? {}) };
}

/**
 * Salva uma etapa já validada pelo modelo. Lê o estado atual, aplica a etapa e grava: duas abas gravando a mesma etapa terminam no
 * mesmo resultado (a conclusão nunca é desfeita e o avanço nunca regride), então não há perda de dados entre abas.
 */
export async function saveOnboardingStep(kv: Kv, input: StepInput, today: string): Promise<{ ok: true; state: OnboardingState } | { ok: false; error: string }> {
  const current = await loadOnboarding(kv);
  const result = applyStep(current, input, today, new Date().toISOString());
  if (!result.ok) return result;
  await kv.set(KIND, REF, result.value);
  return { ok: true, state: result.value };
}
