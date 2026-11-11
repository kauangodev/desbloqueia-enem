import "server-only";
import { grade, modules, questionById } from "./operacao/catalog";
import { disciplineLabel, type Discipline } from "./operacao/types";
import { renderRich } from "./operacao/rich";
import { heroBooks } from "./hero-books";
import type { DemoModule, DemoQuestion, ExplorerData } from "../components/landing/explorer-types";

/** Amostras públicas (5 itens autorais de Matemática e Natureza, já revisados). Só estas saem do servidor. */
const SAMPLE_IDS = ["aut-mat-003", "aut-fis-005", "aut-qui-001", "aut-mat-005", "aut-bio-008"] as const;
const MODULE_BY_DISC: Record<Discipline, string> = { matematica: "mat-razao-proporcao", fisica: "fis-energia", quimica: "qui-estequiometria", biologia: "bio-ecologia" };

export function demoQuestions(): DemoQuestion[] {
  const out: DemoQuestion[] = [];
  for (const id of SAMPLE_IDS) {
    const q = questionById(id);
    if (!q) continue; // nunca quebra a landing se um item sair do acervo
    const right = grade(q, q.answer);
    out.push({
      id: q.id,
      disc: q.discipline,
      discLabel: disciplineLabel[q.discipline],
      area: q.discipline === "matematica" ? "Matemática" : "Natureza",
      topic: q.topic,
      statementHtml: renderRich(q.statement),
      options: q.options.map((o) => ({ id: o.id, html: renderRich(o.text), why: o.id === q.answer ? null : grade(q, o.id).distractorHtml })),
      answer: q.answer,
      resolutionHtml: right.resolutionHtml,
      misconception: q.misconception,
    });
  }
  return out;
}

export function demoModules(): DemoModule[] {
  const out: DemoModule[] = [];
  for (const disc of ["matematica", "fisica", "quimica", "biologia"] as Discipline[]) {
    const m = modules.find((item) => item.id === MODULE_BY_DISC[disc]);
    const book = heroBooks.find((b) => b.slug === disc);
    if (!m || !book) continue;
    const ex = m.examples[0];
    out.push({
      disc,
      discLabel: disciplineLabel[disc],
      title: m.title,
      minutes: m.minutes,
      objective: m.objective,
      conceptHtml: renderRich(m.concept),
      example: ex ? { title: ex.title, problemHtml: renderRich(ex.problem), solutionHtml: renderRich(ex.solution) } : null,
      cover: book.cover320,
      coverTitle: book.title,
    });
  }
  return out;
}

export function buildExplorerData(args: { counts: ExplorerData["counts"]; studyArea: string; hasAccess: boolean; countdown: string | null; active: boolean }): ExplorerData {
  return { questions: demoQuestions(), modules: demoModules(), ...args };
}
