import { NextResponse } from "next/server";
import { sessionClient } from "../../../lib/supabase";
import { appUrl } from "../../../lib/config";
import { createHash } from "node:crypto";
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  const db = await sessionClient();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
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
        return NextResponse.redirect(
          `${appUrl}${profile?.role === "admin" ? "/admin" : "/aluno"}`,
        );
      }
    }
  }
  return NextResponse.redirect(`${appUrl}/entrar?erro=expirado`);
}
