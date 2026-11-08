import { addDays, daysBetween, formatShortDate, operacao, weekday } from "./config";
import type { Discipline } from "./types";

export type TaskType = "ler" | "praticar" | "erros" | "formulas" | "treino" | "pausa" | "checklist";
export type PlanTask = { id: string; type: TaskType; minutes: number; title: string; detail: string; href?: string; discipline?: Discipline };
export type PlanDay = { date: string; label: string; theme: string; isExamDay: boolean; light: boolean; tasks: PlanTask[]; totalMinutes: number };

type DayTemplate = { theme: string; modules: string[]; practiceTopics: string[] };

/** Distribuição editorial por dia da semana (1 = segunda … 6 = sábado). Os módulos referenciados precisam existir no catálogo publicado. */
export const dayTemplates: Record<number, DayTemplate> = {
  1: { theme: "Proporcionalidade, medidas, ecologia e célula", modules: ["mat-razao-proporcao", "mat-grandezas-medidas", "bio-ecologia", "bio-citologia", "bio-bioenergetica", "mat-porcentagem"], practiceTopics: ["Razão e proporção", "Grandezas e medidas", "Ecologia", "Citologia"] },
  2: { theme: "Dados, cinemática, calor e energia química", modules: ["mat-graficos-tabelas", "mat-estatistica", "fis-eletricidade", "fis-cinematica", "fis-termologia", "qui-termoquimica"], practiceTopics: ["Gráficos e tabelas", "Estatística", "Eletricidade", "Cinemática"] },
  3: { theme: "Geometria, contagem, soluções e orgânica", modules: ["mat-geometria-plana", "mat-geometria-espacial", "mat-combinatoria", "qui-estequiometria", "qui-solucoes", "qui-organica", "fis-ondas-optica", "qui-eletroquimica"], practiceTopics: ["Geometria", "Análise combinatória", "Estequiometria", "Soluções"] },
  4: { theme: "Funções, probabilidade, energia e genética", modules: ["mat-funcoes", "mat-probabilidade", "mat-pa-pg", "mat-equacoes-sistemas", "fis-energia", "fis-dinamica", "bio-genetica", "qui-acidos-bases-ph"], practiceTopics: ["Funções", "Probabilidade", "Energia", "Genética"] },
  5: { theme: "Treino misto e revisão das dificuldades", modules: [], practiceTopics: [] },
  6: { theme: "Revisão leve, fórmulas e organização", modules: [], practiceTopics: [] },
};

type Catalog = { moduleTitle: (id: string) => string | null; moduleMinutes: (id: string) => number; moduleDiscipline: (id: string) => Discipline | undefined };

const minutesBudget = (total: number) => ({ ler: total >= 120 ? 35 : total >= 60 ? 25 : 15, praticar: total >= 120 ? 40 : total >= 60 ? 25 : 15, erros: total >= 120 ? 25 : total >= 60 ? 10 : 0, pausa: total >= 120 ? 10 : 0 });

/** Garante que o dia caiba no tempo escolhido: reduz as tarefas (nunca abaixo de 5 min), de trás para a frente. */
function fitToBudget(tasks: PlanTask[], limit: number) {
  let total = tasks.reduce((sum, task) => sum + task.minutes, 0);
  for (let i = tasks.length - 1; i >= 0 && total > limit; i -= 1) {
    const cut = Math.min(total - limit, Math.max(tasks[i].minutes - 5, 0));
    tasks[i].minutes -= cut; total -= cut;
  }
  // Se ainda passar (muitas tarefas mínimas), remove as de menor prioridade (últimas).
  while (total > limit && tasks.length > 1) { total -= tasks.pop()!.minutes; }
}

/**
 * Plano adaptável de segunda a sábado, com orientação leve no domingo.
 * - Considera apenas os dias que ainda faltam (a partir de `today`); dias passados não geram tarefas vencidas.
 * - O volume cabe no tempo diário escolhido (30/60/120 min), com pausa proporcional.
 */
