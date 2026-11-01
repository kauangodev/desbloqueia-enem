"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { enabled: boolean; delayMs: number; cooldownDays: number; campaignId: string; checkoutHref: string; plan: { name: string; cents: number; description: string; features: readonly string[] } };
export default function PremiumOfferModal({ enabled, delayMs, cooldownDays, campaignId, checkoutHref, plan }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!enabled) return; const key = `godev-modal-${campaignId}`; const last = Number(localStorage.getItem(key) || 0); if (last && Date.now() - last < cooldownDays * 86400000) return; const timer = window.setTimeout(() => setOpen(true), delayMs); return () => window.clearTimeout(timer); }, [campaignId, cooldownDays, delayMs, enabled]);
  if (!open) return null;
  return <div className="offer-modal-backdrop" role="presentation" onClick={() => setOpen(false)}><section className="offer-modal" role="dialog" aria-modal="true" aria-labelledby="offer-modal-title" onClick={(event) => event.stopPropagation()}><button className="offer-modal-close" type="button" aria-label="Fechar" onClick={() => setOpen(false)}>×</button><span className="eyebrow">Um próximo passo possível</span><h2 id="offer-modal-title">{plan.name} para estudar com mais clareza.</h2><p>{plan.description}</p><Link className="button primary" href={checkoutHref} onClick={() => localStorage.setItem(`godev-modal-${campaignId}`, String(Date.now()))}>Conhecer o plano</Link></section></div>;
}
