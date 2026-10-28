import { identity, canAccess, serviceClient } from "../../../../lib/supabase";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { NextResponse } from "next/server";
import { recordGamificationEvent } from "../../../../lib/gamification";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const who = await identity();
  if (!who) return jsonError("Entre para acessar.", 401);
  const { id } = await params;
  const { data: m } = await who.db
    .from("materials")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (!m || !(await canAccess(m.plan)))
    return jsonError("Material não disponível para esta conta.", 403);
  if (!m.storage_path) return jsonError("Arquivo ainda não publicado.", 404);
  const download = new URL(req.url).searchParams.get("download") === "1";
  if (download)
    return jsonError("O material é disponibilizado exclusivamente no leitor da plataforma.", 403);
  const { data, error } = await serviceClient()
    .storage.from("materials")
    .createSignedUrl(m.storage_path, 60, {
      download: download ? `${m.id}.pdf` : false,
    });
  if (error || !data)
    return jsonError("Não foi possível abrir o arquivo. Tente novamente.", 503);
  return NextResponse.json(
    { url: data.signedUrl },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (!who) return jsonError("Não autorizado", 401);
  const { id } = await params;
  const { data: m } = await who.db
    .from("materials")
    .select("pages,plan")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (!m || !(await canAccess(m.plan))) return jsonError("Não autorizado", 403);
  const { page } = await req.json().catch(() => ({}));
  if (!Number.isInteger(page) || page < 1 || page > m.pages)
    return jsonError("Página inválida");
  const { error } = await who.db
    .from("reading_progress")
    .upsert({
      user_id: who.user.id,
      material_id: id,
      page,
      updated_at: new Date().toISOString(),
    });
  if (!error && page === m.pages) await recordGamificationEvent(who.user.id, "reading_completed", id);
  return error
    ? jsonError("Não foi possível salvar.", 503)
    : NextResponse.json({ saved: true });
}
