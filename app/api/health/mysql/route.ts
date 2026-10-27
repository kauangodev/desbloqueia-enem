import { NextResponse } from "next/server";
import { mysqlConfigured, mysqlHealth } from "../../../../lib/mysql";

/** Internal, read-only connectivity check for the Hostinger MySQL database. */
export async function GET(request: Request) {
  const expected = process.env.INTEGRATION_HEALTH_SECRET;
  const supplied = request.headers.get("x-integration-health-secret");
  if (!expected || supplied !== expected) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!mysqlConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  try {
    const healthy = await mysqlHealth();
    return NextResponse.json({ ok: healthy, configured: true, provider: "hostinger-mysql" }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, configured: true, provider: "hostinger-mysql" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
