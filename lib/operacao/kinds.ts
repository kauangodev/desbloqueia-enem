import type { Bank } from "./types";

/**
 * Catálogo de atividades da Operação (client-safe). Fonte única para o motor, a API e a página de treinos.
 * "bank": conjunto de onde saem as questões. "all" usa o acervo inteiro com seleção equilibrada.
 */
export type KindGroup = "diagnostico" | "treino" | "simulado";
export type KindDef = {
  group: KindGroup;
  title: string;
  objective: string;
  /** Questões por área (Matemática e Natureza). */
  per: number;
  bank: Bank | "all";
  /** Filtro temático por módulos (só treinos novos). Se faltar item, completa com o restante do acervo. */
  math?: string[];
  nature?: string[];
};

const base = (title: string, objective: string, per: number, group: KindGroup): KindDef => ({ group, title, objective, per, bank: "base" });

export const sessionKinds = {
  diagnostico: base("Diagnóstico (opcional)", "8 de Matemática e 8 de Natureza para descobrir por onde começar. Amostra pequena: serve como orientação, não como medida do seu nível.", 8, "diagnostico"),
  "treino-1": base("Treino 1", "10 de Matemática + 10 de Natureza do acervo base.", 10, "treino"),
  "treino-2": base("Treino 2", "10 de Matemática + 10 de Natureza, com seleção diferente do Treino 1.", 10, "treino"),
  "treino-3": base("Treino 3", "10 de Matemática + 10 de Natureza, priorizando o que você ainda não viu.", 10, "treino"),
  "treino-4": { group: "treino", title: "Treino 4 — Proporção, dados e ecologia", objective: "Razão, porcentagem, gráficos e estatística, com soluções, termologia e ecologia.", per: 10, bank: "all", math: ["mat-razao-proporcao", "mat-porcentagem", "mat-graficos-tabelas", "mat-estatistica"], nature: ["bio-ecologia", "qui-solucoes", "fis-termologia"] },
  "treino-5": { group: "treino", title: "Treino 5 — Geometria e energia", objective: "Geometria plana e espacial e grandezas, com energia, dinâmica, termoquímica e bioenergética.", per: 10, bank: "all", math: ["mat-geometria-plana", "mat-geometria-espacial", "mat-grandezas-medidas"], nature: ["fis-energia", "fis-dinamica", "qui-termoquimica", "bio-bioenergetica"] },
  "treino-6": { group: "treino", title: "Treino 6 — Funções, álgebra e eletricidade", objective: "Funções, equações e progressões, com eletricidade, eletroquímica e fisiologia.", per: 10, bank: "all", math: ["mat-funcoes", "mat-equacoes-sistemas", "mat-pa-pg"], nature: ["fis-eletricidade", "qui-eletroquimica", "bio-fisiologia-humana"] },
  "treino-7": { group: "treino", title: "Treino 7 — Contagem, probabilidade e genética", objective: "Probabilidade, combinatória e estatística, com genética, evolução e estequiometria.", per: 10, bank: "all", math: ["mat-probabilidade", "mat-combinatoria", "mat-estatistica"], nature: ["bio-genetica", "bio-evolucao", "qui-estequiometria"] },
  "treino-8": { group: "treino", title: "Treino 8 — Mecânica e química do cotidiano", objective: "Proporção, grandezas e equações, com cinemática, dinâmica, estequiometria e ácidos e bases.", per: 10, bank: "all", math: ["mat-razao-proporcao", "mat-grandezas-medidas", "mat-equacoes-sistemas"], nature: ["fis-cinematica", "fis-dinamica", "qui-estequiometria", "qui-acidos-bases-ph"] },
  "treino-9": { group: "treino", title: "Treino 9 — Ondas, calor e saúde", objective: "Gráficos, porcentagem e geometria, com ondas, termologia, orgânica e saúde pública.", per: 10, bank: "all", math: ["mat-graficos-tabelas", "mat-porcentagem", "mat-geometria-plana"], nature: ["fis-ondas-optica", "fis-termologia", "bio-microbiologia-saude", "qui-organica"] },
  "treino-10": { group: "treino", title: "Treino 10 — Química integrada", objective: "Funções, progressões e probabilidade, com foco em Química, energia e biotecnologia.", per: 10, bank: "all", math: ["mat-funcoes", "mat-pa-pg", "mat-probabilidade"], nature: ["qui-solucoes", "qui-termoquimica", "qui-acidos-bases-ph", "qui-organica", "qui-eletroquimica", "qui-estequiometria", "fis-energia", "bio-biotecnologia"] },
  "treino-11": { group: "treino", title: "Treino 11 — Revisão equilibrada", objective: "Seleção equilibrada de todo o acervo, priorizando o que você ainda não praticou.", per: 10, bank: "all" },
  simulado: base("Simulado base", "Formato de 45 de Matemática + 45 de Natureza com o acervo base.", 45, "simulado"),
  "sim-1": { group: "simulado", title: "Simulado 1 — Fundamentos e interpretação", objective: "Conceitos centrais e leitura de enunciados, tabelas e gráficos, com nível de dificuldade mais acessível.", per: 45, bank: "s1" },
  "sim-2": { group: "simulado", title: "Simulado 2 — Aplicação e resolução de problemas", objective: "Problemas contextualizados de várias etapas, com cálculo e interpretação de resultados.", per: 45, bank: "s2" },
  "sim-3": { group: "simulado", title: "Simulado 3 — Integração de conteúdos", objective: "Questões que combinam assuntos (proporção e geometria, energia e eletricidade, genética e saúde).", per: 45, bank: "s3" },
  "sim-4": { group: "simulado", title: "Simulado 4 — Revisão final", objective: "Panorama amplo de todos os módulos, com dificuldade variada, para a última revisão.", per: 45, bank: "s4" },
} satisfies Record<string, KindDef>;

export type SessionKind = keyof typeof sessionKinds;
export const kindIds = Object.keys(sessionKinds) as SessionKind[];
export const isSimulado = (kind: string) => sessionKinds[kind as SessionKind]?.group === "simulado";
/** Duração de referência editorial (não é a duração oficial do Enem). */
export const referenceMinutes = (kind: SessionKind) => (isSimulado(kind) ? 300 : Math.round(sessionKinds[kind].per * 2 * 2.5));
