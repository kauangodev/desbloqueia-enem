import Link from "next/link";

/** Aviso padrão quando o plano Grátis pede conteúdo do Essencial (sem expor o conteúdo). */
export default function FreeLocked({ what }: { what: string }) {
  return (
    <section className="as-empty" role="status">
      <h2>{what} faz parte do plano Essencial</h2>
      <p className="as-muted">No plano Grátis você tem a unidade introdutória da Trilha e as questões dela. Quando quiser mais, veja os planos.</p>
      <Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link>
    </section>
  );
}