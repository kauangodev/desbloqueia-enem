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
  ["biblioteca", "Biblioteca ENEM"],
  ["conta", "Minha conta"],
  ["suporte", "Atendimento"],
];
export default function PortalNav() {
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
    </nav>
  );
}
