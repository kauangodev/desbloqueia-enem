import { campaignStatus, formatLongDate, operacao, type Phase } from "./operacao/config";

/**
 * Configuração central da campanha "Reta final ENEM" (landing + quiz).
 * A data e o fuso vêm de `lib/operacao/config.ts` (fonte: Inep). Nenhum componente deve repetir datas ou
 * "próximo domingo": tudo é derivado daqui, e a campanha muda de estado sozinha (antes, no dia, depois).
 */
export const campaign = {
  id: "reta-final-enem-2026",
  edition: "2º dia · Matemática e Ciências da Natureza",
  enabled: true,
  destinations: {
    /** Oferta/planos da própria landing (fluxo comercial existente; nada de checkout paralelo). */
    offer: "/landing#planos",
    /** Quem já tem acesso vai direto para a área de reta final. */
    studyArea: operacao.basePath,
    /** Quem tem conta mas ainda não entrou: o login preserva o destino. */
    login: `/entrar?redirect=${encodeURIComponent(operacao.basePath)}`,
    journey: "#reta-final",
  },
} as const;

export type CampaignView = {
  active: boolean;
  phase: Phase;
  daysLeft: number;
  /** "Reta final ENEM · 15 de novembro" */
  label: string;
  /** "Faltam 6 dias para o segundo dia do Enem." (nulo depois da prova) */
  countdown: string | null;
  headline: string;
  emphasis: string;
  support: string;
  primaryCta: string;
  secondaryCta: string;
  journeyTitle: string;
};

const shortDate = (iso: string) => formatLongDate(iso).replace(/^[^,]+,\s*/, "");

/** Estado textual da campanha para uma data (America/Sao_Paulo). Puro e testável. */
export function campaignView(today?: string): CampaignView {
  const status = campaignStatus(today);
  const date = shortDate(operacao.examDate); // "15 de novembro"
  const label = `Reta final ENEM · ${date}`;
  const base = {
    phase: status.phase,
    daysLeft: status.daysLeft,
    label,
    journeyTitle: "Uma reta final com direção.",
  };
  if (!campaign.enabled || status.phase === "depois") {
    return {
      ...base,
      active: false,
      countdown: null,
      headline: "Sua próxima conquista",
      emphasis: "começa aqui.",
      support: "Estude com materiais completos, exercícios, simulados e um plano de estudos focado no ENEM.",
      primaryCta: "Ver planos",
      secondaryCta: "Experimentar uma questão",
        journeyTitle: "Revise, pratique e entenda seus erros.",
    };
  }
  if (status.phase === "dia") {
    return {
      ...base,
      active: true,
      countdown: "O segundo dia do Enem é hoje.",
      headline: "Boa prova no",
      emphasis: "segundo dia do Enem.",
      support: "Matemática e Ciências da Natureza. Depois da prova, seus materiais e seu histórico continuam disponíveis para a próxima etapa dos estudos.",
      primaryCta: "Conhecer a plataforma",
      secondaryCta: "Experimentar uma questão",
    };
  }
  const days = status.daysLeft;
  const countdown = days === 1 ? "Falta 1 dia para o segundo dia do Enem." : `Faltam ${days} dias para o segundo dia do Enem.`;
  return {
    ...base,
    active: true,
    countdown,
    headline: days <= 7 ? "Revise Matemática e Natureza" : "Sua reta final",
    emphasis: days <= 7 ? "antes de domingo." : "para o 2º dia começa agora.",
    support: "600 questões comentadas, 5 simulados de 90 questões, 11 treinos e 16 e-books de 34 páginas. Plano Premium por R$ 19,90, pagamento único.",
    primaryCta: "Quero o Premium · R$ 19,90",
    secondaryCta: "Experimentar uma questão",
  };
}
