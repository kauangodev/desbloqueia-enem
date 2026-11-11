/** Dados PÚBLICOS da exploração da hero: somente as amostras escolhidas para demonstração (nunca o banco pago inteiro). */
export type DemoOption = { id: string; html: string; why: string | null };
export type DemoQuestion = {
  id: string;
  disc: "matematica" | "fisica" | "quimica" | "biologia";
  discLabel: string;
  area: "Matemática" | "Natureza";
  topic: string;
  statementHtml: string;
  options: DemoOption[];
  answer: string;
  resolutionHtml: string;
  misconception: string;
};
export type DemoModule = {
  disc: DemoQuestion["disc"];
  discLabel: string;
  title: string;
  minutes: number;
  objective: string;
  conceptHtml: string;
  example: { title: string; problemHtml: string; solutionHtml: string } | null;
  cover: string;
  coverTitle: string;
};
export type ExplorerData = {
  questions: DemoQuestion[];
  modules: DemoModule[];
  counts: { questions: number; modules: number; simulados: number; simuladoQuestions: number; treinos: number };
  studyArea: string;
  hasAccess: boolean;
  countdown: string | null;
  active: boolean;
};
