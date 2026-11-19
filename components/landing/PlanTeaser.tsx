"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTINES } from "../../lib/onboarding/model";

type Id = keyof typeof ROUTINES;
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/**
 * "Monte seu plano de estudo" (demonstração): só o ritmo diário, sem pedir nenhum dado pessoal. Nada é gravado nem enviado:
 * o plano mostrado é um EXEMPLO calculado na hora com as metas reais do onboarding (3/6/10 questões por dia).
 */
export default function PlanTeaser({ ctaHref, gratis }: { ctaHref: string; gratis: boolean }) {
  const [id, setId] = useState<Id>("regular");
  const r = ROUTINES[id];
  return (
    <section className="v2-section v2-band" id="plano-demo" aria-labelledby="v2-plan-title">
      <div className="v2-wrap v2-teaser">
        <div>
          <h2 id="v2-plan-title">Monte seu plano de estudo</h2>
          <p className="v2-teaser-lead">Escolha um ritmo e veja um exemplo de semana. É só uma demonstração: não pedimos dados e nada é salvo.</p>
          <fieldset className="v2-teaser-opts">
            <legend className="sr-only">Ritmo diário</legend>
            {(Object.entries(ROUTINES) as [Id, (typeof ROUTINES)[Id]][]).map(([key, value]) => (
              <label key={key} className={key === id ? "is-on" : ""}><input type="radio" name="ritmo-demo" checked={key === id} onChange={() => setId(key)} /><b>{value.label}</b><span>~{value.questions} questões por dia</span></label>
            ))}
          </fieldset>
        </div>
        <div className="v2-teaser-card" role="group" aria-label="Exemplo de semana de estudo">
          <p className="v2-teaser-tag">Exemplo ilustrativo</p>
          <ul className="v2-week">{DAYS.map((d, i) => (<li key={d} className={i < 6 ? "is-on" : ""}><span>{d}</span><b>{i < 6 ? r.questions : "Revisão"}</b></li>))}</ul>
          <p className="v2-teaser-sum"><b>{r.questions * 6} questões</b> por semana, mais um dia de revisão dos seus erros.</p>
          <Link className="v2-btn" href={ctaHref} data-signup={gratis ? "plano-demo" : undefined}>{gratis ? "Criar minha conta grátis" : "Ver os planos"}<span aria-hidden="true">›</span></Link>
        </div>
      </div>
    </section>
  );
}
