import "server-only";
import { UNITS } from "../trilha/service";
import { defaultFreeConfig } from "./model";
import type { FreeScope } from "./gate";
import type { Kv } from "../operacao/kv";
import type { QuotaUse } from "./model";

/** Escopo do Grátis. A unidade pode ser trocada por GRATIS_UNIT_ID (ex.: u-mat-porcentagem); sem valor, usa a primeira da Trilha. */
export function freeScope(): FreeScope {
  const wanted = process.env.GRATIS_UNIT_ID?.trim();
  const unit = UNITS.find((u) => u.id === wanted) ?? UNITS[0];
  const perDay = Number(process.env.GRATIS_QUESTOES_DIA);
  return { unitId: unit.id, moduleId: unit.moduleId, questionsPerDay: Number.isInteger(perDay) && perDay > 0 ? perDay : defaultFreeConfig.questionsPerDay, sessionKinds: ["diagnostico"] };
}

/** Uso da cota guardado em `operacao_state` (kind "quota", ref = dia). */
export async function loadQuota(kv: Kv, day: string): Promise<QuotaUse[]> {
  const row = await kv.get<{ keys: string[] }>("quota", day);
  return (row?.keys ?? []).map((key) => ({ key, day }));
}
export async function saveQuota(kv: Kv, day: string, uses: QuotaUse[]) {
  await kv.set("quota", day, { keys: uses.filter((u) => u.day === day).map((u) => u.key) });
}

export { withUserLock } from "./lock";
