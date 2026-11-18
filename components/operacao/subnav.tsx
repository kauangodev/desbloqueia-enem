"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  ["", "Visão geral"], ["plano", "Minha revisão"], ["materiais", "Materiais"], ["questoes", "Banco de questões"], ["treinos", "Treinos e simulado"], ["erros", "Meus erros"], ["formulas", "Fórmulas e conceitos"],
] as const;

/**
 * Navegação local da Operação. Em telas largas: abas discretas. Em telas estreitas: um botão "Seções" que abre a lista
 * (fecha com Esc ou ao escolher, devolvendo o foco ao botão).
 */
export default function OperacaoSubnav({ base }: { base: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const current = (slug: string) => (slug ? path === `${base}/${slug}` || path.startsWith(`${base}/${slug}/`) : path === base);
  const label = items.find(([slug]) => current(slug))?.[1] ?? "Visão geral";
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const links = items.map(([slug, text]) => (
    <Link key={slug} href={slug ? `${base}/${slug}` : base} aria-current={current(slug) ? "page" : undefined} onClick={() => setOpen(false)}>{text}</Link>
  ));
  return (
    <>
      <nav className="op-subnav op-subnav-wide" aria-label="Seções de Matemática e Natureza">{links}</nav>
      <div className="op-subnav-compact">
        <button ref={button} type="button" className="op-subnav-toggle" aria-expanded={open} aria-controls="op-subnav-list" onClick={() => setOpen((value) => !value)}>
          <span>Seções de Matemática e Natureza</span><strong>{label}</strong>
        </button>
        {open ? <nav id="op-subnav-list" className="op-subnav-list" aria-label="Seções de Matemática e Natureza">{links}</nav> : null}
      </div>
    </>
  );
}
