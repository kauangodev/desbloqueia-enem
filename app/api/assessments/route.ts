import { canAccess } from "../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
import { questionsFor } from "../../../data/question-bank";
const inputSchema = z.object({
  activity: z.enum(["exercicios", "simulado-1", "simulado-2"]),
  answers: z.record(z.string(), z.string()).default({}),
});
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await canAccess("essencial");
  if (!who) return jsonError("Acesso não autorizado", 403);
  const parsed = inputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Resultado inválido");
  const questions = questionsFor(parsed.data.activity);
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, parsed.data.answers[question.id] || ""]),
  );
  const score = questions.reduce(
    (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
    0,
  );
  const { error } = await who.db.from("assessment_attempts").insert({
    activity: parsed.data.activity,
    score,
    total: questions.length,
    answers,
    user_id: who.user.id,
  });
  if (error) return NextResponse.json({ saved: false, score, total: questions.length, message: "Resultado calculado nesta sessão, mas não foi salvo no histórico." });
  return NextResponse.json({ saved: true, score, total: questions.length });
}
