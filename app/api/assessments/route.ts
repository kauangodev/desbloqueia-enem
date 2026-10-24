import { canAccess } from "../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
const inputSchema = z.object({ activity: z.enum(["exercicios", "simulado-1", "simulado-2"]), score: z.number().int().min(0), total: z.number().int().positive(), answers: z.record(z.string(), z.string()).default({}) });
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await canAccess("essencial");
  if (!who) return jsonError("Acesso não autorizado", 403);
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.score > parsed.data.total) return jsonError("Resultado inválido");
  const { error } = await who.db.from("assessment_attempts").insert({ ...parsed.data, user_id: who.user.id });
  if (error) return NextResponse.json({ saved: false, message: "Resultado calculado nesta sessão." });
  return NextResponse.json({ saved: true });
}
