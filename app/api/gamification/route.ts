import { identity } from "../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../lib/http";
import { gamificationSummary, recordGamificationEvent, type GamificationEventType } from "../../../lib/gamification";
import { mysqlPool } from "../../../lib/mysql";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";

const eventSchema = z.object({
  type: z.enum(["assessment_completed", "reading_completed", "study_task_completed"]),
  sourceId: z.string().trim().min(1).max(191),
});

export async function GET() {
  const who = await identity();
  if (!who) return jsonError("Sessão expirada.", 401);
  const summary = await gamificationSummary(who.user.id);
  return NextResponse.json(summary, { status: summary.available ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (!who) return jsonError("Sessão expirada.", 401);
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Evento de estudo inválido.");
  const { type, sourceId } = parsed.data;
  try {
    const pool = mysqlPool();
    const checks: Record<string, string> = {
      assessment_completed: "select id from assessment_attempts where id = ? and user_id = ? limit 1",
      reading_completed: "select material_id as id from reading_progress where material_id = ? and user_id = ? limit 1",
      study_task_completed: "select id from study_progress where id = ? and user_id = ? and done = true limit 1",
    };
    const [rows] = await pool.query<Array<RowDataPacket & { id: string }>>(checks[type], [sourceId, who.user.id]);
    if (!rows[0]) return jsonError("A atividade ainda não pode gerar progresso.", 409);
    const reward = await recordGamificationEvent(who.user.id, type as GamificationEventType, sourceId);
    if (reward === "ineligible") return jsonError("Conclua a atividade antes de receber progresso.", 409);
    if (reward === "unavailable") return jsonError("Gamificação indisponível. Seu estudo continua salvo.", 503);
    return NextResponse.json(await gamificationSummary(who.user.id));
  } catch {
    return jsonError("Gamificação indisponível no momento.", 503);
  }
}

