import assert from "node:assert/strict";
import test from "node:test";
import { ALL_EVENTS, deviceOf, funnelRates, isClientEvent, rate, sanitizeParams } from "../lib/funnel/model";

test("eventos: os oito nomes pedidos + landing_viewed (denominador); só cinco vêm do navegador", () => {
  assert.deepEqual([...ALL_EVENTS].sort(), ["checkout_started", "demo_answered", "demo_started", "first_study_completed", "landing_viewed", "plans_viewed", "purchase_confirmed", "signup_started", "signup_verified"]);
  for (const name of ["landing_viewed", "demo_started", "demo_answered", "plans_viewed", "signup_started"]) assert.equal(isClientEvent(name), true);
  // O navegador NUNCA pode forjar eventos de servidor (venda, cadastro verificado, primeiro estudo, checkout).
  for (const name of ["purchase_confirmed", "signup_verified", "first_study_completed", "checkout_started", "qualquer"]) assert.equal(isClientEvent(name), false);
});

test("parâmetros: lista fechada, sem e-mail, resposta de estudo ou código de pagamento", () => {
  const out = sanitizeParams({ utm_source: "ig", utm_campaign: "x".repeat(200), plan: "premium", device: "mobile", correct: true, email: "a@b.c", answer: "B", copyPaste: "0002...", visitor: "123e4567-e89b-12d3-a456-426614174000", utm_medium: "<script>" });
  assert.deepEqual(out, { utm_source: "ig", plan: "premium", device: "mobile", correct: true, visitor: "123e4567-e89b-12d3-a456-426614174000" });
  assert.deepEqual(sanitizeParams(null), {});
  assert.equal(sanitizeParams({ plan: "ouro" }).plan, undefined);
});

test("dispositivo por largura", () => {
  assert.equal(deviceOf(390), "mobile");
  assert.equal(deviceOf(820), "tablet");
  assert.equal(deviceOf(1440), "desktop");
});

test("taxas: denominador explícito e 'sem dados' nunca vira 0%", () => {
  assert.deepEqual(rate(1, 4), { numerator: 1, denominator: 4, pct: 25 });
  assert.equal(rate(0, 0).pct, null);
  const r = funnelRates({ visitors: 200, demoVisitors: 80, planViewers: 60, signupsVerified: 20, firstStudy: 15, checkouts: 5, purchases: 2 });
  assert.equal(r.visitaParaDemo.pct, 40);
  assert.equal(r.visitaParaCadastroVerificado.pct, 10);
  assert.equal(r.cadastroParaPrimeiroEstudo.pct, 75);
  assert.equal(r.checkoutParaPagamento.pct, 40);
  assert.equal(r.visitaParaPagamento.pct, 1);
  assert.equal(funnelRates({ visitors: 0, demoVisitors: 0, planViewers: 0, signupsVerified: 0, firstStudy: 0, checkouts: 0, purchases: 0 }).visitaParaDemo.pct, null);
});
