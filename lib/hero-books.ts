import { ebookMaterials } from "./ebook-catalog";

/**
 * Capas reais dos materiais da GoDev usadas na hero (Matemática e Natureza).
 * Fonte única: `ebookMaterials` (mesmos arquivos e títulos do catálogo e da área do aluno). Nada de segundo catálogo.
 */
const slugs = ["matematica", "fisica", "quimica", "biologia"] as const;
export type HeroDiscipline = (typeof slugs)[number];

export type HeroBook = { id: string; slug: HeroDiscipline; title: string; cover: string; cover320: string; cover640: string };

export const heroBooks: HeroBook[] = slugs.map((slug) => {
  // id = "ebook-<ordem>-<slug>": compara o slug inteiro (evita confundir "fisica" com "educacao-fisica")
  const material = ebookMaterials.find((item) => item.id.split("-").slice(2).join("-") === slug);
  if (!material) throw new Error(`Material do catálogo não encontrado: ${slug}`);
  return {
    id: material.id,
    slug,
    title: material.title,
    cover: material.cover,
    cover640: material.cover,
    cover320: material.cover.replace("-640.webp", "-320.webp"),
  };
});

/** Sequência da fileira, do livro mais próximo (frente) para o fundo: Matemática primeiro (foco da campanha). */
export function bookSequence(count: number): HeroBook[] {
  return Array.from({ length: count }, (_, i) => heroBooks[i % heroBooks.length]);
}

/** Proporção real dos arquivos de capa (640 × 960). */
export const COVER_RATIO = 2 / 3;
