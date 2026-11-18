import "server-only";
import { sessionClient } from "./supabase";
import { plans } from "./config";
import { accurateFeatures } from "./inventory";
import { features } from "./features";
import { pixReadiness } from "./pix/readiness";
/** Funcionalidade indisponível (correção automática de redações) não é divulgada como benefício; o texto no banco permanece intacto. */
export function withoutUnavailableBenefits(features: string[]) {
  return features
    .map((feature) => feature.replace(/\s*[;,.–—-]?\s*(em manutenção\s*[—–-]\s*)?corre[cç][aã]o autom[aá]tica[^;]*$/i, "").trim())
    .filter((feature) => feature && !/^(em manutenção|corre[cç][aã]o autom)/i.test(feature));
}
/** Com o corte Pix, o preço exibido é o da oferta Pix ATIVA (mesmo total na landing, comparação e checkout). */
export async function publicPlans() {
  const list = await publicPlansBase();
  if (!features.pix) return list;
  const pix = await pixReadiness();
  return list.map((p) => (p.id === "essencial" || p.id === "premium") && pix.cents[p.id] ? { ...p, cents: pix.cents[p.id] as number } : p);
}
async function publicPlansBase() {
  const db = await sessionClient();
  if (!db) return plans.map((p) => ({ ...p, features: accurateFeatures(withoutUnavailableBenefits([...p.features])) }));
  const { data, error } = await db
    .from("products")
    .select("id,name,description,price_cents,features")
    .order("price_cents");
  if (error || !data?.length)
    return plans.map((p) => ({ ...p, features: accurateFeatures(withoutUnavailableBenefits([...p.features])) }));
  return data.map((p) => {
    const configured = plans.find((plan) => plan.id === p.id);
    const legacyPremium = p.id === "premium" && p.price_cents === 3990;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      cents: legacyPremium && configured ? configured.cents : p.price_cents,
      features: accurateFeatures(withoutUnavailableBenefits((legacyPremium && configured ? [...configured.features] : (p.features as string[])))).map((feature) =>
        feature.replace(
          "Biblioteca navegável com 1.800 referências",
          "Biblioteca histórica com 1.800 questões de referência",
        ),
      ),
    };
  });
}
