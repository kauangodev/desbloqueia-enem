import "server-only";
import { sessionClient } from "./supabase";
import { plans } from "./config";
export async function publicPlans() {
  const db = await sessionClient();
  if (!db) return plans.map((p) => ({ ...p, features: [...p.features] }));
  const { data, error } = await db
    .from("products")
    .select("id,name,description,price_cents,features")
    .order("price_cents");
  if (error || !data?.length)
    return plans.map((p) => ({ ...p, features: [...p.features] }));
  return data.map((p) => {
    const configured = plans.find((plan) => plan.id === p.id);
    const legacyPremium = p.id === "premium" && p.price_cents === 3990;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      cents: legacyPremium && configured ? configured.cents : p.price_cents,
      features: legacyPremium && configured ? [...configured.features] : (p.features as string[]),
    };
  });
}
