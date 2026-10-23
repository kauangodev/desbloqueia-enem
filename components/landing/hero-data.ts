import { materials } from "../../lib/config";

const heroCoverById: Record<string, string> = {
  guia: "/covers/editorial-v3/guia.png",
  linguagens: "/covers/editorial-v3/linguagens.png",
  humanas: "/covers/editorial-v3/humanas.png",
  natureza: "/covers/editorial-v3/natureza.png",
  matematica: "/covers/editorial-v3/matematica.png",
  kit: "/covers/editorial-v3/kit.png",
};

export const heroMaterials = materials.map((material) => ({
  id: material.id,
  title: material.title,
  image: heroCoverById[material.id] ?? material.cover,
  description: `Ilustração editorial de ${material.title}`,
  subject: material.category,
}));

