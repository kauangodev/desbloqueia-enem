import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccess, serviceClient } from "../../../lib/supabase";
import { jsonError, sameOrigin } from "../../../lib/http";

const metadataSchema = z.object({ title: z.string().trim().min(1).max(120), prompt: z.string().trim().min(10).max(500) });
const feedbackSchema = z.object({ score: z.number().int().min(0).max(1000), summary: z.string().min(1).max(1200), strengths: z.array(z.string().min(1).max(300)).min(1).max(5), improvements: z.array(z.string().min(1).max(300)).min(1).max(5), action_plan: z.array(z.string().min(1).max(300)).min(1).max(5), competencies: z.array(z.object({ name: z.string().min(1).max(80), score: z.number().int().min(0).max(200), rationale: z.string().min(1).max(500) })).length(5) });
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem inválida", 403);
  const who = await canAccess("essencial");
  if (!who) return jsonError("Acesso não autorizado", 403);
  if (!process.env.OPENAI_API_KEY) return jsonError("A correção automática ainda não foi ativada pelo administrador.", 503);
  const form = await request.formData().catch(() => null);
  const metadata = metadataSchema.safeParse({ title: form?.get("title"), prompt: form?.get("prompt") });
  const file = form?.get("image");
  if (!metadata.success || !(file instanceof File) || !allowedImageTypes.has(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) return jsonError("Envie uma foto JPG, PNG ou WEBP de até 8 MB.", 422);
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const storage = serviceClient();
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const imagePath = `${who.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await storage.storage.from("essays").upload(imagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return jsonError("Não foi possível guardar a foto da redação.", 503);
  const { data: submission, error: insertError } = await who.db.from("essay_submissions").insert({ user_id: who.user.id, title: metadata.data.title, prompt: metadata.data.prompt, essay: "[Foto enviada para correção]", image_path: imagePath, image_mime: file.type }).select("id").single();
  if (insertError || !submission) return jsonError("Não foi possível salvar sua redação.", 503);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5-mini", store: false, instructions: "Você é um avaliador pedagógico no estilo ENEM. A imagem contém uma redação manuscrita em português. Primeiro interprete cuidadosamente o texto visível; se algum trecho estiver ilegível, sinalize a limitação em vez de inventar. Avalie as cinco competências: Competência 1 norma-padrão; Competência 2 compreensão do tema e repertório; Competência 3 seleção e organização de argumentos; Competência 4 coesão; Competência 5 proposta de intervenção com agente, ação, meio, efeito e detalhamento. Nunca prometa nota oficial ou precisão absoluta. Responda SOMENTE JSON válido com score (soma estimada de 0 a 1000), summary, strengths (array), improvements (array), action_plan (array) e competencies (array de exatamente 5 objetos com name, score de 0 a 200 e rationale). Seja específico e não invente referências.", input: [{ role: "user", content: [{ type: "input_text", text: `Tema: ${metadata.data.prompt}\n\nFaça a correção pedagógica da redação manuscrita nesta imagem.` }, { type: "input_image", image_url: dataUrl }]}], max_output_tokens: 2600 }) });
    if (!response.ok) throw new Error("provider_error");
    const payload = await response.json() as { output_text?: string };
    const feedback = feedbackSchema.parse(JSON.parse(payload.output_text || ""));
    await who.db.from("essay_submissions").update({ status: "completed", score: feedback.score, feedback }).eq("id", submission.id).eq("user_id", who.user.id);
    return NextResponse.json({ feedback });
  } catch {
    await who.db.from("essay_submissions").update({ status: "failed" }).eq("id", submission.id).eq("user_id", who.user.id);
    return jsonError("A correção não ficou disponível agora. A foto foi salva para tentar novamente.", 503);
  }
}

