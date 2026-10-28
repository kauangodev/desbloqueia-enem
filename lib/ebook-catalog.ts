export type EbookPlan = "essencial" | "premium";

export type EbookMaterial = {
  id: string;
  title: string;
  description: string;
  category: string;
  pages: number;
  plan: EbookPlan;
  cover: string;
  storagePath: string;
  version: number;
};

const entries: Array<[string, string, string, string, string, EbookPlan]> = [
  ["01", "Língua Portuguesa", "Leitura, sentidos e linguagem para interpretar textos com mais segurança.", "Linguagens", "lingua-portuguesa", "essencial"],
  ["02", "Literatura", "Obras, contextos e vozes para ampliar repertório e leitura crítica.", "Linguagens", "literatura", "premium"],
  ["03", "Inglês", "Leitura, contexto e sentido para resolver questões de língua estrangeira.", "Linguagens", "ingles", "premium"],
  ["04", "Espanhol", "Língua, cultura e interpretação para a prova de língua estrangeira.", "Linguagens", "espanhol", "premium"],
  ["05", "Artes", "Linguagens, formas e expressão em diálogo com a matriz do ENEM.", "Linguagens", "artes", "premium"],
  ["06", "Educação Física", "Corpo, cultura e movimento como práticas sociais e temas de prova.", "Linguagens", "educacao-fisica", "premium"],
  ["07", "Tecnologias da Informação e Comunicação", "Redes, mídia e cidadania para ler o mundo conectado.", "Linguagens", "tecnologias-informacao", "premium"],
  ["08", "História", "Tempo, memória e sociedade para conectar processos históricos.", "Humanas", "historia", "essencial"],
  ["09", "Geografia", "Espaço, natureza e território para interpretar relações socioambientais.", "Humanas", "geografia", "premium"],
  ["10", "Filosofia", "Ideias, ética e pensamento para construir argumentos fundamentados.", "Humanas", "filosofia", "premium"],
  ["11", "Sociologia", "Cultura, direitos e relações para analisar a vida em sociedade.", "Humanas", "sociologia", "premium"],
  ["12", "Biologia", "Vida, evolução e ambiente com foco nos conceitos recorrentes do ENEM.", "Natureza", "biologia", "essencial"],
  ["13", "Química", "Matéria, energia e transformações para estudar fenômenos com método.", "Natureza", "quimica", "premium"],
  ["14", "Física", "Movimento, ondas e energia em uma revisão visual e conectada.", "Natureza", "fisica", "premium"],
  ["15", "Matemática", "Números, formas e relações para organizar o raciocínio quantitativo.", "Matemática", "matematica", "essencial"],
  ["16", "Redação", "Tese, argumentação e clareza para estruturar sua produção textual.", "Redação", "redacao", "premium"],
];

export const ebookMaterials: EbookMaterial[] = entries.map(([order, title, description, category, slug, plan]) => ({
  id: `ebook-${order}-${slug}`,
  title,
  description,
  category,
  pages: 34,
  plan,
  cover: `/covers/enem-2026/${order}-${slug}.png`,
  storagePath: `private/ebook-${order}-${slug}-v2.pdf`,
  version: 2,
}));
