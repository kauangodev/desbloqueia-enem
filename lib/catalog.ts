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
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    cents: p.price_cents,
    features: p.features as string[],
  }));
}
