import assert from "node:assert/strict";
import test from "node:test";
import { caktoFeeCents } from "../lib/pricing";
import { checkoutHref, legacyCheckoutTarget } from "../lib/commerce";

test("taxa: Cakto soma R$ 0,99; o corte Pix não soma nada", () => {
  assert.equal(caktoFeeCents(false), 99);
  assert.equal(caktoFeeCents(true), 0);
});

test("botão de compra: Pix vai ao checkout GoDev; sem o corte, ao fluxo atual", () => {
  assert.equal(checkoutHref("premium", true), "/aluno/checkout/premium");
  assert.equal(checkoutHref("premium", false), "/api/checkout/premium");
});

test("link antigo de checkout: mantém só parâmetros de campanha conhecidos", () => {
  const target = legacyCheckoutTarget("essencial", new URLSearchParams("utm_source=ig&fbclid=abc&email=a@b.c&redirect=https://evil.example&utm_campaign=" + "x".repeat(300)));
  assert.equal(target, "/aluno/checkout/essencial?utm_source=ig&fbclid=abc");
  assert.equal(legacyCheckoutTarget("premium", new URLSearchParams()), "/aluno/checkout/premium");
});
