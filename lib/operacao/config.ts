/**
 * Configuração central da campanha "Operação 2º Domingo".
 * Datas, fuso e textos temporais vivem aqui: nenhum componente deve repetir "próximo domingo" ou datas.
 *
 * Fonte das datas: notícia oficial do Inep sobre o Enem 2026 (1º dia em 08/11/2026 e 2º dia em 15/11/2026),
 * consultada em 08/11/2026. O Inep informa o término do 2º dia às 18h30; o horário de início e a duração do 2º dia
 * NÃO constaram na fonte consultada e, por isso, não são afirmados na interface.
 */
export const operacao = {
  slug: "operacao-segundo-domingo",
  basePath: "/aluno/operacao-segundo-domingo",
  publicAlias: "/operacao-segundo-domingo",
  name: "Operação 2º Domingo",
  subtitle: "Reta final de Matemática e Natureza",
  badge: "Reta final",
  timezone: "America/Sao_Paulo",
  firstDay: "2026-11-08",
  examDate: "2026-11-15",
  examEndsAtLocal: "18:30",
  sourceUrl: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/enem-2026-primeiro-dia-de-provas-ocorre-neste-domingo-8/",
  sourceCheckedAt: "2026-11-08",
  disciplines: ["Matemática", "Física", "Química", "Biologia"],
  simulado: {
    targetQuestions: 90,
    /** Referência editorial (5 h) para o modo prova. NÃO é a duração oficial do 2º dia, que não constou na fonte consultada. */
    referenceMinutes: 300,
  },
} as const;

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: operacao.timezone, year: "numeric", month: "2-digit", day: "2-digit" });

/** Data civil (YYYY-MM-DD) no fuso de referência. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return fmt.format(now);
}

const toUtcDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso: string, days: number): string {
  const date = new Date(toUtcDay(iso) + days * 86400000);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcDay(toIso) - toUtcDay(fromIso)) / 86400000);
}

/** Dia da semana (0 = domingo … 6 = sábado) de uma data civil. */
export function weekday(iso: string): number {
  return new Date(toUtcDay(iso)).getUTCDay();
}

export type Phase = "antes" | "dia" | "depois";

export function campaignStatus(today: string = todayInSaoPaulo()) {
  const days = daysBetween(today, operacao.examDate);
  const phase: Phase = days > 0 ? "antes" : days === 0 ? "dia" : "depois";
  const dateLabel = formatLongDate(operacao.examDate);
  let headline: string;
  let detail: string;
  if (phase === "antes") {
    const when = days === 1 ? "amanhã" : `em ${days} dias`;
    headline = days <= 7 ? `O 2º dia do Enem é ${when}, ${dateLabel}.` : `O 2º dia do Enem é em ${dateLabel}.`;
    detail = days <= 7 ? "Use o plano da semana para distribuir revisão, prática e correção dos erros." : "Comece pela revisão que mais combina com o tempo que você tem.";
  } else if (phase === "dia") {
    headline = "Hoje é o 2º dia do Enem: Matemática e Ciências da Natureza.";
    detail = "Hoje não é dia de estudar: confira documentos e local, alimente-se e respire. Seu material continua salvo.";
  } else {
    headline = "O 2º dia do Enem já passou.";
    detail = "Seus materiais, seu histórico e seus erros continuam disponíveis para revisão e para a próxima etapa dos seus estudos.";
  }
  return { phase, daysLeft: Math.max(days, 0), dateLabel, headline, detail, today };
}

const longFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
export function formatLongDate(iso: string): string {
  return longFmt.format(new Date(toUtcDay(iso)));
}

const shortFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" });
export function formatShortDate(iso: string): string {
  return shortFmt.format(new Date(toUtcDay(iso))).replace(".", "");
}
