import { NextResponse } from "next/server";
import { canAccess } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeAccess = await canAccess("premium");
    return NextResponse.json(
      { eligible: !activeAccess },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { eligible: false },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
