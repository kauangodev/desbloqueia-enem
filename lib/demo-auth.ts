import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const DEMO_COOKIE = "desbloqueia_demo";
export type DemoMode = "student" | "admin";

const tokenFor = (mode: DemoMode) =>
  mode === "admin" ? process.env.DEMO_ADMIN_TOKEN : process.env.DEMO_STUDENT_TOKEN;

function equalSecret(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyDemoToken(token: string | null): DemoMode | null {
  if (!token) return null;
  for (const mode of ["student", "admin"] as const) {
    const expected = tokenFor(mode);
    if (expected && equalSecret(token, expected)) return mode;
  }
  return null;
}

function cookieSignature(mode: DemoMode) {
  const secret = process.env.DEMO_ACCESS_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`demo:${mode}`).digest("hex");
}

export function demoCookieValue(mode: DemoMode) {
  const signature = cookieSignature(mode);
  return signature ? `${mode}.${signature}` : null;
}

function verifyCookie(value: string | undefined): DemoMode | null {
  if (!value) return null;
  const [mode, signature] = value.split(".");
  if ((mode !== "student" && mode !== "admin") || !signature) return null;
  const expected = cookieSignature(mode);
  return expected && equalSecret(signature, expected) ? mode : null;
}

export async function getDemoMode() {
  const value = (await cookies()).get(DEMO_COOKIE)?.value;
  return verifyCookie(value);
}

