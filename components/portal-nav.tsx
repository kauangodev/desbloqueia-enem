"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const links = [
  ["", "Visão geral", "home"], ["materiais", "Meus materiais", "book"], ["exercicios", "Exercícios", "check"],
  ["simulados", "Simulados", "target"], ["redacao", "Redação (em manutenção)", "pen"], ["cronograma", "Meu cronograma", "calendar"],
  ["checklists", "Fichas e checklists", "list"], ["correcoes", "Minhas correções", "trend"], ["biblioteca", "Biblioteca ENEM", "library"],
  ["conta", "Minha conta", "user"], ["suporte", "Atendimento", "help"],
];

function PortalIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M4 11.5 12 4l8 7.5M6.5 10v9h11v-9M9.5 19v-5h5v5",
    book: "M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5zM5 4.5v17M8.5 6H15",
    check: "m5 12 4 4L19 6",
    target: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3.5v1",
    pen: "m14 5 5 5M5 19l1.2-4.1L15.8 5.3a1.8 1.8 0 0 1 2.5 0l.4.4a1.8 1.8 0 0 1 0 2.5L9.1 17.8z",
    calendar: "M5 5h14v14H5zM8 3v4M16 3v4M5 9h14",
    list: "M6 6h12M6 12h12M6 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01",
    trend: "M5 17 10 12l3 3 6-7M15 8h4v4",
    library: "M5 5h14v14H5zM8 8h8M8 12h8M8 16h5",
    user: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0",
    help: "M9.5 9a2.7 2.7 0 1 1 4.2 2.2c-1.1.7-1.7 1.2-1.7 2.3M12 17h.01M5 4h14v16H5z",
    admin: "M12 3 20 7v5c0 4.6-3.1 7.5-8 9-4.9-1.5-8-4.4-8-9V7zM9 12l2 2 4-4",
    more: "M6 12h.01M12 12h.01M18 12h.01",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.home} /></svg>;
}

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
    <span className="portal-nav-icon"><PortalIcon name={icon} /></span>
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
          <span className="portal-nav-icon"><PortalIcon name={icon} /></span>
          <span>{label}</span>
        </Link>
      ))}
      {isAdmin ? (
        <Link href="/admin" className="portal-admin-link" aria-current={path === "/admin" ? "page" : undefined}>
          <span className="portal-nav-icon"><PortalIcon name="admin" /></span>
          <span>Administração</span>
        </Link>
      ) : null}
    </nav>
    <nav className="portal-mobile-nav" aria-label="Navegação rápida">
      {mobileLinks.map(renderLink)}
      <button type="button" className={moreOpen ? "is-active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
        <span className="portal-nav-icon"><PortalIcon name="more" /></span>
        <span>Mais</span>
      </button>
      {moreOpen && <div className="portal-mobile-more">{moreLinks.map(renderLink)}{isAdmin && <Link href="/admin"><span className="portal-nav-icon"><PortalIcon name="admin" /></span><span>Administração</span></Link>}</div>}
    </nav>
    </>
  );
}
