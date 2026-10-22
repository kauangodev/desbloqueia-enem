import { sessionClient } from "../../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { appUrl } from "../../../../lib/config";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const db = await sessionClient();
  await db?.auth.signOut();
  return NextResponse.redirect(`${appUrl}/entrar`, 303);
}
