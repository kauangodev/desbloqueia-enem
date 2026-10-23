import { sessionClient } from "../../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { appUrl } from "../../../../lib/config";
import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "../../../../lib/demo-auth";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const db = await sessionClient();
  await db?.auth.signOut();
  const response = NextResponse.redirect(`${appUrl}/entrar`, 303);
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
