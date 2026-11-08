import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "../../../lib/http";
import { grade, questionById, toPublic } from "../../../lib/operacao/catalog";
import { limitFor, remainingMs, selectQuestions, summarize, type Attempt, type Session, type SessionKind } from "../../../lib/operacao/engine";
import { operacaoUser, type OperacaoUser } from "../../../lib/operacao/store";

export const dynamic = "force-dynamic";

const kinds = ["diagnostico", "treino-1", "treino-2", "treino-3", "simulado"] as const;
const modes = ["prova", "pratica", "cronometrado", "livre"] as const;
const choice = z.enum(["A", "B", "C", "D", "E"]);

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("answer"), questionId: z.string().min(3).max(64), selected: choice, context: z.enum(["estudo", "erros"]).default("estudo") }),
  z.object({ action: z.literal("toggle"), kind: z.enum(["fav", "later", "formula"]), ref: z.string().min(2).max(64) }),
  z.object({ action: z.literal("read"), moduleId: z.string().min(2).max(64), concluded: z.boolean() }),
  z.object({ action: z.literal("plan"), minutes: z.union([z.literal(30), z.literal(60), z.literal(120)]) }),
  z.object({ action: z.literal("planDone"), taskId: z.string().min(3).max(96), done: z.boolean() }),
  z.object({ action: z.literal("review"), questionId: z.string().min(3).max(64), reviewed: z.boolean() }),
  z.object({ action: z.literal("sessionStart"), kind: z.enum(kinds), mode: z.enum(modes), restart: z.boolean().optional() }),
  z.object({ action: z.literal("sessionSave"), sessionId: z.string().min(3).max(96), answers: z.record(z.string(), choice), flags: z.record(z.string(), z.boolean()) }),
  z.object({ action: z.literal("sessionFinish"), sessionId: z.string().min(3).max(96) }),
]);

async function attemptsMap(user: OperacaoUser) {
  const rows = await user.kv.list<Attempt>("attempt");
  return Object.fromEntries(rows.map((row) => { const last = row.data.history[row.data.history.length - 1]; return [row.ref, { n: row.data.history.length, last: last?.ok ?? null, firstTry: row.data.firstTryCorrect, everWrong: row.data.history.some((h) => !h.ok), at: last?.at }]; }));
}

async function recordAttempt(user: OperacaoUser, questionId: string, selected: string, ok: boolean, mode: string) {
  const current = (await user.kv.get<Attempt>("attempt", questionId)) || { history: [], firstTryCorrect: null };
  const afterResolution = current.history.length > 0; // a resolução já foi exibida na tentativa anterior
  current.history.push({ sel: selected, ok, at: new Date().toISOString(), mode, afterResolution });
  if (current.history.length === 1) current.firstTryCorrect = ok;
  if (current.history.length > 40) current.history = current.history.slice(-40);
  await user.kv.set("attempt", questionId, current);
  return current;
}

function sessionPayload(session: Session) {
  const now = Date.now();
  return {
    session: { id: session.id, kind: session.kind, mode: session.mode, startedAt: session.startedAt, limitMs: session.limitMs, answers: session.answers, flags: session.flags, finished: Boolean(session.finishedAt), expired: Boolean(session.expired) },
    questions: session.questionIds.map((id) => questionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)).map(toPublic),
    remainingMs: remainingMs(session, now),
    serverNow: new Date(now).toISOString(),
  };
}

async function finishSession(user: OperacaoUser, session: Session) {
  if (!session.finishedAt) {
    session.finishedAt = new Date().toISOString();
    session.expired = session.limitMs !== null && Date.parse(session.finishedAt) - Date.parse(session.startedAt) > session.limitMs;
    session.result = summarize(session);
    for (const id of session.questionIds) {
      const q = questionById(id); const sel = session.answers[id];
      if (q && sel) await recordAttempt(user, id, sel, sel === q.answer, session.kind);
    }
    await user.kv.set("session", session.id, session);
    const active = await user.kv.get<{ id: string }>("active", session.kind);
    if (active?.id === session.id) await user.kv.remove("active", session.kind);
  }
  const corrections = session.questionIds.map((id) => questionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)).map((q) => grade(q, session.answers[q.id] || null));
  return { result: session.result, expired: Boolean(session.expired), corrections };
}

