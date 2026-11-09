# Campanha "Reta final ENEM" (landing + quiz)

Configuração central: `lib/campaign.ts` (textos por fase, destinos, id da questão da prévia). Data e fuso: `lib/operacao/config.ts` (2º dia do Enem: 15/11/2026, America/Sao_Paulo; fonte Inep).
Números da oferta (questões, módulos, simulados, treinos, fichas) vêm do catálogo publicado via `lib/operacao/campaign-facts.ts`; nada é digitado à mão.

Estados (função pura `campaignView(today)`):
- antes: selo "Reta final ENEM · 15 de novembro", "Faltam X dias…", título "Seu próximo domingo começa agora." (≤ 7 dias; acima disso "Sua reta final para o 2º dia começa agora.").
- no dia: "O segundo dia do Enem é hoje.", sem oferta de urgência.
- depois: campanha inativa; hero e quiz voltam ao texto geral; nada de contagem negativa. Materiais e histórico permanecem.

Acesso: a Operação 2º Domingo exige plano Essencial ou Premium (`operacaoUser` → `canAccess("essencial")`; Premium inclui). Quem tem acesso vê "Continuar minha revisão" (landing e resultado do quiz).
Prévia pública: `POST /api/campanha/preview` corrige somente `aut-mat-007`; gabarito só após a tentativa.
Eventos (via `data-analytics-event`, só com consentimento): campaign_hero_cta, campaign_preview_start, campaign_preview_answer, campaign_preview_cta, campaign_journey_cta, campaign_access_continue, campaign_quiz_result_cta, campaign_quiz_result_preview. Compra continua registrada apenas pelo fluxo real existente (checkout/webhook).
Testes: `tests/campaign.test.ts`.
