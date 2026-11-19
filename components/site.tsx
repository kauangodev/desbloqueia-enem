"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CookiePreferencesLink from "./cookie-preferences-link";
import ThemeToggle from "./theme-toggle";
import { features } from "../lib/features";
import "../app/public-theme.css";
/** Logo tradicional da GoDev Education (wordmark + EDUCAÇÃO), mantido como estava; só a cor se adapta ao fundo. */
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-wordmark">GoDev</span>{" "}
      <span className="brand-sub">EDUCAÇÃO</span>
      <span className="sr-only"> — ir para o início</span>
    </Link>
  );
}
const NAV_LINKS: [string, string][] = [
  ["Como funciona", "/landing#beneficios"],
  ["Recursos", "/landing#trilha"],
  ["Planos", "/landing#ofertas"],
  ["Dúvidas", "/landing#duvidas"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const firstLink = useRef<HTMLAnchorElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // Fecha o menu e rola suavemente até a seção quando já estamos na landing (mantém utm/fbclid na URL).
  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    const id = href.split("#")[1];
    const target = id ? document.getElementById(id) : null;
    if (!target || window.location.pathname !== "/landing") return;
    event.preventDefault(); // fechar o menu (setOpen acima) já restaura a rolagem no efeito de limpeza
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    });
  };
  // Cabeçalho que recolhe ao descer e volta ao subir (celular). A barra de progresso decorativa foi retirada.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const el = headerRef.current;
      if (el && Math.abs(y - last) > 6) {
        if (y > last && y > 140) el.dataset.hidden = "true";
        else if (y < last || y <= 80) el.dataset.hidden = "false";
        last = y;
      }
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Destaca no menu a seção que está na tela.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const targets = NAV_LINKS.map(([, href]) => document.getElementById(href.split("#")[1])).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-40% 0px -55% 0px" });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    firstLink.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <header className="site-header" ref={headerRef} data-hidden="false">
      <span className="theme-public" hidden />
      <div className="container header-inner">
        <Brand />
        {open && <button className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
        <nav
          aria-label="Navegação principal"
          className={open ? "nav open" : "nav"}
        >
          <div className="nav-extra nav-theme"><ThemeToggle /></div>
          {NAV_LINKS.map(([label, href], index) => (
            <Link key={href} href={href} ref={index === 0 ? firstLink : undefined} onClick={(event) => goTo(event, href)} aria-current={active === href.split("#")[1] ? "true" : undefined}>
              {label}
            </Link>
          ))}
          <Link className="nav-extra nav-cta" href="/landing#ofertas" onClick={(event) => goTo(event, "/landing#ofertas")}>Quero escolher meu plano</Link>
          <Link className="nav-extra nav-login" href="/entrar" onClick={() => setOpen(false)}>Já tenho acesso · Entrar</Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle className="header-theme" />
          <Link href="/entrar" className="login-link">
            Entrar
          </Link>
          {features.gratis ? <Link href="/entrar?modo=cadastro" className="header-cta" data-signup="header">Começar grátis</Link> : null}
          <button
            ref={toggle}
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d={open ? "M6 6l12 12M6 18 18 6" : "M4 7h16M4 12h16M4 17h16"}
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer gd-footer">
      <div className="container footer-grid">
        <div className="gd-footer-brand">
          <Brand />
          <p>Seu estudo com direção.</p>
        </div>
        <nav className="gd-footer-links" aria-label="Rodapé">
          <Link href="/suporte">Atendimento</Link>
          <Link href="/politicas/privacidade">Privacidade</Link>
          <Link href="/politicas/termos">Termos</Link>
          <Link href="/politicas/reembolso">Reembolsos</Link>
          <Link href="/landing#ofertas">Planos</Link>
          <Link href="/entrar">Área do aluno</Link>
          <CookiePreferencesLink />
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} GoDev Education. Material independente, sem vínculo com INEP ou MEC.</span>
        <ThemeToggle className="footer-theme" />
      </div>
    </footer>
  );
}
