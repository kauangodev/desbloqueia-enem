import { canAccess } from "../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
async function mutate(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await canAccess("essencial");
  if (!who) return jsonError("Acesso não autorizado", 403);
  const input = await req.json().catch(() => null);
  let error;
  if (req.method === "POST") {
    const parsed = z
      .object({ title: z.string().trim().min(1).max(180), date: z.iso.date() })
      .safeParse(input);
    if (!parsed.success) return jsonError("Revise o título e a data.");
    ({ error } = await who.db
      .from("study_progress")
      .insert({ ...parsed.data, user_id: who.user.id }));
  } else {
    const parsed = z
      .object({ id: z.uuid(), done: z.boolean().optional() })
      .safeParse(input);
    if (!parsed.success) return jsonError("Tarefa inválida");
    if (req.method === "DELETE")
      ({ error } = await who.db
        .from("study_progress")
        .delete()
        .eq("id", parsed.data.id)
        .eq("user_id", who.user.id));
    else if (typeof parsed.data.done === "boolean")
      ({ error } = await who.db
        .from("study_progress")
        .update({ done: parsed.data.done })
        .eq("id", parsed.data.id)
        .eq("user_id", who.user.id));
    else return jsonError("Estado inválido");
  }
  if (error) return jsonError("Não foi possível salvar. Tente novamente.", 503);
  const { data: tasks } = await who.db
    .from("study_progress")
    .select("*")
    .eq("user_id", who.user.id)
    .order("date");
  return NextResponse.json({ tasks: tasks || [] });
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
