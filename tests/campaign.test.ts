import assert from "node:assert/strict";
import test from "node:test";
import { campaign, campaignView } from "../lib/campaign";

test("antes da prova: selo, contagem e título dependem da data real", () => {
  const v = campaignView("2026-11-09");
  assert.equal(v.active, true);
  assert.equal(v.phase, "antes");
  assert.equal(v.daysLeft, 6);
  assert.equal(v.label, "Reta final ENEM · 15 de novembro");
  assert.equal(v.countdown, "Faltam 6 dias para o segundo dia do Enem.");
  assert.equal(v.headline, "Seu próximo domingo");
  assert.equal(v.emphasis, "começa agora.");
  assert.equal(campaignView("2026-11-14").countdown, "Falta 1 dia para o segundo dia do Enem.");
});

test("com mais de 7 dias não afirma 'próximo domingo'", () => {
  const v = campaignView("2026-11-01");
  assert.equal(v.daysLeft, 14);
  assert.ok(!v.headline.includes("domingo"));
});

test("no dia da prova: mensagem de hoje, sem oferta de urgência", () => {
  const v = campaignView("2026-11-15");
  assert.equal(v.phase, "dia");
  assert.equal(v.countdown, "O segundo dia do Enem é hoje.");
  assert.ok(!/domingo/i.test(v.headline + v.emphasis));
});

test("depois da prova: campanha encerrada, sem contagem negativa nem 'próximo domingo'", () => {
  for (const day of ["2026-11-16", "2026-12-20"]) {
    const v = campaignView(day);
    assert.equal(v.active, false);
    assert.equal(v.countdown, null);
    assert.equal(v.daysLeft, 0);
    const text = [v.headline, v.emphasis, v.support, v.primaryCta].join(" ");
    assert.ok(!/domingo|faltam|falta /i.test(text));
  }
});

test("destinos da campanha usam rotas existentes e preservam o destino no login", () => {
  assert.equal(campaign.destinations.offer, "/landing#planos");
  assert.equal(campaign.destinations.studyArea, "/aluno/operacao-segundo-domingo");
  assert.equal(campaign.destinations.login, "/entrar?redirect=%2Faluno%2Foperacao-segundo-domingo");
});
