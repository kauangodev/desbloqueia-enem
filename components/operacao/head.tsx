"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  plano: "Minha revisão", materiais: "Materiais", questoes: "Banco de questões", treinos: "Treinos e simulado", erros: "Meus erros", formulas: "Fórmulas e conceitos",
};

/**
 * Cabeçalho da Operação: na visão geral o título é o do programa; nas ferramentas o H1 é o da ferramenta
 * ("Banco de questões", "Meus erros"…) e o programa vira contexto (trilha de navegação).
 */
export default function OperacaoHead({ base, name, subtitle, note }: { base: string; name: string; subtitle: string; note?: string }) {
  const path = usePathname();
  const slug = path.startsWith(`${base}/`) ? path.slice(base.length + 1).split("/")[0] : "";
  const section = titles[slug];
  if (!section) {
    return (
      <header className="op-head2">
        <h1>{name}</h1>
        <p className="op-head2-sub">{subtitle}</p>
        {note ? <p className="op-head2-note" role="status">{note}</p> : null}
      </header>
    );
  }
  return (
    <header className="op-head2">
      <nav aria-label="Você está em" className="op-crumb"><Link href={base}>{name}</Link><span aria-hidden="true"> / </span><span aria-current="page">{section}</span></nav>
      <h1>{section}</h1>
    </header>
  );
}
