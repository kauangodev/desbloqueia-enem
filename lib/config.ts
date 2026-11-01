import { ebookMaterials } from "./ebook-catalog";

export const brand = {
  name: "GoDev Education",
  product: "Desbloqueia ENEM 2026",
};
export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://godeveducation.com.br";
export const plans = [
  {
    id: "essencial",
    name: "Essencial",
    cents: 1990,
    description: "Uma base clara para retomar o que importa.",
    features: [
      "E-books essenciais de Linguagens, Humanas, Natureza e Matemática",
      "Cronograma e mapa da revisão",
      "40 exercícios comentados para fixação",
      "Leitura online no celular, tablet ou computador",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    cents: 3290,
    description: "Mais prática. Mais repertório. Tudo conectado.",
    features: [
      "Tudo do Essencial",
      "Coleção completa com 16 e-books didáticos de 34 páginas",
      "2.100 questões autorais no estilo ENEM",
      "30 simulados com 600 questões",
      "60 listas de exercícios com 1.500 questões",
      "E-book de Redação; em manutenção — correção automática de redações em desenvolvimento.",
      "Biblioteca histórica com 1.800 questões de referência",
      "Fichas e checklists para a reta final",
    ],
  },
] as const;
export const caktoFallbackOffers = {
  essencial: {
    productId: "6ff97951-a03a-4bed-bbe5-62c88031c0fc",
    offerId: "3biievb",
    checkoutUrl: "https://pay.cakto.com.br/3biievb_1233750",
  },
  premium: {
    productId: "e1fc994d-6000-41d4-9b08-5af47ec3ce07",
    offerId: "3fq7t2s",
    checkoutUrl: "https://pay.cakto.com.br/3fq7t2s_1233753",
  },
} as const;
export type Plan = "essencial" | "premium";
export const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const materials = ebookMaterials;


