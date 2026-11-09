import { NextResponse } from "next/server";
import { z } from "zod";
import { campaign } from "../../../../lib/campaign";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { grade, questionById } from "../../../../lib/operacao/catalog";

export const dynamic = "force-dynamic";

const body = z.object({ selected: z.enum(["A", "B", "C", "D", "E"]) });

/**
 * Prévia pública da reta final: corrige UMA questão fixa (campaign.previewQuestionId), sem cadastro.
 * Não expõe o banco: nenhum outro id é aceito e o gabarito só sai depois da tentativa.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Escolha uma alternativa.");
  const question = questionById(campaign.previewQuestionId);
  if (!question) return jsonError("Prévia indisponível no momento.", 503);
  const correction = grade(question, parsed.data.selected);
  return NextResponse.json(
    { correct: correction.correct, answer: correction.answer, resolutionHtml: correction.resolutionHtml, distractorHtml: correction.distractorHtml },
    { headers: { "Cache-Control": "no-store" } },
  );
}
