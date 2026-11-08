"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["", "Visão geral"], ["plano", "Minha revisão"], ["materiais", "Materiais"], ["questoes", "Questões"], ["treinos", "Treinos e simulado"], ["erros", "Meus erros"], ["formulas", "Fórmulas e conceitos"],
] as const;

export default function OperacaoSubnav({ base }: { base: string }) {
  const path = usePathname();
  const current = (slug: string) => (slug ? path === `${base}/${slug}` || path.startsWith(`${base}/${slug}/`) : path === base);
  return (
    <nav className="op-subnav" aria-label="Seções da Operação 2º Domingo">
      {items.map(([slug, label]) => <Link key={slug} href={slug ? `${base}/${slug}` : base} aria-current={current(slug) ? "page" : undefined}>{label}</Link>)}
    </nav>
  );
}
