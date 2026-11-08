import Link from "next/link";
import { Icon, type IconName } from "../../../components/icons";
import { modules, questions } from "../../../lib/operacao/catalog";
import { campaignStatus, operacao } from "../../../lib/operacao/config";
import { loadProgress } from "../../../lib/operacao/progress";
import { operacaoUser } from "../../../lib/operacao/store";
import { disciplineLabel } from "../../../lib/operacao/types";

const kindTitle: Record<string, string> = { diagnostico: "o diagnóstico", "treino-1": "o Treino 1", "treino-2": "o Treino 2", "treino-3": "o Treino 3", simulado: "o simulado" };
const sections: [string, string, string, IconName][] = [
  ["plano", "Minha revisão", "Plano dos dias que faltam, no seu tempo.", "calendar-days"],
  ["materiais", "Materiais", "Módulos objetivos de Matemática e Natureza.", "book-open"],
  ["questoes", "Questões", "Com resolução, filtros e histórico.", "clipboard-check"],
  ["treinos", "Treinos e simulado", "Diagnóstico, treinos de 20 questões e simulado.", "timer"],
  ["erros", "Meus erros", "Caderno que se monta sozinho.", "notebook-pen"],
  ["formulas", "Fórmulas e conceitos", "Cartões para salvar e revisar.", "sigma"],
];

export default async function OperacaoHome() {
  const user = await operacaoUser();
  if (!user) return null;
  const base = operacao.basePath;
  const status = campaignStatus();
  let progress: Awaited<ReturnType<typeof loadProgress>> | null = null;
  let failed = false;
  try { progress = await loadProgress(user); } catch { failed = true; }
  const active = progress?.activeSessions[0];
  const resume = active
    ? { label: `Retomar ${kindTitle[active.kind] || "a atividade"}`, detail: `${active.answered} de ${active.total} questões respondidas.`, href: `${base}/treinos` }
    : progress?.nextModule
      ? { label: `Continuar: ${progress.nextModule.title}`, detail: `${progress.nextModule.minutes} min · ${disciplineLabel[progress.nextModule.discipline]}`, href: `${base}/materiais/${progress.nextModule.id}` }
      : null;
  const checked = new Date(`${operacao.sourceCheckedAt}T12:00:00`).toLocaleDateString("pt-BR");

  return (
    <div className="op-stack">
      <section className="op-card op-hero" aria-labelledby="op-h">
        {status.phase === "antes" ? (
          <>
            <h2 id="op-h">Seu próximo domingo começa aqui.</h2>
            <p className="op-lead">Revise Matemática, Física, Química e Biologia com materiais objetivos, questões comentadas e um plano para os dias que faltam.</p>
            <p className="op-muted">{status.detail}</p>
          </>
        ) : (
          <>
            <h2 id="op-h">{status.headline}</h2>
            <p className="op-lead">{status.detail}</p>
          </>
        )}
        <p className="op-muted op-fine">Datas conforme o Inep (consultado em {checked}). Confirme horários e local no seu cartão de confirmação.</p>
        <div className="op-q-foot">
          <Link className="op-btn op-btn-primary" href={`${base}/materiais`} data-analytics-event="operacao_cta_start_review">Começar minha revisão</Link>
          <Link className="op-btn" href={`${base}/questoes`} data-analytics-event="operacao_cta_practice">Praticar questões</Link>
          <Link className="op-btn op-btn-ghost" href={`${base}/plano`} data-analytics-event="operacao_cta_plan">Ver plano da semana</Link>
        </div>
      </section>

      {failed ? <p className="op-error" role="alert">Não foi possível carregar seu progresso agora. O conteúdo continua disponível; tente recarregar a página.</p> : null}

      <section className="op-card" aria-labelledby="op-resume">
        <h3 id="op-resume">Continuar de onde parei</h3>
        {resume ? (
          <>
            <p><strong>{resume.label}</strong><br /><span className="op-muted">{resume.detail}</span></p>
            <Link className="op-btn op-btn-primary" href={resume.href}>Continuar</Link>
          </>
        ) : (
          <p className="op-muted">Você já passou por todos os módulos publicados. Pratique questões ou faça um treino.</p>
        )}
        {progress && !progress.hasAnyActivity ? <p className="op-muted">Você ainda não começou. Cada módulo leva de 15 a 30 minutos.</p> : null}
        {progress && progress.toReview > 0 ? <p className="op-note">Você tem {progress.toReview} questão(ões) para rever no <Link href={`${base}/erros`}>caderno de erros</Link>.</p> : null}
      </section>

      <section aria-labelledby="op-disc">
        <h3 id="op-disc" className="op-section-title">Seu progresso por disciplina</h3>
        <div className="op-grid op-grid-4">
          {(progress?.perDiscipline || []).map((d) => {
            const pct = d.questionsTotal ? Math.round((d.answered / d.questionsTotal) * 100) : 0;
            return (
              <Link key={d.discipline} href={`${base}/materiais?d=${d.discipline}`} className="op-card op-disc">
                <strong>{disciplineLabel[d.discipline]}</strong>
                <span className="op-muted">{d.modulesRead}/{d.modulesTotal} módulos lidos</span>
                <span className="op-muted">{d.answered}/{d.questionsTotal} questões feitas{d.answered ? ` · ${d.correct} certas na última tentativa` : ""}</span>
                <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Questões feitas em ${disciplineLabel[d.discipline]}`}><i style={{ width: `${pct}%` }} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="op-nav">
        <h3 id="op-nav" className="op-section-title">Tudo da operação</h3>
        <div className="op-grid op-grid-3">
          {sections.map(([slug, title, text, icon]) => (
            <Link key={slug} href={`${base}/${slug}`} className="op-card op-nav-card"><Icon name={icon} size={22} /><strong>{title}</strong><span className="op-muted">{text}</span></Link>
          ))}
        </div>
      </section>

      <p className="op-muted op-fine">Acervo publicado hoje: {modules.length} módulos e {questions.length} questões ({questions.filter((q) => q.origin === "oficial").length} oficiais do Enem; as demais, autorais no estilo Enem, sem relação com o Inep). O acervo continua crescendo.</p>
    </div>
  );
}
