import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "../../../lib/http";
import { features } from "../../../lib/features";
import { operacaoUser } from "../../../lib/operacao/store";
import { todayInSaoPaulo } from "../../../lib/operacao/config";
import { serviceClient } from "../../../lib/supabase";
import { loadOnboarding, saveOnboardingStep } from "../../../lib/onboarding/store";

export const dynamic = "force-dynamic";

const body = z.discriminatedUnion("step", [
  z.object({ step: z.literal(1), birthDate: z.string().max(10) }),
  z.object({ step: z.literal(2), skip: z.boolean().optional(), scoreCurrent: z.number().nullable().optional(), scoreUnknown: z.boolean().optional(), scoreTarget: z.number().nullable().optional(), futureExams: z.array(z.string().max(20)).max(10).optional() }),
  z.object({ step: z.literal(3), skip: z.boolean().optional(), routine: z.string().max(20).optional(), custom: z.number().optional() }),
]);

const headers = { "Cache-Control": "no-store" };

/** Estado do onboarding do aluno logado (a data de nascimento só volta para o próprio dono). */
export async function GET() {
  if (!features.onboarding) return jsonError("Indisponível", 404);
  const user = await operacaoUser();
  if (!user) return jsonError("Entre na sua conta para continuar.", 401);
  try { return NextResponse.json(await loadOnboarding(user.kv), { headers }); }
  catch { return jsonError("Não foi possível carregar agora.", 503); }
}

/** Salva UMA etapa. Validação 100% no servidor; o cliente não define dono, versão nem conclusão. */
export async function POST(req: Request) {
  if (!features.onboarding) return jsonError("Indisponível", 404);
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  if (Number(req.headers.get("content-length") || 0) > 2048) return jsonError("Solicitação muito grande", 413);
  const user = await operacaoUser();
  if (!user) return jsonError("Entre na sua conta para continuar.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados inválidos");
  try {
    if (user.id !== "dev-user") {
      const { data: allowed } = await serviceClient().rpc("take_rate_limit", { p_key: `onboarding:${user.id}`, p_limit: 60, p_seconds: 3600 });
      if (!allowed) return jsonError("Muitas tentativas. Aguarde um pouco.", 429);
    }
    const result = await saveOnboardingStep(user.kv, parsed.data, todayInSaoPaulo());
    if (!result.ok) return jsonError(result.error, 422);
    return NextResponse.json(result.state, { headers });
  } catch {
    return jsonError("Não foi possível salvar agora. Suas respostas anteriores foram mantidas.", 503);
  }
}
