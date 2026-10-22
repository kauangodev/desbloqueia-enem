import { materials } from "../../lib/config";

const heroCoverById: Record<string, string> = {
  guia: "/covers/hero-v2/guia.png",
  linguagens: "/covers/hero-v2/linguagens.png",
  humanas: "/covers/hero-v2/humanas.png",
  natureza: "/covers/hero-v2/natureza.png",
  matematica: "/covers/hero-v2/matematica.png",
  kit: "/covers/hero-v2/kit.png",
};

export const heroMaterials = materials.map((material) => ({
  id: material.id,
  title: material.title,
  image: heroCoverById[material.id] ?? material.cover,
  description: `Ilustração editorial de ${material.title}`,
  subject: material.category,
}));

