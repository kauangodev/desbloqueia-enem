"use client";
import { META_PIXEL_ID } from "../lib/meta-pixel";
import { OPEN_CONSENT_EVENT } from "../lib/consent";

/** Link discreto para rever a escolha de cookies. Só aparece quando há integrações opcionais configuradas. */
export default function CookiePreferencesLink({ className = "cookie-link" }: { className?: string }) {
  if (!/^\d+$/.test(META_PIXEL_ID) && !process.env.NEXT_PUBLIC_GA_ID) return null;
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>Preferências de cookies</button>;
}
