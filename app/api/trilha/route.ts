import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "../../../lib/http";
import { todayInSaoPaulo } from "../../../lib/operacao/config";
import { operacaoUser } from "../../../lib/operacao/store";
import { freeUnitDecision } from "../../../lib/planos/gate";
import { freeScope } from "../../../lib/planos/free";
import { noteStudy } from "../../../lib/funnel/first-study";
import { answerItem, finishStage, markFundamento, setCursor, setPrefs, startStage, TrilhaError } from "../../../lib/trilha/service";

export const dynamic = "force-dynamic";

const unit = z.string().min(3).max(80).regex(/^u-[a-z0-9-]+$/);
const stage = z.enum(["pratica", "desafio", "teste", "revisao"]);
const session = z.string().min(3).max(160);

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("prefs"), serie: z.enum(["", "1", "2", "3", "concluido"]).optional(), modo: z.enum(["aprender", "treinar"]).optional() }),
  z.object({ action: z.literal("fundamento"), unitId: unit }),
  z.object({ action: z.literal("start"), unitId: unit, stage }),
  z.object({ action: z.literal("answer"), unitId: unit, stage, sessionId: session, questionId: z.string().min(3).max(64), selected: z.enum(["A", "B", "C", "D", "E"]) }),
  z.object({ action: z.literal("cursor"), unitId: unit, stage, sessionId: session, cursor: z.number().int().min(0).max(50) }),
  z.object({ action: z.literal("finish"), unitId: unit, stage, sessionId: session }),
]);

/**
 * Trilha ENEM — mutações. Autenticação e plano vêm de `operacaoUser()` (Essencial, Premium ou administrador); unidade, etapa,
 * pré-requisito, itens e gabarito são validados no servidor (lib/trilha/service.ts). Respostas nunca são cacheadas.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const user = await operacaoUser();
  if (!user) return jsonError("Acesso não autorizado", 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Solicitação inválida");
  const input = parsed.data;
  const today = todayInSaoPaulo();
  if (user.tier === "gratis" && input.action !== "prefs") {
    const decision = freeUnitDecision(freeScope(), input.unitId);
    if (!decision.allowed) return jsonError(decision.message, 403);
  }
  try {
    switch (input.action) {
      case "prefs": return NextResponse.json({ prefs: await setPrefs(user.kv, input) }, { headers: { "Cache-Control": "no-store" } });
      case "fundamento": return NextResponse.json({ state: await markFundamento(user.kv, input.unitId, today) }, { headers: { "Cache-Control": "no-store" } });
      case "start": return NextResponse.json(await startStage(user.kv, input.unitId, input.stage, today), { headers: { "Cache-Control": "no-store" } });
      case "answer": { const result = await answerItem(user.kv, input); noteStudy(user.id); return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } }); }
      case "cursor": return NextResponse.json(await setCursor(user.kv, input), { headers: { "Cache-Control": "no-store" } });
      case "finish": return NextResponse.json(await finishStage(user.kv, input, today), { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) {
    if (error instanceof TrilhaError) return jsonError(error.message, error.status);
    return jsonError("Não foi possível salvar agora. Tente novamente.", 503);
  }
}
