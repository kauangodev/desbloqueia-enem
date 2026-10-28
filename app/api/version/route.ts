import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await readFile(path.join(process.cwd(), "public", "__build-info.json"), "utf8");
    const info = JSON.parse(content) as { revision?: string; builtAt?: string; source?: string };
    return NextResponse.json(info, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ revision: "unavailable", source: "build-artifact-missing" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
