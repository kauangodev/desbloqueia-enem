import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** A raiz leva à landing page e preserva utm/fbclid, que os anúncios usam para atribuir a venda. */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  const qs = query.toString();
  redirect(qs ? `/landing?${qs}` : "/landing");
}
