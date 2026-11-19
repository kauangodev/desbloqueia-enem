"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../../app/onboarding.css";
import { CUSTOM_MAX, CUSTOM_MIN, FUTURE_EXAMS, ROUTINES, SCORE_MAX, type OnboardingState, type RoutineId } from "../../lib/onboarding/model";

type Step = 1 | 2 | 3;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/**
 * Onboarding de 3 etapas em <dialog> modal nativo: foco preso no diálogo, fundo inerte e Escape tratados pelo navegador.
 * A etapa 1 (nascimento) é obrigatória e oferece "Sair da conta"; as etapas 2 e 3 podem ser puladas. Cada etapa é salva no servidor.
 */
export default function OnboardingGate({ initial, freeLimit, open = true }: { initial: OnboardingState; freeLimit: number | null; open?: boolean }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(initial.step);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birth, setBirth] = useState(initial.birthDate ?? "");
  const [current, setCurrent] = useState(initial.scoreCurrent === null ? "" : String(initial.scoreCurrent));
  const [unknown, setUnknown] = useState(initial.scoreUnknown);
  const [target, setTarget] = useState(initial.scoreTarget === null ? "" : String(initial.scoreTarget));
  const [exams, setExams] = useState<string[]>(initial.futureExams);
  const [routine, setRoutine] = useState<RoutineId>(initial.routine ?? "regular");
  const [custom, setCustom] = useState(String(initial.dailyQuestions ?? 8));
  const headingId = useId();
  const errorId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { const d = dialog.current; if (d && open && !d.open) d.showModal(); }, [open]);
  // "Rever metas e ritmo" (Minha conta) reabre o modal na etapa 2, sem pedir de novo a data de nascimento.
  useEffect(() => {
    const reopen = () => { setError(null); setStep(2); const d = dialog.current; if (d && !d.open) d.showModal(); };
    window.addEventListener("godev-onboarding-open", reopen);
    return () => window.removeEventListener("godev-onboarding-open", reopen);
  }, []);
  // A cada etapa o foco vai ao título, para quem usa leitor de tela ou teclado não perder o lugar.
  useEffect(() => { heading.current?.focus(); }, [step]);

  async function save(payload: Record<string, unknown>, next: Step | "done") {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(typeof data.error === "string" ? data.error : "Não foi possível salvar agora."); return; }
      if (next === "done") { dialog.current?.close(); router.refresh(); } else setStep(next);
    } catch { setError("Sem conexão. Suas respostas continuam na tela; tente salvar de novo."); }
    finally { setBusy(false); }
  }

  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const customNumber = Number(custom);
  const overFree = freeLimit !== null && (routine === "personalizado" ? customNumber : ROUTINES[routine as keyof typeof ROUTINES]?.questions ?? 0) > freeLimit;

  return (
    <dialog ref={dialog} className="ob" aria-labelledby={headingId} aria-describedby={error ? errorId : undefined}
      onCancel={(event) => { if (step === 1) event.preventDefault(); /* a etapa 1 é obrigatória: sai-se pela conta */ }}>
      <div className="ob-card">
        <div className="ob-bars" aria-hidden="true">{[1, 2, 3].map((n) => <i key={n} className={n <= step ? "is-on" : ""} />)}</div>
        <p className="ob-step">Etapa {step} de 3</p>

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); void save({ step: 1, birthDate: birth }, 2); }} noValidate>
            <h2 id={headingId} tabIndex={-1} ref={heading}>Vamos preparar sua experiência</h2>
            <p className="ob-lead">Pedimos a data de nascimento para adequar a experiência e cumprir as regras de proteção de dados de crianças e adolescentes. Você pode corrigir esse dado depois pelo atendimento.</p>
            <label className="ob-field">Data de nascimento
              <input type="date" name="birthDate" value={birth} max={today()} min="1925-01-01" required autoComplete="bday" onChange={(e) => setBirth(e.target.value)} aria-invalid={error ? true : undefined} />
            </label>
            {error ? <p id={errorId} role="alert" className="ob-error">{error}</p> : null}
            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => { void fetch("/api/auth/logout", { method: "POST" }).finally(() => { router.push("/entrar"); router.refresh(); }); }}>Sair da conta</button>
              <button type="submit" className="ob-btn" disabled={busy || !birth}>{busy ? "Salvando…" : "Salvar e continuar"}</button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <form onSubmit={(e) => { e.preventDefault(); void save({ step: 2, scoreCurrent: unknown ? null : num(current), scoreUnknown: unknown, scoreTarget: num(target), futureExams: exams }, 3); }} noValidate>
            <h2 id={headingId} tabIndex={-1} ref={heading}>Qual é o seu objetivo?</h2>
            <p className="ob-lead">Foco: <b>ENEM 2027</b>. As notas são opcionais e informadas por você; não são uma previsão da plataforma.</p>
            <div className="ob-row">
              <label className="ob-field">Nota atual (0 a {SCORE_MAX})
                <input type="number" inputMode="numeric" min={0} max={SCORE_MAX} step={1} value={unknown ? "" : current} disabled={unknown} placeholder="Ex.: 620" onChange={(e) => setCurrent(e.target.value)} />
              </label>
              <label className="ob-field">Minha meta (0 a {SCORE_MAX})
                <input type="number" inputMode="numeric" min={0} max={SCORE_MAX} step={1} value={target} placeholder="Ex.: 750" onChange={(e) => setTarget(e.target.value)} />
              </label>
            </div>
            <label className="ob-check"><input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} /> Ainda não sei minha nota</label>
            <fieldset className="ob-exams">
              <legend>Também tenho interesse em <small>(ainda sem conteúdo próprio na GoDev; só registramos o interesse)</small></legend>
              <div className="ob-chips">{FUTURE_EXAMS.map((name) => (
                <label key={name} className={exams.includes(name) ? "is-on" : ""}><input type="checkbox" checked={exams.includes(name)} onChange={() => setExams((list) => (list.includes(name) ? list.filter((x) => x !== name) : [...list, name]))} /><span>{name}</span></label>
              ))}</div>
            </fieldset>
            {error ? <p id={errorId} role="alert" className="ob-error">{error}</p> : null}
            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => setStep(1)} disabled={busy}>Voltar</button>
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => void save({ step: 2, skip: true }, 3)} disabled={busy}>Pular por enquanto</button>
              <button type="submit" className="ob-btn" disabled={busy}>{busy ? "Salvando…" : "Salvar e continuar"}</button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form onSubmit={(e) => { e.preventDefault(); void save({ step: 3, routine, ...(routine === "personalizado" ? { custom: customNumber } : {}) }, "done"); }} noValidate>
            <h2 id={headingId} tabIndex={-1} ref={heading}>Qual ritmo combina com você?</h2>
            <p className="ob-lead">É só uma meta para organizar seu dia. Você pode mudar quando quiser.</p>
            <fieldset className="ob-routines">
              <legend className="sr-only">Ritmo diário</legend>
              {(Object.entries(ROUTINES) as [keyof typeof ROUTINES, (typeof ROUTINES)[keyof typeof ROUTINES]][]).map(([id, r]) => (
                <label key={id} className={routine === id ? "is-on" : ""}><input type="radio" name="routine" checked={routine === id} onChange={() => setRoutine(id)} /><b>{r.label}</b><span>~{r.questions} questões por dia</span><small>{r.text}</small></label>
              ))}
              <label className={routine === "personalizado" ? "is-on" : ""}><input type="radio" name="routine" checked={routine === "personalizado"} onChange={() => setRoutine("personalizado")} /><b>Personalizado</b><span>Você escolhe</span>
                {routine === "personalizado" ? <input className="ob-custom" type="number" inputMode="numeric" min={CUSTOM_MIN} max={CUSTOM_MAX} value={custom} aria-label={`Questões por dia, de ${CUSTOM_MIN} a ${CUSTOM_MAX}`} onChange={(e) => setCustom(e.target.value)} /> : <small>De {CUSTOM_MIN} a {CUSTOM_MAX} questões</small>}
              </label>
            </fieldset>
            {overFree ? <p className="ob-note" role="status">No plano Grátis o limite é de {freeLimit} questões por dia. Sua meta fica guardada e você estuda até esse limite.</p> : null}
            {error ? <p id={errorId} role="alert" className="ob-error">{error}</p> : null}
            <div className="ob-actions">
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => setStep(2)} disabled={busy}>Voltar</button>
              <button type="button" className="ob-btn ob-btn-ghost" onClick={() => void save({ step: 3, skip: true }, "done")} disabled={busy}>Pular</button>
              <button type="submit" className="ob-btn" disabled={busy}>{busy ? "Salvando…" : "Começar a estudar"}</button>
            </div>
          </form>
        ) : null}
      </div>
    </dialog>
  );
}
