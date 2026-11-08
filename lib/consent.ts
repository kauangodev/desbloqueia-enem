/** Preferência de cookies: única fonte de estado. Versão e validade permitem pedir nova escolha apenas quando necessário. */
export type Consent = { v: number; analytics: boolean; at: string; expires: string };

export const CONSENT_KEY = "godev-consent";
export const CONSENT_VERSION = 1;
/** Validade da escolha: 180 dias. Só reapresentamos o aviso depois disso ou se a versão da política mudar. */
export const CONSENT_DAYS = 180;
export const OPEN_CONSENT_EVENT = "godev:open-consent";

let memory: Consent | null = null;

const build = (analytics: boolean, now = new Date()): Consent => ({ v: CONSENT_VERSION, analytics, at: now.toISOString(), expires: new Date(now.getTime() + CONSENT_DAYS * 86400000).toISOString() });

export function validConsent(value: unknown, now = Date.now()): Consent | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Consent;
  if (c.v !== CONSENT_VERSION || typeof c.analytics !== "boolean") return null;
  const expires = Date.parse(c.expires);
  return Number.isFinite(expires) && expires > now ? c : null;
}

/** Lê a escolha persistida. Valores antigos ("accepted"/"rejected") são migrados uma única vez. */
export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return memory;
    if (raw === "accepted" || raw === "rejected") { const migrated = build(raw === "accepted"); writeRaw(migrated); return migrated; }
    return validConsent(JSON.parse(raw)) ?? memory;
  } catch { return memory; }
}

function writeRaw(consent: Consent) { try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch { /* armazenamento indisponível: mantém em memória */ } }

/** Salva a escolha (aceitar ou rejeitar opcionais contam igualmente como escolha). */
export function saveConsent(analytics: boolean): Consent {
  const consent = build(analytics);
  memory = consent;
  writeRaw(consent);
  return consent;
}
