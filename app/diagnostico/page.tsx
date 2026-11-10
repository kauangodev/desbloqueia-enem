import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** O diagnóstico/quiz foi removido: leva direto à landing page. */
export default function Diagnostico() {
  redirect("/landing");
}
