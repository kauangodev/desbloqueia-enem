export const brand = {
  name: "GoDev Education",
  product: "Desbloqueia ENEM 2026",
};
export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://desbloqueia-enem.vercel.app";
export const plans = [
  {
    id: "essencial",
    name: "Essencial",
    cents: 1990,
    description: "Uma base clara para retomar o que importa.",
    features: [
      "Resumos estratégicos por disciplina",
      "Cronograma de estudos",
      "40 exercícios comentados",
      "Leitura na plataforma",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    cents: 3990,
    description: "Mais prática. Mais repertório. Tudo conectado.",
    features: [
      "Tudo do Essencial",
      "Dois simulados compactos",
      "Preparação para redação",
      "Biblioteca histórica do ENEM",
      "Fichas e checklists do kit",
    ],
  },
] as const;
export type Plan = "essencial" | "premium";
export const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const materials = [
  {
    id: "guia",
    title: "Mapa da revisão",
    category: "Cronograma",
    description: "Prioridades de estudo e curadoria pedagógica.",
    pages: 12,
    plan: "essencial",
    cover: "/covers/guia.png",
  },
  {
    id: "linguagens",
    title: "Linguagens & Redação",
    category: "Linguagens",
    description: "Leitura, interpretação e construção de argumentos.",
    pages: 13,
    plan: "essencial",
    cover: "/covers/linguagens.png",
  },
  {
    id: "humanas",
    title: "Ciências Humanas",
    category: "Humanas",
    description: "Contextos, conceitos e conexões para sua revisão.",
    pages: 15,
    plan: "essencial",
    cover: "/covers/humanas.png",
  },
  {
    id: "natureza",
    title: "Ciências da Natureza",
    category: "Natureza",
    description: "Fundamentos, exemplos resolvidos e alertas de prova.",
    pages: 15,
    plan: "essencial",
    cover: "/covers/natureza.png",
  },
  {
    id: "matematica",
    title: "Matemática",
    category: "Matemática",
    description: "Raciocínio e prática, uma etapa de cada vez.",
    pages: 14,
    plan: "essencial",
    cover: "/covers/matematica.png",
  },
  {
    id: "kit",
    title: "Kit completo de revisão",
    category: "Simulados",
    description: "Revisão, exercícios, simulados e redação em um volume.",
    pages: 87,
    plan: "premium",
    cover: "/covers/kit.png",
  },
] as const;
