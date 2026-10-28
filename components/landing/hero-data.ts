import { materials } from "../../lib/config";

export const heroMaterials = materials.map((material) => ({
  id: material.id,
  title: material.title,
  image: material.cover,
  description: `Ilustração editorial de ${material.title}`,
  subject: material.category,
}));

