import { identity, canAccess } from "../../../../lib/supabase";
import { notFound } from "next/navigation";
import PdfReader from "../../../../components/pdf-reader";
import { officialMaterials } from "../../../../data/official-exams";
export default async function Read({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const who = await identity();
  if (!who) return null;
  const { id } = await params;
  const { data: m } = await who.db
    .from("materials")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  const material = m || officialMaterials.find((item) => item.id === id);
  if (!material || !(await canAccess(material.plan))) notFound();
  const { data: p } = await who.db
    .from("reading_progress")
    .select("page")
    .eq("material_id", id)
    .eq("user_id", who.user.id)
    .maybeSingle();
  return (
    <>
      <h1 className="page-title">{material.title}</h1>
      <p>{material.description}</p>
      <PdfReader
        id={id}
        initialPage={p?.page || 1}
        downloadable={material.downloadable}
      />
    </>
  );
}
