export type Discipline = "matematica" | "fisica" | "quimica" | "biologia";
export type Area = "Matemática" | "Ciências da Natureza";
export type Origin = "oficial" | "autoral" | "adaptada";
export type Difficulty = "facil" | "media" | "dificil";
export type Status = "rascunho" | "revisado" | "publicado";
/** Conjunto editorial: "base" (acervo original) ou um dos quatro simulados novos (s1–s4). */
export type Bank = "base" | "s1" | "s2" | "s3" | "s4";

export const disciplineLabel: Record<Discipline, string> = {
  matematica: "Matemática",
  fisica: "Física",
  quimica: "Química",
  biologia: "Biologia",
};
export const disciplineArea = (d: Discipline): Area => (d === "matematica" ? "Matemática" : "Ciências da Natureza");
export const difficultyLabel: Record<Difficulty, string> = { facil: "Fácil", media: "Média", dificil: "Difícil" };
export const originLabel: Record<Origin, string> = {
  oficial: "Questão oficial do Enem",
  autoral: "Questão autoral no estilo Enem",
  adaptada: "Questão adaptada",
};

export type Question = {
  id: string;
  discipline: Discipline;
  topic: string;
  moduleId: string;
  origin: Origin;
  official?: { year: number; day: 1 | 2; caderno: string; number: number; sourceUrl: string };
  statement: string;
  figure?: { src: string; alt: string; longDescription?: string };
  options: { id: "A" | "B" | "C" | "D" | "E"; text: string }[];
  answer: "A" | "B" | "C" | "D" | "E";
  resolution: string;
  distractors: Partial<Record<"A" | "B" | "C" | "D" | "E", string>>;
  misconception: string;
  minutes: number;
  difficulty: Difficulty;
  status: Status;
  /** Conjunto a que a questão pertence (padrão: base). Os simulados novos usam itens exclusivos. */
  bank?: Bank;
  reviewedAt: string;
  source: { label: string; url?: string; reuse: string };
};

export type RecallQuestion = { q: string; a: string };
export type ModuleExample = { title: string; problem: string; solution: string };
export type FormulaRef = { tex: string; meaning: string; conditions?: string };

export type StudyModule = {
  id: string;
  discipline: Discipline;
  order: number;
  title: string;
  objective: string;
  minutes: number;
  prerequisites: string[];
  /** Dia sugerido no plano (1 = segunda … 6 = sábado). */
  planDay?: number;
  concept: string;
  situations: string;
  formulas: FormulaRef[];
  examples: ModuleExample[];
  commonErrors: string[];
  summary: string[];
  recall: RecallQuestion[];
  related: string[];
  sources: { label: string; url?: string }[];
  reviewedAt: string;
  status: Status;
};

export type FormulaCard = {
  id: string;
  discipline: Discipline;
  topic: string;
  title: string;
  tex?: string;
  meaning: string;
  conditions: string;
  example: string;
  commonError: string;
  moduleId: string;
};

/** Versão pública: sem gabarito, resolução ou explicações. */
export type PublicQuestion = {
  id: string;
  discipline: Discipline;
  topic: string;
  moduleId: string;
  origin: Origin;
  originLabel: string;
  officialRef?: string;
  difficulty: Difficulty;
  minutes: number;
  statementHtml: string;
  figure?: Question["figure"];
  options: { id: string; html: string }[];
};

export type Correction = {
  questionId: string;
  selected: string | null;
  correct: boolean;
  answer: string;
  resolutionHtml: string;
  distractorHtml: string | null;
  misconception: string;
  moduleId: string;
};

/** Metadados leves para listagens (sem enunciado, gabarito ou resolução). */
export type QuestionMeta = { id: string; discipline: Discipline; topic: string; moduleId: string; origin: Origin; difficulty: Difficulty; minutes: number };
