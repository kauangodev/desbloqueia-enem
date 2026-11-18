"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { features } from "../lib/features";

type Item = { href: string; label: string; icon: IconName; badge?: string };
type Group = { id: string; title?: string; items: Item[] };

const OP = "/aluno/matematica-natureza";

/**
 * Estrutura do menu do aluno: Início e Dashboard no topo, depois Praticar, Estudar, Acompanhar e Conta.
 * Tudo aponta para rotas que existem; o item ativo é sempre o de caminho mais específico.
 */
export const navGroups: Group[] = [
  { id: "inicio", items: [
    { href: "/aluno", label: "Início", icon: "layout-dashboard" },
    { href: "/aluno/dashboard", label: "Dashboard", icon: "trending-up" },
  ] },
  { id: "praticar", title: "Praticar", items: [
    { href: "/aluno/treino-rapido", label: "Treino rápido", icon: "zap" },
    { href: `${OP}/questoes`, label: "Banco de questões", icon: "clipboard-check" },
    { href: "/aluno/simulados", label: "Simulados", icon: "timer" },
    { href: `${OP}/erros`, label: "Meus erros", icon: "notebook-pen" },
    ...(features.redacao ? [{ href: "/aluno/redacao", label: "Redação", icon: "pen-line" } as Item] : []),
  ] },
  { id: "estudar", title: "Estudar", items: [
    { href: "/aluno/trilha", label: "Trilha ENEM", icon: "target" },
    { href: "/aluno/materiais", label: "Meus materiais", icon: "book-open" },
    { href: OP, label: "Matemática e Natureza", icon: "zap" },
    { href: `${OP}/plano`, label: "Minha revisão", icon: "calendar-days" },
    { href: "/aluno/flash-cards", label: "Flash cards", icon: "rotate-ccw" },
    { href: "/aluno/checklists", label: "Fichas e checklists", icon: "list-checks" },
    { href: "/aluno/biblioteca", label: "Biblioteca ENEM", icon: "library" },
  ] },
  { id: "acompanhar", title: "Acompanhar", items: [
    { href: "/aluno/missoes", label: "Missões", icon: "trending-up" },
    { href: "/aluno/ofensiva", label: "Ofensiva", icon: "flame" },
    { href: "/aluno/correcoes", label: "Minhas correções", icon: "circle-check-big" },
    { href: "/aluno/cronograma", label: "Meu cronograma", icon: "calendar-days" },
  ] },
  { id: "conta", title: "Conta", items: [
    { href: "/aluno/planos", label: "Planos", icon: "star" },
    { href: "/aluno/conta", label: "Minha conta", icon: "user-round" },
    { href: "/aluno/suporte", label: "Atendimento", icon: "life-buoy" },
  ] },
];

export const links = navGroups.flatMap((group) => group.items);

/** Item mais específico que casa com o caminho atual (evita marcar "Início" e "Operação" ao mesmo tempo). */
export function activeHref(path: string) {
  const match = links.filter((item) => (item.href === "/aluno" ? path === "/aluno" : path === item.href || path.startsWith(`${item.href}/`)));
  return match.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

const mobileMain: Item[] = [
  { href: "/aluno", label: "Início", icon: "layout-dashboard" },
  { href: "/aluno/treino-rapido", label: "Treinar", icon: "zap" },
  { href: "/aluno/materiais", label: "Estudar", icon: "book-open" },
  { href: "/aluno/missoes", label: "Missões", icon: "trending-up" },
];

export default function PortalNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const current = activeHref(path);
  const aria = (href: string) => (current === href ? "page" : undefined);
  const moreLinks = links.filter((item) => !mobileMain.some((main) => main.href === item.href));
  const renderLink = (item: Item) => (
    <Link key={item.href} href={item.href} aria-current={aria(item.href)} onClick={() => setMoreOpen(false)}>
      <span className="portal-nav-icon"><Icon name={item.icon} size={20} /></span>
      <span>{item.label}</span>
      {item.badge ? <span className="portal-nav-badge">{item.badge}</span> : null}
    </Link>
  );
  return (
    <>
      <nav aria-label="Área do aluno">
        {navGroups.map((group) => (
          <div key={group.id} className="portal-nav-section" role="group" aria-label={group.title}>
            {group.title ? <p className="portal-nav-group" aria-hidden="true">{group.title}</p> : null}
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} aria-current={aria(item.href)} title={item.label}>
                <span className="portal-nav-icon"><Icon name={item.icon} size={20} /></span>
                <span>{item.label}</span>
                {item.badge ? <span className="portal-nav-badge" aria-hidden="true">{item.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
        {isAdmin ? (
          <div className="portal-nav-section">
            <Link href="/admin" className="portal-admin-link" title="Administração" aria-current={path === "/admin" ? "page" : undefined}>
              <span className="portal-nav-icon"><Icon name="shield-check" size={20} /></span>
              <span>Administração</span>
            </Link>
          </div>
        ) : null}
      </nav>
      <nav className="portal-mobile-nav" aria-label="Navegação rápida">
        {mobileMain.map(renderLink)}
        <button type="button" className={moreOpen ? "is-active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
          <span className="portal-nav-icon"><Icon name="ellipsis" size={20} /></span>
          <span>Mais</span>
        </button>
        {moreOpen ? (
          <div className="portal-mobile-more">
            {moreLinks.map(renderLink)}
            {isAdmin ? <Link href="/admin" onClick={() => setMoreOpen(false)}><span className="portal-nav-icon"><Icon name="shield-check" size={20} /></span><span>Administração</span></Link> : null}
          </div>
        ) : null}
      </nav>
    </>
  );
}
