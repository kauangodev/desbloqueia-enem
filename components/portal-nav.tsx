"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
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
  );
}
