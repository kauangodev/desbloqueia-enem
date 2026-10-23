import { materials } from "../../lib/config";

const heroCoverById: Record<string, string> = {
  guia: "/covers/editorial-v3/guia.jpg",
  linguagens: "/covers/editorial-v3/linguagens.jpg",
  humanas: "/covers/editorial-v3/humanas.jpg",
  natureza: "/covers/editorial-v3/natureza.jpg",
  matematica: "/covers/editorial-v3/matematica.jpg",
  kit: "/covers/editorial-v3/kit.jpg",
};

export const heroMaterials = materials.map((material) => ({
  id: material.id,
  title: material.title,
  image: heroCoverById[material.id] ?? material.cover,
  description: `Ilustração editorial de ${material.title}`,
  subject: material.category,
}));

