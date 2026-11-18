import assert from "node:assert/strict";
import test from "node:test";
import { campaign, campaignView } from "../lib/campaign";

test("ENEM 2027 sem data oficial: narrativa 2027, sem faixa de contagem e sem datas de 2026", () => {
  for (const day of ["2026-11-18", "2026-12-20", "2027-03-10"]) {
    const v = campaignView(day);
    assert.equal(v.active, false, "sem prova confirmada não há contagem");
    assert.equal(v.countdown, null);
    assert.equal(v.calendarConfirmed, false);
    assert.equal(v.label, "Calendário oficial do ENEM 2027 a confirmar");
    assert.equal(v.headline + " " + v.emphasis, "Sua preparação para o ENEM 2027, passo a passo.");
    assert.equal(v.primaryCta, "Conhecer os planos");
    const text = [v.headline, v.emphasis, v.support, v.label, v.detail, v.primaryCta].join(" ");
    assert.ok(!/2026|reta final|domingo|operação/i.test(text), `sem referências antigas: ${text}`);
  }
});

test("destinos da campanha usam rotas permanentes e preservam o destino no login", () => {
  assert.equal(campaign.destinations.offer, "/landing#ofertas");
  assert.equal(campaign.destinations.studyArea, "/aluno");
  assert.equal(campaign.destinations.login, "/entrar?redirect=%2Faluno");
  assert.equal(campaign.destinations.mathNature, "/aluno/matematica-natureza");
});
