import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccess } from "../../../lib/supabase";
import { jsonError, sameOrigin } from "../../../lib/http";

const schema = z.object({ title: z.string().trim().min(1).max(120), prompt: z.string().trim().min(10).max(500), essay: z.string().trim().min(100).max(12000) });
const feedbackSchema = z.object({ score: z.number().int().min(0).max(1000), summary: z.string().min(1).max(1200), strengths: z.array(z.string().min(1).max(300)).min(1).max(5), improvements: z.array(z.string().min(1).max(300)).min(1).max(5), action_plan: z.array(z.string().min(1).max(300)).min(1).max(5) });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem inválida", 403);
  const who = await canAccess("essencial");
  if (!who) return jsonError("Acesso não autorizado", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Envie um texto com pelo menos 100 palavras.", 422);
  if (!process.env.OPENAI_API_KEY) return jsonError("A correção automática ainda não foi ativada pelo administrador.", 503);
  const { data: submission, error: insertError } = await who.db.from("essay_submissions").insert({ user_id: who.user.id, ...parsed.data }).select("id").single();
  if (insertError || !submission) return jsonError("Não foi possível salvar sua redação.", 503);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5-mini", instructions: "Você é um avaliador pedagógico de redações no estilo ENEM. Não invente fatos, não substitua um professor e responda SOMENTE com JSON válido nos campos score (0 a 1000), summary, strengths (array), improvements (array) e action_plan (array). Avalie tema, tese, argumentação, coesão, norma-padrão e proposta de intervenção. Seja específico e construtivo.", input: "Tema: " + parsed.data.prompt + "\n\nRedação:\n" + parsed.data.essay, max_output_tokens: 1800 }) });
    if (!response.ok) throw new Error("provider_error");
    const payload = await response.json() as { output_text?: string };
    const feedback = feedbackSchema.parse(JSON.parse(payload.output_text || ""));
    await who.db.from("essay_submissions").update({ status: "completed", score: feedback.score, feedback }).eq("id", submission.id).eq("user_id", who.user.id);
    return NextResponse.json({ feedback });
  } catch {
    await who.db.from("essay_submissions").update({ status: "failed" }).eq("id", submission.id).eq("user_id", who.user.id);
    return jsonError("A correção não ficou disponível agora. Sua redação foi salva para tentar novamente.", 503);
  }
}
