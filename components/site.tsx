"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { materials } from "../lib/config";
import CookiePreferencesLink from "./cookie-preferences-link";
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
  ["Amostra", "/landing#amostra"],
  ["Planos", "/landing#ofertas"],
  ["Acesso", "/landing#acesso"],
  ["Dúvidas", "/landing#duvidas"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const firstLink = useRef<HTMLAnchorElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  // Fecha o menu e rola suavemente até a seção quando já estamos na landing (mantém utm/fbclid na URL).
  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    const id = href.split("#")[1];
    const target = id ? document.getElementById(id) : null;
    if (!target || window.location.pathname !== "/landing") return;
    event.preventDefault();
    document.body.style.overflow = "";
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    });
  };
  // Barra de progresso de leitura e cabeçalho que recolhe ao descer e volta ao subir (celular).
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)) : 0})`;
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
      <span className="scroll-progress" ref={bar} aria-hidden="true" />
      <div className="container header-inner">
        <Brand />
        {open && <button className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
        <nav
          aria-label="Navegação principal"
          className={open ? "nav open" : "nav"}
        >
          {NAV_LINKS.map(([label, href], index) => (
            <Link key={href} href={href} ref={index === 0 ? firstLink : undefined} onClick={(event) => goTo(event, href)} aria-current={active === href.split("#")[1] ? "true" : undefined}>
              {label}
            </Link>
          ))}
          <Link className="nav-extra nav-cta" href="/landing#ofertas" onClick={(event) => goTo(event, "/landing#ofertas")}>Quero escolher meu plano</Link>
          <Link className="nav-extra nav-login" href="/entrar" onClick={() => setOpen(false)}>Já tenho acesso · Entrar</Link>
        </nav>
        <div className="header-actions">
          <Link href="/entrar" className="login-link">
            Entrar
          </Link>
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
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            Conhecimento com direção.
            <br />
            Tecnologia a favor do seu estudo.
          </p>
        </div>
        <div>
          <b>Desbloqueia ENEM</b>
          <Link href="/landing#amostra">Conheça os materiais</Link>
          <Link href="/landing#ofertas">Compare os planos</Link>
          <Link href="/entrar">Área do aluno</Link>
        </div>
        <div>
          <b>Conte com a gente</b>
          <Link href="/suporte">Atendimento</Link>
          <Link href="/politicas/reembolso">Reembolsos</Link>
          <Link href="/politicas/privacidade">Privacidade</Link>
          <Link href="/politicas/termos">Termos de uso</Link>
          <CookiePreferencesLink />
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 GoDev Education</span>
        <span>Material independente. Sem vínculo com INEP ou MEC.</span>
      </div>
    </footer>
  );
}
export function MaterialPreview() {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tabs = useRef<HTMLDivElement>(null);
  const material = materials[active];
  const featuredMaterials = [0, 1, 2, 3, 7, 8, 11, 14].map((index) => materials[index]);
  const visibleMaterials = expanded ? materials : featuredMaterials;
  function selectTab(index: number, focus = false, materialIndex = index) {
    setActive(materialIndex);
    const container = tabs.current;
    const tab = container?.querySelectorAll<HTMLButtonElement>("[role=tab]")[index];
    if (!container || !tab) return;
    if (focus) requestAnimationFrame(() => tab.focus({ preventScroll: true }));
    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: tab.offsetLeft - container.offsetLeft - (container.clientWidth - tab.offsetWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }
  function moveCatalog(direction: -1 | 1) {
    const container = tabs.current;
    if (!container) return;
    const max = container.scrollWidth - container.clientWidth;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (direction > 0 && container.scrollLeft >= max - 8) {
      container.scrollTo({ left: 0, behavior });
      return;
    }
    if (direction < 0 && container.scrollLeft <= 8) {
      container.scrollTo({ left: max, behavior });
      return;
    }
    container.scrollBy({ left: direction * Math.max(container.clientWidth * 0.78, 220), behavior });
  }
  return (
    <div className="material-explorer">
      <div className="material-index-shell">
        <div className="material-index-heading">
          <span>Catálogo didático</span>
          <small>
            {visibleMaterials.length} de {materials.length} materiais
          </small>
        </div>
        <div className="material-carousel-shell">
          <button className="catalog-arrow catalog-arrow-previous" type="button" aria-label="Materiais anteriores" onClick={() => moveCatalog(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div
            className="material-index"
            ref={tabs}
            role="tablist"
            aria-label="Cadernos de estudo"
            onKeyDown={(event) => {
            let next = active;
            const currentPosition = Math.max(0, visibleMaterials.findIndex((item) => item.id === material.id));
            if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (currentPosition + 1) % visibleMaterials.length;
            else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (currentPosition - 1 + visibleMaterials.length) % visibleMaterials.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = visibleMaterials.length - 1;
            else return;
            event.preventDefault();
            selectTab(next, true, materials.findIndex((item) => item.id === visibleMaterials[next].id));
            }}
          >
            {visibleMaterials.map((item, i) => (
            <button
              role="tab"
              id={`tab-${item.id}`}
              aria-controls="material-panel"
              aria-selected={active === materials.findIndex((materialEntry) => materialEntry.id === item.id)}
              aria-current={active === materials.findIndex((materialEntry) => materialEntry.id === item.id) ? "true" : undefined}
              tabIndex={active === materials.findIndex((materialEntry) => materialEntry.id === item.id) ? 0 : -1}
              key={item.id}
              onClick={() => selectTab(i, false, materials.findIndex((materialEntry) => materialEntry.id === item.id))}
            >
              <Image src={item.cover} width={160} height={226} alt="" aria-hidden="true" />
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{item.title}</b>
              <small>{item.category}</small>
            </button>
            ))}
          </div>
          <button className="catalog-arrow catalog-arrow-next" type="button" aria-label="Próximos materiais" onClick={() => moveCatalog(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        {!expanded && (
          <button className="catalog-expand" type="button" onClick={() => setExpanded(true)}>
            Ver os {materials.length} materiais
          </button>
        )}
      </div>
      <div
        className="material-stage"
        role="tabpanel"
        id="material-panel"
        aria-labelledby={`tab-${material.id}`}
      >
        <div className="preview-paper" key={material.id}>
          <Image
            src={material.cover}
            width={330}
            height={467}
            alt={`Capa real: ${material.title}`}
          />
        </div>
        <div className="preview-caption">
          <div>
            <b>{material.title}</b>
            <p>{material.description}</p>
          </div>
          <span>
            {material.pages} páginas
            <br />
            Capa do material
          </span>
        </div>
      </div>
    </div>
  );
}
const faqs = [
  [
    "Como vou acessar meus materiais?",
    "O acesso é pela área do aluno, com o mesmo e-mail usado na compra. A Cakto processa o pagamento e somente compras confirmadas liberam o plano adquirido. No primeiro acesso, use “Primeiro acesso” para criar sua senha.",
  ],
  [
    "Qual é a diferença entre os planos?",
    "Os dois incluem a Operação 2º Domingo inteira (600 questões comentadas de Matemática e Natureza, 5 simulados de 90 questões, 11 treinos e as revisões), além de Minha revisão e caderno de erros. O Essencial traz 4 e-books (Língua Portuguesa, História, Biologia e Matemática). O Premium traz os 16 e-books, incluindo Física, Química e Redação, o banco geral com 30 simulados, a biblioteca histórica e as fichas e checklists. Veja a tabela de comparação.",
  ],
  [
    "Posso estudar pelo celular?",
    "Sim. A plataforma se adapta ao celular, tablet e computador. O leitor oferece navegação entre páginas, zoom e retomada da leitura.",
  ],
  [
    "Os materiais são PDFs? Posso baixar?",
    "Os materiais são digitais em PDF. A leitura acontece dentro do leitor protegido da área do aluno, com navegação, zoom e tela cheia; o download direto não fica disponível. As imagens desta página mostram as capas reais.",
  ],
  [
    "A biblioteca tem 1.800 questões?",
    "Sim. A biblioteca organiza 1.800 questões de referência, separadas por ano e área, com links para as fontes oficiais. Ela é um índice de estudo e não promete 1.800 resoluções autorais.",
  ],
  [
    "Preciso criar uma senha?",
    "Após a compra aprovada, use o mesmo e-mail da Cakto para criar sua senha e entrar na área de alunos. Se precisar, você poderá redefinir a senha pela tela de acesso.",
  ],
  [
    "Quanto vou pagar?",
    "Essencial: R$ 10,90 + R$ 0,99 de taxa do checkout = R$ 11,89. Premium: R$ 19,90 + R$ 0,99 = R$ 20,89. É pagamento único, sem mensalidade, e o total é o mesmo que aparece na tela de pagamento da Cakto.",
  ],
  [
    "Paguei e o acesso não apareceu. E agora?",
    "O plano é liberado quando a Cakto confirma o pagamento. Pagou e não consegue entrar? Fale com o atendimento informando o e-mail da compra e o comprovante. Nunca envie senha ou dados do cartão.",
  ],
  [
    "Digitei o e-mail errado na compra.",
    "O plano fica vinculado ao e-mail informado no pagamento. Fale com o atendimento, com o comprovante, o e-mail digitado e o e-mail correto, para avaliarmos a correção.",
  ],
  [
    "Como funciona a garantia?",
    "Você tem sete dias após a compra para solicitar reembolso, pelo atendimento ou pelo comprovante da Cakto. A política de reembolso explica o passo a passo e o que acontece com o acesso ao material.",
  ],
  [
    "Como falar com o atendimento?",
    "Pela página Atendimento, sem precisar entrar na plataforma. Informe o e-mail usado na compra e descreva sua dúvida. Nunca envie sua senha ou dados do cartão.",
  ],
];
export function FAQ() {
  return (
    <div className="faq-list">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}




