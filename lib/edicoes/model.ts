/**
 * Exame, edição e eventos (puro, sem I/O). Cada edição tem chave estável, ano do exame, status editorial e uma lista de eventos com
 * data civil em America/Sao_Paulo e fonte. O ano do exame NÃO é o ano em que o evento ocorre: eventos da edição 2026 existem em
 * 2027 (resultados, recursos) e eventos da edição 2027 podem existir em 2026 (inscrições). Nunca se reaproveita uma data de uma
 * edição como estimativa de outra: data desconhecida é `null` + `a-confirmar`, e a interface diz isso.
 */
export type EditionStatus = "rascunho" | "ativa" | "arquivada";
export type EventStatus = "confirmado" | "a-confirmar";
export type EventKind = "inscricao" | "prova-dia-1" | "prova-dia-2" | "gabarito" | "resultado" | "outro";
export type Phase = "preparacao" | "dia-de-prova" | "pos-prova";

export type ExamEvent = {
  key: string;
  kind: EventKind;
  label: string;
  /** YYYY-MM-DD no fuso de São Paulo; nulo enquanto não houver data oficial. */
  date: string | null;
  /** HH:MM (horário de Brasília), opcional. */
  time?: string;
  status: EventStatus;
  /** Recorte/público (ex.: "participantes regulares"). */
  audience?: string;
  sourceUrl?: string;
};

export type Edition = {
  key: string;
  exam: "enem";
  /** Ano do exame (a edição "ENEM 2027" tem year = 2027, mesmo que haja eventos em 2026). */
  year: number;
  label: string;
  status: EditionStatus;
  events: ExamEvent[];
  /** ISO da publicação/ativação editorial (rastreabilidade). */
  publishedAt?: string;
  note?: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isCivilDate = (value: unknown): value is string => typeof value === "string" && DATE.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

/** Eventos válidos: confirmado exige data civil válida; a-confirmar não pode carregar data (evita estimativa disfarçada). */
export function validateEdition(edition: Edition): string[] {
  const problems: string[] = [];
  if (!/^enem-\d{4}$/.test(edition.key)) problems.push(`chave inválida: ${edition.key}`);
  if (edition.key !== `enem-${edition.year}`) problems.push(`chave e ano divergem: ${edition.key} / ${edition.year}`);
  const keys = new Set<string>();
  for (const e of edition.events) {
    if (keys.has(e.key)) problems.push(`evento duplicado: ${e.key}`);
    keys.add(e.key);
    if (e.status === "confirmado" && !isCivilDate(e.date)) problems.push(`${e.key}: confirmado sem data válida`);
    if (e.status === "confirmado" && !e.sourceUrl) problems.push(`${e.key}: confirmado sem fonte`);
    if (e.status === "a-confirmar" && e.date !== null) problems.push(`${e.key}: a confirmar não pode ter data`);
    if (e.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)) problems.push(`${e.key}: horário inválido`);
  }
  return problems;
}

export const activeEdition = (editions: Edition[]) => editions.find((e) => e.status === "ativa") ?? null;

const diffDays = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);

/** Dias de prova confirmados (ordenados). */
export const examDays = (edition: Edition) => edition.events.filter((e) => (e.kind === "prova-dia-1" || e.kind === "prova-dia-2") && e.status === "confirmado" && isCivilDate(e.date)).map((e) => e.date as string).sort();

export function editionState(edition: Edition, today: string) {
  const days = examDays(edition);
  const calendarConfirmed = days.length > 0;
  let phase: Phase = "preparacao";
  if (calendarConfirmed) {
    if (days.includes(today)) phase = "dia-de-prova";
    else if (today > days[days.length - 1]) phase = "pos-prova";
  }
  // Contagem regressiva só para a próxima prova confirmada e futura.
  const nextExam = days.find((d) => d > today) ?? null;
  const daysToNextExam = nextExam ? diffDays(today, nextExam) : null;
  const upcoming = edition.events.filter((e) => e.status === "confirmado" && e.date && e.date >= today).sort((a, b) => (a.date! + (a.time ?? "")).localeCompare(b.date! + (b.time ?? "")));
  return { phase, calendarConfirmed, nextExam, daysToNextExam, nextEvent: upcoming[0] ?? null, days };
}

/** Texto curto e honesto sobre o calendário, para landing, Início e plano. */
export function calendarNote(edition: Edition, today: string): { headline: string; detail: string; countdown: string | null; confirmed: boolean } {
  const s = editionState(edition, today);
  if (!s.calendarConfirmed) {
    return { headline: `Calendário oficial do ENEM ${edition.year} a confirmar`, detail: `Enquanto o Inep não publica as datas da edição ${edition.year}, seu plano segue por semanas. Quando houver data oficial, ela aparece aqui com a fonte.`, countdown: null, confirmed: false };
  }
  if (s.phase === "dia-de-prova") return { headline: `Hoje é dia de prova do ENEM ${edition.year}`, detail: "Confira documentos e local e descanse. Seu material continua salvo.", countdown: null, confirmed: true };
  if (s.phase === "pos-prova") return { headline: `A aplicação do ENEM ${edition.year} já terminou`, detail: "Seu histórico e seus erros continuam disponíveis. A próxima edição aparece aqui quando o Inep publicar o calendário.", countdown: null, confirmed: true };
  const n = s.daysToNextExam!;
  return { headline: `ENEM ${edition.year}: prova em ${formatDate(s.nextExam!)}`, detail: "Datas conforme o Inep. Confira horários e local no seu cartão de confirmação.", countdown: n === 1 ? "Falta 1 dia." : `Faltam ${n} dias.`, confirmed: true };
}

const longFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
export const formatDate = (iso: string) => longFmt.format(new Date(`${iso}T12:00:00Z`));
