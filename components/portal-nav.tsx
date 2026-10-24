"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export const links = [
  ["", "Visão geral"],
  ["materiais", "Meus materiais"],
  ["exercicios", "Exercícios"],
  ["simulados", "Simulados"],
  ["redacao", "Redação"],
  ["cronograma", "Meu cronograma"],
  ["checklists", "Fichas e checklists"],
  ["correcoes", "Minhas correções"],
  ["biblioteca", "Biblioteca ENEM"],
  ["conta", "Minha conta"],
  ["suporte", "Atendimento"],
];
export default function PortalNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Área do aluno">
      {links.map(([slug, label]) => (
        <Link
          key={slug}
          href={`/aluno${slug ? "/" + slug : ""}`}
          aria-current={
            path === `/aluno${slug ? "/" + slug : ""}` ? "page" : undefined
          }
        >
          {label}
        </Link>
      ))}
      {isAdmin ? (
        <Link href="/admin" aria-current={path === "/admin" ? "page" : undefined}>
          Administração
        </Link>
      ) : null}
    </nav>
  );
}
