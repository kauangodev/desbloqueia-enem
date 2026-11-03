"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PremiumOfferModalProps = {
  enabled: boolean;
  delayMs: number;
  trigger?: "load" | "demo-report";
  cooldownDays: number;
  campaignId: string;
  checkoutHref: string;
  plan: {
    name: string;
    cents: number;
    description: string;
    features: readonly string[];
  };
};

function hasInteractionBlocker() {
  return Boolean(document.querySelector('[role="dialog"], .consent, .nav.open, form:focus-within, [data-modal-open="true"]'));
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PremiumOfferModal({ enabled, delayMs, trigger = "load", cooldownDays: _cooldownDays, campaignId, checkoutHref, plan }: PremiumOfferModalProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const shownRef = useRef(false);
  const eligibilityCheckedRef = useRef(false);
  const eligibleRef = useRef(false);
  const pendingRef = useRef(false);
  const reportReadyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !["/", "/landing"].includes(pathname)) return;
    let cancelled = false;
    const canOpen = () => !cancelled && document.visibilityState === "visible" && ["/", "/landing"].includes(pathname) && !shownRef.current && eligibleRef.current && !hasInteractionBlocker();
    const markShown = () => {
      shownRef.current = true;
      pendingRef.current = false;
    };
    const attemptOpen = () => {
      if (trigger === "load" && activeMsRef.current < delayMs) return;
      if (trigger === "demo-report" && !reportReadyRef.current) return;
      if (!eligibilityCheckedRef.current) { pendingRef.current = true; return; }
      if (!canOpen()) { pendingRef.current = true; return; }
      markShown();
      setOpen(true);
    };
    const checkEligibility = async () => {
      try {
        const response = await fetch("/api/marketing/premium-modal", { cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok || cancelled) return;
        const result = (await response.json()) as { eligible?: boolean };
        eligibleRef.current = result.eligible === true;
        eligibilityCheckedRef.current = true;
        attemptOpen();
      } catch { /* campanha fechada enquanto a elegibilidade estiver incerta */ }
    };
    const tick = () => {
      const now = performance.now();
      if (lastTickRef.current !== null && document.visibilityState === "visible") activeMsRef.current += Math.max(0, now - lastTickRef.current);
      lastTickRef.current = now;
      attemptOpen();
    };
    const onVisibilityChange = () => {
      lastTickRef.current = document.visibilityState === "visible" ? performance.now() : null;
      if (document.visibilityState === "visible") attemptOpen();
    };
    const onInteraction = () => { if (pendingRef.current) attemptOpen(); };
    let reportTimer: number | null = null;
    void checkEligibility();
    const interval = trigger === "load" ? window.setInterval(tick, 250) : null;
    const onDemoReportReady = () => {
      if (reportTimer !== null) window.clearTimeout(reportTimer);
      reportTimer = window.setTimeout(() => {
        if (cancelled) return;
        reportReadyRef.current = true;
        attemptOpen();
      }, delayMs);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("focusin", onInteraction);
    document.addEventListener("click", onInteraction);
    if (trigger === "demo-report") {
      window.addEventListener("godev:demo-report-ready", onDemoReportReady);
      if (document.documentElement.dataset.godevDemoReportReady === "true") onDemoReportReady();
    }
    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
      if (reportTimer !== null) window.clearTimeout(reportTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("focusin", onInteraction);
      document.removeEventListener("click", onInteraction);
      if (trigger === "demo-report") window.removeEventListener("godev:demo-report-ready", onDemoReportReady);
    };
  }, [campaignId, delayMs, enabled, pathname, trigger]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.modalOpen = "true";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>("[data-premium-offer-dialog]");
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      delete document.documentElement.dataset.modalOpen;
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!enabled || !["/", "/landing"].includes(pathname) || !open) return null;
  const benefits = plan.features.filter((feature) => feature !== "Tudo do Essencial").slice(0, 3);
  return (
    <div className="premium-offer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="premium-offer-dialog" data-premium-offer-dialog role="dialog" aria-modal="true" aria-labelledby="premium-offer-title" aria-describedby="premium-offer-description">
        <button ref={closeRef} className="premium-offer-close" type="button" aria-label="Fechar oferta Premium" onClick={() => setOpen(false)}><span aria-hidden="true">×</span></button>
        <p className="premium-offer-kicker">GoDev Education • {plan.name}</p>
        <h2 id="premium-offer-title">Dê mais direção à sua preparação para o ENEM.</h2>
        <p id="premium-offer-description" className="premium-offer-description">Conheça os recursos do Premium e escolha o próximo passo nos seus estudos.</p>
        <ul className="premium-offer-benefits">{benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
        <div className="premium-offer-price"><strong>{formatMoney(plan.cents)}</strong><span>pagamento único · acesso vitalício ao plano</span></div>
        <div className="premium-offer-actions">
          <a className="button primary premium-offer-cta" href={checkoutHref}>{checkoutHref === "/suporte" ? "Ver detalhes do Premium" : "Quero o plano Premium"}</a>
          <button className="premium-offer-secondary" type="button" onClick={() => setOpen(false)}>Continuar navegando</button>
        </div>
      </section>
    </div>
  );
}


