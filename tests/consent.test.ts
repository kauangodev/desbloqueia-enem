import assert from "node:assert/strict";
import test from "node:test";
import { CONSENT_KEY, saveConsent } from "../lib/consent";
import { hasMarketingConsent } from "../lib/meta-pixel";

/** Simula o navegador: o consentimento é um JSON em localStorage e a medição precisa lê-lo da mesma forma que o aviso de cookies. */
function stubBrowser(initial?: string) {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(CONSENT_KEY, initial);
  const localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  (globalThis as unknown as { window: unknown }).window = { localStorage };
  return store;
}

test("consentimento salvo pelo aviso (JSON) libera a medição", () => {
  stubBrowser();
  saveConsent(true);
  assert.equal(hasMarketingConsent(), true);
});

test("rejeitar métricas mantém a medição desligada", () => {
  stubBrowser();
  saveConsent(false);
  assert.equal(hasMarketingConsent(), false);
});

test("sem escolha registrada não há medição", () => {
  stubBrowser();
  assert.equal(hasMarketingConsent(), false);
});

test("valor antigo 'accepted' é entendido e migrado", () => {
  const store = stubBrowser("accepted");
  assert.equal(hasMarketingConsent(), true);
  assert.equal(JSON.parse(store.get(CONSENT_KEY)!).analytics, true);
});

test("consentimento vencido não libera a medição", () => {
  stubBrowser(JSON.stringify({ v: 1, analytics: true, at: "2020-01-01T00:00:00.000Z", expires: "2020-06-01T00:00:00.000Z" }));
  assert.equal(hasMarketingConsent(), false);
});
