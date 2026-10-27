import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { mysqlPool } from "../../../lib/mysql";
import { appUrl } from "../../../lib/config";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${appUrl}/entrar?erro=expirado`);
  const [rows] = await mysqlPool().query<any[]>("SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3) LIMIT 1", [createHash("sha256").update(token).digest("hex")]);
  if (!rows[0]) return NextResponse.redirect(`${appUrl}/entrar?erro=otp_expired`);
  return NextResponse.redirect(`${appUrl}/definir-senha?token=${encodeURIComponent(token)}`);
}
