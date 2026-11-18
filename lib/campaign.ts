import { brl, planTotalCents } from "./pricing";
import { editionCalendar, operacao } from "./operacao/config";

/**
 * Narrativa comercial da landing para a edição ativa (ENEM 2027). A faixa de data só aparece com prova CONFIRMADA e futura;
 * sem calendário oficial a página diz "a confirmar" e nunca usa a data de outra edição. Datas e fases vêm de `data/edicoes.ts`.
 */
export const campaign = {
  id: "desbloqueia-enem-2027",
  edition: "ENEM 2027",
  enabled: true,
  destinations: {
    /** Oferta/planos da própria landing (fluxo comercial existente; nada de checkout paralelo). */
    offer: "/landing#ofertas",
    /** Quem já tem acesso vai direto para a área de estudo. */
    studyArea: "/aluno",
    /** Quem tem conta mas ainda não entrou: o login preserva o destino. */
    login: `/entrar?redirect=${encodeURIComponent("/aluno")}`,
    /** Ferramenta de Matemática e Natureza (rota permanente). */
    mathNature: operacao.basePath,
  },
} as const;

export type CampaignView = {
  /** Faixa de contagem regressiva ativa (prova confirmada e futura). */
  active: boolean;
  editionLabel: string;
  calendarConfirmed: boolean;
  daysLeft: number;
  /** "Calendário oficial do ENEM 2027 a confirmar" ou "ENEM 2027: prova em 7 de novembro de 2027". */
  label: string;
  /** "Faltam 6 dias." (nulo sem prova confirmada e futura) */
  countdown: string | null;
  detail: string;
  headline: string;
  emphasis: string;
  support: string;
  primaryCta: string;
  secondaryCta: string;
  journeyTitle: string;
};

/** Estado textual da campanha para uma data (America/Sao_Paulo). Puro e testável. */
export function campaignView(today?: string): CampaignView {
  const cal = editionCalendar(today);
  const label = cal?.note.headline ?? "ENEM 2027";
  const common = {
    editionLabel: cal?.edition.label ?? "ENEM 2027",
    calendarConfirmed: cal?.note.confirmed ?? false,
    label,
    detail: cal?.note.detail ?? "",
    headline: "Sua preparação para o ENEM 2027,",
    emphasis: "passo a passo.",
    support: "Siga uma trilha, pratique questões e volte aos assuntos que mais precisam de atenção.",
    primaryCta: "Conhecer os planos",
    secondaryCta: "Experimentar uma questão",
    journeyTitle: "Revise, pratique e entenda seus erros.",
  };
  const days = cal?.state.daysToNextExam ?? null;
  const upcoming = Boolean(cal?.note.confirmed && cal.state.phase === "preparacao" && days !== null && days > 0);
  return { ...common, active: upcoming, daysLeft: upcoming ? days! : 0, countdown: upcoming ? cal!.note.countdown : null };
}

/** Preço de entrada para textos de apoio (já com a taxa do checkout). */
export const entryPrice = () => brl(planTotalCents("essencial"));
