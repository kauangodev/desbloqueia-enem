"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { materials } from "../lib/config";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="GoDev Education, início">
      <b>
        GoDev<span>.</span>
      </b>
      <span className="brand-sub">EDUCATION</span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav
          aria-label="Navegação principal"
          className={open ? "nav open" : "nav"}
        >
          {[
            ["O Kit", "/#kit"],
            ["Materiais", "/#materiais"],
            ["Planos", "/#planos"],
            ["Dúvidas", "/#duvidas"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/entrar" className="login-link">
            Entrar
          </Link>
          <button
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
          <Link href="/#materiais">Conheça os materiais</Link>
          <Link href="/#planos">Compare os planos</Link>
          <Link href="/entrar">Área do aluno</Link>
        </div>
        <div>
          <b>Conte com a gente</b>
          <Link href="/suporte">Atendimento</Link>
          <Link href="/politicas/reembolso">Reembolsos</Link>
          <Link href="/politicas/privacidade">Privacidade</Link>
          <Link href="/politicas/termos">Termos de uso</Link>
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
  const tabs = useRef<HTMLDivElement>(null);
  const material = materials[active];
  function selectTab(index: number, focus = false) {
    setActive(index);
    const container = tabs.current;
    const tab = container?.querySelectorAll<HTMLButtonElement>("[role=tab]")[index];
    if (!container || !tab) return;
    if (focus) tab.focus({ preventScroll: true });
    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: tab.offsetLeft - container.offsetLeft - (container.clientWidth - tab.offsetWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }
  return (
    <div className="material-explorer">
      <div className="material-index-shell">
        <div className="material-index-heading">
          <span>Explore por área</span>
          <small>
            {String(active + 1).padStart(2, "0")} / {String(materials.length).padStart(2, "0")}
          </small>
        </div>
        <div
          className="material-index"
          ref={tabs}
          role="tablist"
          aria-label="Cadernos de estudo"
          onKeyDown={(event) => {
            let next = active;
            if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (active + 1) % materials.length;
            else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (active - 1 + materials.length) % materials.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = materials.length - 1;
            else return;
            event.preventDefault();
            selectTab(next, true);
          }}
        >
          {materials.map((item, i) => (
            <button
              role="tab"
              id={`tab-${item.id}`}
              aria-controls="material-panel"
              aria-selected={active === i}
              aria-current={active === i ? "true" : undefined}
              tabIndex={active === i ? 0 : -1}
              key={item.id}
              onClick={() => selectTab(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{item.title}</b>
              <small>{item.category}</small>
            </button>
          ))}
        </div>
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
          <span className="cover-title preview-cover-title" aria-hidden="true">
            {material.title}
          </span>
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
    "O acesso é pela área do aluno, com o mesmo e-mail usado na compra. As vendas estão em preparação; quando abertas, apenas pagamentos confirmados liberarão o plano adquirido.",
  ],
  [
    "Qual é a diferença entre os planos?",
    "O Essencial reúne revisão, cronograma e exercícios. O Premium acrescenta simulados, redação e a biblioteca histórica. Compare os itens na seção de planos.",
  ],
  [
    "Posso estudar pelo celular?",
    "Sim. A plataforma se adapta ao celular, tablet e computador. O leitor oferece navegação entre páginas, zoom e retomada da leitura.",
  ],
  [
    "Os materiais são PDFs? Posso baixar?",
    "Os materiais são digitais em PDF. Downloads ficam disponíveis na área do aluno quando autorizados para o material e seu plano. As imagens desta página mostram as capas reais.",
  ],
  [
    "A biblioteca tem 1.800 resoluções?",
    "Não. São 1.800 posições de questões de 2016 a 2025, com links para provas oficiais e fontes externas. O acervo recebido inclui sete resoluções autorais; os demais itens indicam suas pendências.",
  ],
  [
    "Preciso criar uma senha?",
    "O acesso usa um link seguro enviado ao seu e-mail. Se o link expirar, você poderá solicitar outro em Entrar. O serviço de envio será ativado antes da abertura das vendas.",
  ],
  [
    "Como funciona a garantia?",
    "Você tem sete dias após a compra para solicitar reembolso. A política de reembolso explica os canais e o que acontece com o acesso ao material.",
  ],
  [
    "Como falar com o atendimento?",
    "A página Atendimento reúne nossos canais oficiais. Você também pode escrever para kauango.dev@gmail.com com o e-mail da compra e sua dúvida. Nunca envie sua senha ou dados do cartão.",
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
