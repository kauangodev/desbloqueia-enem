import { formulaCards } from "../../data/operacao/formulas";
import { operacaoModules as modulesBase } from "../../data/operacao/modules";
import { modulesMat2 } from "../../data/operacao/modules-mat2";
import { modulesNat2 } from "../../data/operacao/modules-nat2";
import { operacaoQuestions } from "../../data/operacao/questions";
import { renderInline, renderRich } from "./rich";
import { disciplineLabel, originLabel, type Correction, type Discipline, type FormulaCard, type PublicQuestion, type Question, type QuestionMeta, type StudyModule } from "./types";

/** A interface do aluno só enxerga conteúdo com status "publicado". */
const disciplineOrder = ["matematica", "fisica", "quimica", "biologia"];
export const allModules: StudyModule[] = [...modulesBase, ...modulesMat2, ...modulesNat2];
export const modules: StudyModule[] = allModules.filter((item) => item.status === "publicado").sort((a, b) => disciplineOrder.indexOf(a.discipline) - disciplineOrder.indexOf(b.discipline) || a.order - b.order);
export const questions: Question[] = operacaoQuestions.filter((item) => item.status === "publicado");
export const formulas: FormulaCard[] = formulaCards;

const questionIndex = new Map(questions.map((item) => [item.id, item]));
const moduleIndex = new Map(modules.map((item) => [item.id, item]));

export const questionById = (id: string) => questionIndex.get(id);
export const moduleById = (id: string) => moduleIndex.get(id);

export const topicsFor = (discipline?: Discipline) => [...new Set(questions.filter((q) => !discipline || q.discipline === discipline).map((q) => q.topic))].sort();

export function officialRef(q: Question): string | undefined {
  return q.official ? `Enem ${q.official.year} · ${q.official.day}º dia · caderno ${q.official.caderno} · questão ${q.official.number}` : undefined;
}

export function toPublic(q: Question): PublicQuestion {
  return {
    id: q.id,
    discipline: q.discipline,
    topic: q.topic,
    moduleId: q.moduleId,
    origin: q.origin,
    originLabel: originLabel[q.origin],
    officialRef: officialRef(q),
    difficulty: q.difficulty,
    minutes: q.minutes,
    statementHtml: renderRich(q.statement),
    figure: q.figure ? { src: q.figure.src, alt: q.figure.alt, longDescription: q.figure.longDescription } : undefined,
    options: q.options.map((option) => ({ id: option.id, html: renderInline(option.text) })),
  };
}

export const toMeta = (q: Question): QuestionMeta => ({ id: q.id, discipline: q.discipline, topic: q.topic, moduleId: q.moduleId, origin: q.origin, difficulty: q.difficulty, minutes: q.minutes });

export function grade(q: Question, selected: string | null): Correction {
  const correct = selected === q.answer;
  const wrong = selected && !correct ? q.distractors[selected as keyof Question["distractors"]] : undefined;
  return {
    questionId: q.id,
    selected,
    correct,
    answer: q.answer,
    resolutionHtml: renderRich(q.resolution),
    distractorHtml: wrong ? renderRich(wrong) : null,
    misconception: q.misconception,
    moduleId: q.moduleId,
  };
}

export const disciplinesWithContent = (): Discipline[] => (["matematica", "fisica", "quimica", "biologia"] as Discipline[]).filter((d) => modules.some((m) => m.discipline === d) || questions.some((q) => q.discipline === d));
export const countBy = (d: Discipline) => ({ label: disciplineLabel[d], modules: modules.filter((m) => m.discipline === d).length, questions: questions.filter((q) => q.discipline === d).length, formulas: formulas.filter((f) => f.discipline === d).length });
