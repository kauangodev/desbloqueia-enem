import { NextResponse, type NextRequest } from "next/server";

export async function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/aluno/:path*", "/admin/:path*", "/api/materials/:path*", "/api/study", "/api/admin"],
};
