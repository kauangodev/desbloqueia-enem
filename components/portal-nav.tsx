"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { features } from "../lib/features";

const allLinks = [
  ["", "Visão geral", "home"], ["operacao-segundo-domingo", "Operação 2º Domingo", "zap"], ["materiais", "Meus materiais", "book"], ["exercicios", "Exercícios", "check"],
  ["simulados", "Simulados", "target"], ...(features.redacao ? [["redacao", "Redação", "pen"]] : []), ["cronograma", "Meu cronograma", "calendar"],
  ["checklists", "Fichas e checklists", "list"], ["correcoes", "Minhas correções", "trend"], ["biblioteca", "Biblioteca ENEM", "library"],
  ["conta", "Minha conta", "user"], ["suporte", "Atendimento", "help"],
];
export const links = allLinks;

const portalIcons: Record<string, IconName> = { home: "layout-dashboard", book: "book-open", check: "clipboard-check", target: "timer", pen: "pen-line", calendar: "calendar-days", list: "list-checks", trend: "circle-check-big", library: "library", user: "user-round", help: "life-buoy", admin: "shield-check", more: "ellipsis", zap: "zap" };
const OPERACAO = "operacao-segundo-domingo";
function PortalIcon({ name }: { name: string }) {
  return <Icon name={portalIcons[name] || "layout-dashboard"} size={20} />;
}

export default function PortalNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isCurrent = (slug: string) => (slug === OPERACAO ? path === `/aluno/${slug}` || path.startsWith(`/aluno/${slug}/`) : path === `/aluno${slug ? "/" + slug : ""}`);
  const active = (slug: string) => (isCurrent(slug) ? "page" : undefined);
  const mobileLinks = [
    ["", "Início", "home"],
    ["materiais", "Estudar", "book"],
    ["exercicios", "Praticar", "check"],
    ["simulados", "Simulados", "target"],
  ] as const;
  const moreLinks = [
    ["operacao-segundo-domingo", "Operação 2º Domingo", "zap"],
    ["simulados", "Simulados", "target"],
    ...(features.redacao ? [["redacao", "Redação", "pen"] as const] : []),
    ["cronograma", "Cronograma", "calendar"],
    ["checklists", "Checklists", "list"],
    ["correcoes", "Correções", "trend"],
    ["biblioteca", "Biblioteca", "library"],
    ["conta", "Minha conta", "user"],
    ["suporte", "Atendimento", "help"],
  ] as const;
  const renderLink = ([slug, label, icon]: readonly [string, string, string]) => (
    <Link key={slug} href={`/aluno${slug ? "/" + slug : ""}`} className={slug === OPERACAO ? "portal-nav-op" : undefined} aria-current={active(slug)}>
    <span className="portal-nav-icon"><PortalIcon name={icon} /></span>
      <span>{label}</span>
      {slug === OPERACAO ? <span className="portal-nav-badge">Reta final</span> : null}
    </Link>
  );
  return (
    <>
    <nav aria-label="Área do aluno">
      {links.map(([slug, label, icon]) => (
        <Link
          key={slug}
          href={`/aluno${slug ? "/" + slug : ""}`}
          className={slug === OPERACAO ? "portal-nav-op" : undefined}
          aria-label={slug === OPERACAO ? `${label} — reta final` : label}
          title={slug === OPERACAO ? `${label} — reta final` : label}
          aria-current={active(slug)}
        >
          <span className="portal-nav-icon"><PortalIcon name={icon} /></span>
          <span>{label}</span>
          {slug === OPERACAO ? <span className="portal-nav-badge" aria-hidden="true">Reta final</span> : null}
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


