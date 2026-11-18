import { editions } from "../../data/edicoes";
import { activeEdition, calendarNote, editionState } from "../edicoes/model";

/**
 * Configuração central da área de estudo de Matemática e Ciências da Natureza (antes "Operação 2º Domingo").
 * É uma ferramenta permanente, independente da edição do exame: nome, rotas e conteúdo não carregam ano nem campanha.
 * Datas e fase do exame vêm do modelo de edições (`data/edicoes.ts`), nunca daqui.
 *
 * Compatibilidade: o endereço antigo `/aluno/operacao-segundo-domingo/*` redireciona (308, com query) para `basePath`.
 * Os registros do aluno (`operacao_state`) mantêm os mesmos `kind` e IDs: nada é migrado nem perdido.
 */
export const operacao = {
  slug: "matematica-natureza",
  basePath: "/aluno/matematica-natureza",
  /** Endereço anterior (anúncios, e-mails e favoritos). Mantido só para redirecionar. */
  legacyBasePath: "/aluno/operacao-segundo-domingo",
  publicAlias: "/operacao-segundo-domingo",
  name: "Matemática e Natureza",
  subtitle: "Revisões, questões, treinos e simulados",
  timezone: "America/Sao_Paulo",
  disciplines: ["Matemática", "Física", "Química", "Biologia"],
  simulado: {
    targetQuestions: 90,
    /** Referência editorial (5 h) para o modo prova. NÃO é a duração oficial de nenhum dia do Enem. */
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

/** Edição ativa do exame + estado e texto do calendário para hoje. Sem data oficial: "a confirmar", sem estimativa. */
export function editionCalendar(today: string = todayInSaoPaulo()) {
  const edition = activeEdition(editions);
  if (!edition) return null;
  return { edition, state: editionState(edition, today), note: calendarNote(edition, today) };
}

const longFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
export function formatLongDate(iso: string): string {
  return longFmt.format(new Date(toUtcDay(iso)));
}

const shortFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" });
export function formatShortDate(iso: string): string {
  return shortFmt.format(new Date(toUtcDay(iso))).replace(".", "");
}
