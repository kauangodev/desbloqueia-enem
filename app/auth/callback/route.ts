import { NextResponse } from "next/server";
import { sessionClient } from "../../../lib/supabase";
import { appUrl } from "../../../lib/config";
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  const db = await sessionClient();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${appUrl}/aluno`);
  }
  return NextResponse.redirect(`${appUrl}/entrar?erro=expirado`);
}
