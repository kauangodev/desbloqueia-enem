import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccess } from "../../../lib/supabase";
import { jsonError, sameOrigin } from "../../../lib/http";

const schema = z.object({ title: z.string().trim().min(1).max(120), prompt: z.string().trim().min(10).max(500), essay: z.string().trim().min(100).max(12000) });
const feedbackSchema = z.object({ score: z.number().int().min(0).max(1000), summary: z.string().min(1).max(1200), strengths: z.array(z.string().min(1).max(300)).min(1).max(5), improvements: z.array(z.string().min(1).max(300)).min(1).max(5), action_plan: z.array(z.string().min(1).max(300)).min(1).max(5), competencies: z.array(z.object({ name: z.string().min(1).max(80), score: z.number().int().min(0).max(200), rationale: z.string().min(1).max(500) })).length(5) });

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
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5-mini", store: false, instructions: "Você é um avaliador pedagógico no estilo ENEM. Faça uma análise orientativa, nunca prometa nota oficial ou 100% de precisão. Avalie as cinco competências: Competência 1 norma-padrão; Competência 2 compreensão do tema e repertório; Competência 3 seleção e organização de argumentos; Competência 4 coesão; Competência 5 proposta de intervenção com agente, ação, meio, efeito e detalhamento. Responda SOMENTE JSON válido com score (soma estimada de 0 a 1000), summary, strengths (array), improvements (array), action_plan (array) e competencies (array de exatamente 5 objetos com name, score de 0 a 200 e rationale). Seja específico, cite trechos curtos da redação quando útil e não invente referências.", input: "Tema: " + parsed.data.prompt + "\n\nRedação:\n" + parsed.data.essay, max_output_tokens: 2600 }) });
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
