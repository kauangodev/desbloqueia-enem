import { NextResponse } from "next/server";
import { z } from "zod";
import { identity, serviceClient } from "../../../lib/supabase";
import { jsonError, sameOrigin } from "../../../lib/http";

const createSchema = z.object({ subject: z.string().trim().min(3).max(140), message: z.string().trim().min(10).max(4000) });
const updateSchema = z.object({ id: z.uuid(), status: z.enum(["open", "in_progress", "resolved"]), adminNote: z.string().max(4000).default("") });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (!who) return jsonError("Faça login para abrir um chamado.", 401);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Informe um assunto e uma descrição válidos.", 422);
  const { error } = await who.db.from("support_tickets").insert({ user_id: who.user.id, email: who.user.email || "", ...parsed.data });
  if (error) return jsonError("Não foi possível registrar o chamado.", 503);
  return NextResponse.json({ saved: true });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (who?.profile?.role !== "admin") return jsonError("Acesso administrativo necessário", 403);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados do chamado inválidos.", 422);
  const db = serviceClient();
  const { error } = await db.from("support_tickets").update({ status: parsed.data.status, admin_note: parsed.data.adminNote, updated_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (error) return jsonError("Não foi possível atualizar o chamado.", 503);
  await db.from("audit_logs").insert({ actor: who.user.id, action: "ticket_update", target: parsed.data.id });
  return NextResponse.json({ saved: true });
}