export async function GET() {
  const user = await operacaoUser();
  if (!user) return jsonError("Acesso não autorizado", 403);
  try {
    const [attempts, favs, later, reads, plan, planDone, saved, reviews, finished, active] = await Promise.all([
      attemptsMap(user), user.kv.list("fav"), user.kv.list("later"), user.kv.list<{ concluded: boolean }>("read"), user.kv.get<{ minutes: number }>("plan", "config"),
      user.kv.list("plandone"), user.kv.list("formula"), user.kv.list<{ reviewed: boolean }>("review"), user.kv.list<Session>("session"), user.kv.list<{ id: string }>("active"),
    ]);
    return NextResponse.json({
      attempts, fav: favs.map((r) => r.ref), later: later.map((r) => r.ref), formulas: saved.map((r) => r.ref),
      reads: Object.fromEntries(reads.map((r) => [r.ref, Boolean(r.data.concluded)])), planMinutes: plan?.minutes ?? null, planDone: planDone.map((r) => r.ref),
      reviewed: Object.fromEntries(reviews.map((r) => [r.ref, Boolean(r.data.reviewed)])),
      active: Object.fromEntries(active.map((r) => [r.ref, r.data.id])),
      finished: finished.filter((r) => r.data.finishedAt).sort((a, b) => Date.parse(b.data.finishedAt!) - Date.parse(a.data.finishedAt!)).slice(0, 12).map((r) => ({ id: r.ref, kind: r.data.kind, mode: r.data.mode, finishedAt: r.data.finishedAt, expired: r.data.expired, result: r.data.result })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Não foi possível carregar seu progresso agora. Tente novamente.", 503);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const user = await operacaoUser();
  if (!user) return jsonError("Acesso não autorizado", 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Solicitação inválida");
  const input = parsed.data;
  try {
    switch (input.action) {
      case "answer": {
        const q = questionById(input.questionId);
        if (!q) return jsonError("Questão não encontrada", 404);
        const correction = grade(q, input.selected);
        const attempt = await recordAttempt(user, q.id, input.selected, correction.correct, input.context);
        return NextResponse.json({ correction, firstTry: attempt.history.length === 1, afterResolution: attempt.history.length > 1 });
      }
      case "toggle": {
        const existing = await user.kv.get("" + input.kind, input.ref);
        if (existing) await user.kv.remove(input.kind, input.ref); else await user.kv.set(input.kind, input.ref, { at: new Date().toISOString() });
        return NextResponse.json({ on: !existing });
      }
      case "read": {
        await user.kv.set("read", input.moduleId, { concluded: input.concluded, at: new Date().toISOString() });
        return NextResponse.json({ ok: true });
      }
      case "plan": {
        await user.kv.set("plan", "config", { minutes: input.minutes, at: new Date().toISOString() });
        return NextResponse.json({ ok: true });
      }
      case "planDone": {
        if (input.done) await user.kv.set("plandone", input.taskId, { at: new Date().toISOString() }); else await user.kv.remove("plandone", input.taskId);
        return NextResponse.json({ ok: true });
      }
      case "review": {
        await user.kv.set("review", input.questionId, { reviewed: input.reviewed, at: new Date().toISOString() });
        return NextResponse.json({ ok: true });
      }
      case "sessionStart": {
        const activeRef = await user.kv.get<{ id: string }>("active", input.kind);
        if (activeRef && !input.restart) {
          const existing = await user.kv.get<Session>("session", activeRef.id);
          if (existing && !existing.finishedAt) return NextResponse.json({ ...sessionPayload(existing), resumed: true });
        }
        const seenRows = await user.kv.list("attempt");
        const pick = selectQuestions(input.kind as SessionKind, new Set(seenRows.map((r) => r.ref)));
        if (!pick.ids.length) return jsonError("Ainda não há questões publicadas suficientes para esta atividade.", 409);
        const now = new Date();
        const session: Session = { id: `${input.kind}-${now.getTime()}`, kind: input.kind, mode: input.mode, questionIds: pick.ids, answers: {}, flags: {}, startedAt: now.toISOString(), limitMs: limitFor(input.kind, input.mode, pick.ids.length) };
        await user.kv.set("session", session.id, session);
        await user.kv.set("active", input.kind, { id: session.id });
        return NextResponse.json({ ...sessionPayload(session), resumed: false, shortfall: pick.shortfall, seenCount: pick.ids.filter((id) => seenRows.some((r) => r.ref === id)).length });
      }
      case "sessionSave": {
        const session = await user.kv.get<Session>("session", input.sessionId);
        if (!session) return jsonError("Sessão não encontrada", 404);
        if (session.finishedAt) return NextResponse.json({ finished: true });
        const left = remainingMs(session);
        if (left !== null && left <= 0) { session.expired = true; await user.kv.set("session", session.id, session); return NextResponse.json({ expired: true, remainingMs: 0 }); }
        const valid = new Set(session.questionIds);
        session.answers = Object.fromEntries(Object.entries(input.answers).filter(([id]) => valid.has(id)));
        session.flags = Object.fromEntries(Object.entries(input.flags).filter(([id, v]) => valid.has(id) && v));
        await user.kv.set("session", session.id, session);
        return NextResponse.json({ saved: true, remainingMs: left, savedAt: new Date().toISOString() });
      }
      case "sessionFinish": {
        const session = await user.kv.get<Session>("session", input.sessionId);
        if (!session) return jsonError("Sessão não encontrada", 404);
        return NextResponse.json(await finishSession(user, session));
      }
    }
  } catch {
    return jsonError("Não foi possível salvar. Tente novamente.", 503);
  }
}
