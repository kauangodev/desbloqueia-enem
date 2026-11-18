import "server-only";
import { formulas, modules, questions } from "../operacao/catalog";
import { freeScope } from "./free";

/**
 * Catálogo visível para cada conta. Plano pago e administrador veem tudo; o Grátis vê só o módulo da unidade introdutória
 * (módulo, questões e fichas de fórmulas dele). Todas as páginas e ações de estudo devem listar por aqui, nunca direto do catálogo.
 */
export type TierHolder = { tier: string };
export const scopeOf = (user: TierHolder) => (user.tier === "gratis" ? freeScope() : null);
export const questionsFor = (user: TierHolder) => { const s = scopeOf(user); return s ? questions.filter((q) => q.moduleId === s.moduleId) : questions; };
export const modulesFor = (user: TierHolder) => { const s = scopeOf(user); return s ? modules.filter((m) => m.id === s.moduleId) : modules; };
export const formulasFor = (user: TierHolder) => { const s = scopeOf(user); return s ? formulas.filter((f) => f.moduleId === s.moduleId) : formulas; };