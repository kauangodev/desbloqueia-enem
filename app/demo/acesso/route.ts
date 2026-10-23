import { NextResponse } from "next/server";
import { appUrl } from "../../../lib/config";
import {
  DEMO_COOKIE,
  demoCookieValue,
  verifyDemoToken,
} from "../../../lib/demo-auth";

export async function GET(req: Request) {
  const mode = verifyDemoToken(new URL(req.url).searchParams.get("token"));
  if (!mode) return NextResponse.redirect(`${appUrl}/entrar?erro=demo`);

  const response = NextResponse.redirect(
    `${appUrl}${mode === "admin" ? "/admin" : "/aluno"}`,
  );
  const value = demoCookieValue(mode);
  if (value) {
    response.cookies.set(DEMO_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 4,
    });
  }
  return response;
}

