import { NextResponse } from "next/server";
import { appUrl } from "./config";
export const jsonError = (error: string, status = 400) =>
  NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export function sameOrigin(request: Request) {
  const allowed = new Set([new URL(appUrl).origin]);
  if (process.env.NODE_ENV !== "production")
    allowed.add(new URL(request.url).origin);
  return allowed.has(request.headers.get("origin") || "");
}
