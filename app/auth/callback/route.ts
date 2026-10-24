import { NextResponse } from "next/server";
import { sessionClient } from "../../../lib/supabase";
import { appUrl } from "../../../lib/config";
import { createHash } from "node:crypto";
import type { EmailOtpType } from "@supabase/supabase-js";
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const tokenType = params.get("type");
  const next = params.get("next");
  const db = await sessionClient();
  if (db) {
    const exchange = code
      ? await db.auth.exchangeCodeForSession(code)
      : tokenHash && tokenType === "recovery"
        ? await db.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" as EmailOtpType })
        : { error: new Error("missing_auth_token") };
    if (!exchange.error) {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (user) {
        if (process.env.ACCESS_FINGERPRINT_SALT) {
          const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
          const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
          const fingerprint_hash = createHash("sha256").update(process.env.ACCESS_FINGERPRINT_SALT + ":" + ip).digest("hex");
          await db.rpc("record_access_fingerprint", { p_user_id: user.id, p_fingerprint_hash: fingerprint_hash, p_user_agent: req.headers.get("user-agent") || "" });
        }
        const { data: profile } = await db
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const destination = next === "/definir-senha" || !next ? "/definir-senha" : profile?.role === "admin" ? "/admin" : "/aluno";
        return NextResponse.redirect(`${appUrl}${destination}`);
      }
    }
  }
  const reason = params.get("error_code") || params.get("error") || "expirado";
  return NextResponse.redirect(`${appUrl}/entrar?erro=${encodeURIComponent(reason)}`);
}
