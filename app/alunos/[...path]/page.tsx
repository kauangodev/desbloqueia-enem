import { redirect } from "next/navigation";

export default async function LegacyStudentsSubroute({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`/aluno/${path.join("/")}`);
}
