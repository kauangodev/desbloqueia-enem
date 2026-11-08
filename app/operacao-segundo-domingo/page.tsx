import { redirect } from "next/navigation";
import { operacao } from "../../lib/operacao/config";
import { identity } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/** Endereço estável para anúncios: leva ao conteúdo logado, ou ao login preservando o destino. */
export default async function OperacaoAlias() {
  const who = await identity();
  if (!who) redirect(`/entrar?redirect=${encodeURIComponent(operacao.basePath)}`);
  redirect(operacao.basePath);
}
