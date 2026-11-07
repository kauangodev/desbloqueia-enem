"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";

export const links = [
  ["", "Visão geral", "home"], ["materiais", "Meus materiais", "book"], ["exercicios", "Exercícios", "check"],
  ["simulados", "Simulados", "target"], ["redacao", "Redação (em manutenção)", "pen"], ["cronograma", "Meu cronograma", "calendar"],
  ["checklists", "Fichas e checklists", "list"], ["correcoes", "Minhas correções", "trend"], ["biblioteca", "Biblioteca ENEM", "library"],
  ["conta", "Minha conta", "user"], ["suporte", "Atendimento", "help"],
];

const portalIcons: Record<string, IconName> = { home: "layout-dashboard", book: "book-open", check: "clipboard-check", target: "timer", pen: "pen-line", calendar: "calendar-days", list: "list-checks", trend: "circle-check-big", library: "library", user: "user-round", help: "life-buoy", admin: "shield-check", more: "ellipsis" };
function PortalIcon({ name }: { name: string }) {
  return <Icon name={portalIcons[name] || "layout-dashboard"} size={20} />;
}

export default function PortalNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const active = (slug: string) => path === `/aluno${slug ? "/" + slug : ""}` ? "page" : undefined;
  const mobileLinks = [
    ["", "Início", "home"],
    ["materiais", "Estudar", "book"],
    ["exercicios", "Praticar", "check"],
    ["simulados", "Simulados", "target"],
  ] as const;
  const moreLinks = [
    ["simulados", "Simulados", "target"],
    ["cronograma", "Cronograma", "calendar"],
    ["checklists", "Checklists", "list"],
    ["redacao", "Redação", "pen"],
    ["correcoes", "Correções", "trend"],
    ["biblioteca", "Biblioteca", "library"],
    ["conta", "Minha conta", "user"],
    ["suporte", "Atendimento", "help"],
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
          aria-label={label}
          title={label}
          aria-current={path ===`/aluno${slug ? "/" + slug : ""}` ? "page" : undefined}
        >
          <span className="portal-nav-icon"><PortalIcon name={icon} /></span>
          <span>{label}</span>
        </Link>
      ))}
      {isAdmin ? (
        <Link href="/admin" className="portal-admin-link" aria-label="Administração" title="Administração" aria-current={path === "/admin" ? "page" : undefined}>
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


