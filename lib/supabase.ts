import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getDemoMode } from "./demo-auth";
export const authConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
export async function sessionClient() {
  if (!authConfigured()) return null;
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (entries) => {
          try {
            entries.forEach(({ name, value, options }) =>
              jar.set(name, value, {
                ...options,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              }),
            );
          } catch {
            /* Server component: refresh in route handler. */
          }
        },
      },
    },
  );
}
export function serviceClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error("Banco não configurado");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function identity() {
  const demoMode = await getDemoMode();
  if (demoMode) {
    const id =
      demoMode === "admin"
        ? "00000000-0000-4000-8000-000000000001"
        : "00000000-0000-4000-8000-000000000002";
    return {
      db: serviceClient(),
      user: {
        id,
        email: "kauango.dev+aluno@gmail.com",
        user_metadata: { name: demoMode === "admin" ? "Kauan · demonstração" : "Aluno · demonstração" },
      },
      profile: {
        id,
        name: demoMode === "admin" ? "Kauan · demonstração" : "Aluno · demonstração",
        role: demoMode === "admin" ? "admin" : "student",
      },
      demo: true,
    };
  }
  const db = await sessionClient();
  if (!db) return null;
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("id,name,role")
    .eq("id", user.id)
    .single();
  return { db, user, profile };
}
export async function canAccess(plan: string) {
  const who = await identity();
  if (!who) return null;
  if (who.demo) return who;
  if (who.profile?.role === "admin") return who;
  const { data } = await who.db
    .from("entitlements")
    .select("plan")
    .eq("user_id", who.user.id)
    .eq("active", true);
  return data?.some((e) => e.plan === "premium" || e.plan === plan)
    ? who
    : null;
}
