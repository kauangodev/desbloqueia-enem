import { NextResponse } from "next/server";
import { jsonError } from "../../../../lib/http";
import { questionById, toPublic } from "../../../../lib/operacao/catalog";
import { operacaoUser } from "../../../../lib/operacao/store";

export const dynamic = "force-dynamic";

/** Enunciados sob demanda (sem gabarito): a página de questões só carrega os metadados leves. Máx. 6 por chamada. */
export async function GET(req: Request) {
  const user = await operacaoUser();
  if (!user) return jsonError("Acesso não autorizado", 403);
  const ids = [...new Set((new URL(req.url).searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 6);
  const found = ids.map((id) => questionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)).map(toPublic);
  return NextResponse.json({ questions: found }, { headers: { "Cache-Control": "private, max-age=300" } });
}
