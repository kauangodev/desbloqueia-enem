import { randomUUID } from "node:crypto";

export type TransactionalEmailResult =
  | { ok: true; attemptId: string; providerId: string | null; status: number }
  | { ok: false; attemptId: string; status: number | null; kind: string; providerCode: string | null; providerMessage: string | null };

type EmailInput = { from: string; to: string; subject: string; html: string; idempotencyKey: string };

function providerCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as { name?: unknown; code?: unknown };
  const code = typeof value.name === "string" ? value.name : typeof value.code === "string" ? value.code : null;
  return code?.slice(0, 80) || null;
}

function providerMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as { message?: unknown; error?: { message?: unknown } };
  const message = typeof value.message === "string" ? value.message : typeof value.error?.message === "string" ? value.error.message : null;
  return message?.replace(/[\r\n]+/g, " ").trim().slice(0, 240) || null;
}

function errorKind(status: number | null, code: string | null) {
  if (status === null) return "network";
  if (status === 401 || status === 403 || code === "restricted_api_key") return "configuration";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "provider_unavailable";
  return "provider_rejected";
}

export async function sendResendEmail(input: EmailInput): Promise<TransactionalEmailResult> {
  const attemptId = randomUUID();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !process.env.EMAIL_FROM?.trim()) {
    return { ok: false, attemptId, status: null, kind: "configuration_missing", providerCode: null, providerMessage: null };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({ from: input.from, to: input.to, subject: input.subject, html: input.html }),
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => null) as { id?: unknown } | null;
    if (response.ok) {
      return { ok: true, attemptId, providerId: typeof payload?.id === "string" ? payload.id : null, status: response.status };
    }
    const code = providerCode(payload);
    const message = providerMessage(payload);
    console.error("transactional_email_rejected", { attemptId, providerStatus: response.status, providerCode: code || "unknown", providerMessage: message || "unknown" });
    return { ok: false, attemptId, status: response.status, kind: errorKind(response.status, code), providerCode: code, providerMessage: message };
  } catch (error) {
    console.error("transactional_email_network_error", { attemptId, code: error instanceof Error ? error.name : "unknown" });
    return { ok: false, attemptId, status: null, kind: "network", providerCode: null, providerMessage: null };
  }
}