export function buildPlan(minutes: 30 | 60 | 120, today: string, catalog: Catalog): PlanDay[] {
  const days: PlanDay[] = [];
  const left = daysBetween(today, operacao.examDate);
  if (left < 0) return days;
  const budget = minutesBudget(minutes);
  for (let offset = 0; offset <= left; offset += 1) {
    const date = addDays(today, offset);
    const wd = weekday(date);
    const isExamDay = date === operacao.examDate;
    const label = formatShortDate(date);
    if (isExamDay) {
      days.push({ date, label, theme: "Dia da prova: sem maratona", isExamDay: true, light: true, totalMinutes: 5, tasks: [{ id: `${date}:checklist`, type: "checklist", minutes: 5, title: "Checklist de véspera e de manhã", detail: "Documento, caneta de tinta preta, água e lanche leves, trajeto e horário conferidos. Estudar hoje não é necessário.", href: `${operacao.basePath}/formulas` }] });
      continue;
    }
    if (wd === 0) {
      days.push({ date, label, theme: "Domingo: orientação leve", isExamDay: false, light: true, totalMinutes: 15, tasks: [{ id: `${date}:checklist`, type: "checklist", minutes: 15, title: "Planeje a semana sem maratona", detail: "Escolha seu tempo diário e comece pelo módulo do dia. Descanso também faz parte da preparação.", href: `${operacao.basePath}/plano` }] });
      continue;
    }
    const tpl = dayTemplates[wd];
    const tasks: PlanTask[] = [];
    if (wd === 6) {
      tasks.push({ id: `${date}:formulas`, type: "formulas", minutes: Math.min(minutes, 30), title: "Revisão leve de fórmulas e conceitos", detail: "Releia as fichas salvas e as que mais confundem. Sem conteúdo novo.", href: `${operacao.basePath}/formulas` });
      if (minutes >= 60) tasks.push({ id: `${date}:erros`, type: "erros", minutes: 15, title: "Passe pelos seus erros", detail: "Tente de novo as questões que você errou e confira a resolução.", href: `${operacao.basePath}/erros` });
      tasks.push({ id: `${date}:pausa`, type: "pausa", minutes: 5, title: "Organize o material e descanse cedo", detail: "Separe tudo para domingo e durma bem." });
    } else if (wd === 5) {
      tasks.push({ id: `${date}:treino`, type: "treino", minutes: Math.min(minutes, 45), title: "Treino misto de Matemática e Natureza", detail: "Resolva um treino e revise as questões em que mais teve dificuldade.", href: `${operacao.basePath}/treinos` });
      if (minutes >= 60) tasks.push({ id: `${date}:erros`, type: "erros", minutes: 20, title: "Revise seus erros da semana", detail: "Use o caderno de erros para voltar ao conceito antes de tentar de novo.", href: `${operacao.basePath}/erros` });
    } else {
      const moduleIds = tpl.modules.filter((id) => catalog.moduleTitle(id));
      const pick = moduleIds.slice(0, minutes >= 120 ? 2 : 1);
      for (const id of pick) tasks.push({ id: `${date}:ler:${id}`, type: "ler", minutes: Math.min(budget.ler, catalog.moduleMinutes(id)), title: `Ler: ${catalog.moduleTitle(id)}`, detail: "Leia, tente as perguntas de recuperação e marque como concluído quando terminar.", href: `${operacao.basePath}/materiais/${id}`, discipline: catalog.moduleDiscipline(id) });
      tasks.push({ id: `${date}:praticar`, type: "praticar", minutes: budget.praticar, title: `Praticar: ${tpl.practiceTopics.join(", ")}`, detail: "Questões do assunto do dia, com resolução comentada.", href: `${operacao.basePath}/questoes` });
      if (budget.erros) tasks.push({ id: `${date}:erros`, type: "erros", minutes: budget.erros, title: "Corrija seus erros", detail: "Reveja a resolução e tente novamente.", href: `${operacao.basePath}/erros` });
      if (budget.pausa) tasks.push({ id: `${date}:pausa`, type: "pausa", minutes: budget.pausa, title: "Pausa", detail: "Levante, beba água, descanse a vista." });
    }
    fitToBudget(tasks, minutes);
    const totalMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
    days.push({ date, label, theme: tpl?.theme || "Revisão", isExamDay: false, light: wd === 6, tasks, totalMinutes });
  }
  return days;
}
