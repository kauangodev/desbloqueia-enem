import { NextResponse } from "next/server";
import { appUrl } from "../../../lib/config";
import { DEMO_COOKIE } from "../../../lib/demo-auth";

export async function GET() {
  // Retired demonstration links cannot impersonate a real user or admin.
  const response = NextResponse.redirect(`${appUrl}/entrar`);
  response.cookies.delete(DEMO_COOKIE);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

