import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** O quiz inicial foi removido: a raiz leva direto à landing page. */
export default function Home() {
  redirect("/landing");
}
