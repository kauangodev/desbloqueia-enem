import "server-only";
import { sessionClient } from "./supabase";
import { plans } from "./config";
/** Funcionalidade indisponível (correção automática de redações) não é divulgada como benefício; o texto no banco permanece intacto. */
export function withoutUnavailableBenefits(features: string[]) {
  return features
    .map((feature) => feature.replace(/\s*[;,.–—-]?\s*(em manutenção\s*[—–-]\s*)?corre[cç][aã]o autom[aá]tica[^;]*$/i, "").trim())
    .filter((feature) => feature && !/^(em manutenção|corre[cç][aã]o autom)/i.test(feature));
}
export async function publicPlans() {
  const db = await sessionClient();
  if (!db) return plans.map((p) => ({ ...p, features: withoutUnavailableBenefits([...p.features]) }));
  const { data, error } = await db
    .from("products")
    .select("id,name,description,price_cents,features")
    .order("price_cents");
  if (error || !data?.length)
    return plans.map((p) => ({ ...p, features: withoutUnavailableBenefits([...p.features]) }));
  return data.map((p) => {
    const configured = plans.find((plan) => plan.id === p.id);
    const legacyPremium = p.id === "premium" && p.price_cents === 3990;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      cents: legacyPremium && configured ? configured.cents : p.price_cents,
      features: withoutUnavailableBenefits((legacyPremium && configured ? [...configured.features] : (p.features as string[]))).map((feature) =>
        feature.replace(
          "Biblioteca navegável com 1.800 referências",
          "Biblioteca histórica com 1.800 questões de referência",
        ),
      ),
    };
  });
}
