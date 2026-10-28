"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const links = [
  ["", "Visão geral", "⌂"],
  ["materiais", "Meus materiais", "▤"],
  ["exercicios", "Exercícios", "✓"],
  ["simulados", "Simulados", "◈"],
  ["redacao", "Redação (em manutenção)", "✎"],
  ["cronograma", "Meu cronograma", "□"],
  ["checklists", "Fichas e checklists", "☷"],
  ["correcoes", "Minhas correções", "↗"],
  ["biblioteca", "Biblioteca ENEM", "◎"],
  ["conta", "Minha conta", "○"],
  ["suporte", "Atendimento", "?"],
];

export default function PortalNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const active = (slug: string) => path === `/aluno${slug ? "/" + slug : ""}` ? "page" : undefined;
  const mobileLinks = [
    ["", "Início", "⌂"],
    ["materiais", "Estudar", "▤"],
    ["exercicios", "Praticar", "✓"],
  ] as const;
  const moreLinks = [
    ["simulados", "Simulados", "◈"],
    ["cronograma", "Cronograma", "□"],
    ["checklists", "Checklists", "☷"],
    ["redacao", "Redação", "✎"],
    ["correcoes", "Correções", "↗"],
    ["biblioteca", "Biblioteca", "◎"],
    ["conta", "Minha conta", "○"],
    ["suporte", "Atendimento", "?"],
  ] as const;
  const renderLink = ([slug, label, icon]: readonly [string, string, string]) => (
    <Link key={slug} href={`/aluno${slug ? "/" + slug : ""}`} aria-current={active(slug)}>
      <span className="portal-nav-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
  return (
    <>
    <nav aria-label="Área do aluno">
      {links.map(([slug, label, icon]) => (
        <Link
          key={slug}
          href={`/aluno${slug ? "/" + slug : ""}`}
          aria-current={path === `/aluno${slug ? "/" + slug : ""}` ? "page" : undefined}
        >
          <span className="portal-nav-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
      {isAdmin ? (
        <Link href="/admin" className="portal-admin-link" aria-current={path === "/admin" ? "page" : undefined}>
          <span className="portal-nav-icon" aria-hidden="true">⌘</span>
          <span>Administração</span>
        </Link>
      ) : null}
    </nav>
    <nav className="portal-mobile-nav" aria-label="Navegação rápida">
      {mobileLinks.map(renderLink)}
      <button type="button" className={moreOpen ? "is-active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
        <span className="portal-nav-icon" aria-hidden="true">•••</span>
        <span>Mais</span>
      </button>
      {moreOpen && <div className="portal-mobile-more">{moreLinks.map(renderLink)}{isAdmin && <Link href="/admin"><span className="portal-nav-icon" aria-hidden="true">⌘</span><span>Administração</span></Link>}</div>}
    </nav>
    </>
  );
}
