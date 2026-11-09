# Campanha "Reta final ENEM" (landing + quiz)

Configuração central: `lib/campaign.ts` (textos por fase, destinos, id da questão da prévia). Data e fuso: `lib/operacao/config.ts` (2º dia do Enem: 15/11/2026, America/Sao_Paulo; fonte Inep).
Números da oferta (questões, módulos, simulados, treinos, fichas) vêm do catálogo publicado via `lib/operacao/campaign-facts.ts`; nada é digitado à mão.

Estados (função pura `campaignView(today)`):
- antes: selo "Reta final ENEM · 15 de novembro", "Faltam X dias…", título "Seu próximo domingo começa agora." (≤ 7 dias; acima disso "Sua reta final para o 2º dia começa agora.").
- no dia: "O segundo dia do Enem é hoje.", sem oferta de urgência.
- depois: campanha inativa; hero e quiz voltam ao texto geral; nada de contagem negativa. Materiais e histórico permanecem.

Acesso: a Operação 2º Domingo exige plano Essencial ou Premium (`operacaoUser` → `canAccess("essencial")`; Premium inclui). Quem tem acesso vê "Continuar minha revisão" (landing e resultado do quiz).
Quiz: aviso discreto na abertura (data e prazo); o fluxo é quiz → landing e quem abre `/` sempre vê o quiz. Não há mais questão de amostra na landing (a demonstração da plataforma é a seção existente).
Eventos (via `data-analytics-event`, só com consentimento): campaign_hero_cta, campaign_journey_cta, campaign_access_continue. Compra continua registrada apenas pelo fluxo real existente (checkout/webhook).
Hero 3D (movimento reduzido): a cena carrega só com ponteiro fino e reage apenas ao cursor do usuário (sem entrada elástica nem onda automática).
Testes: `tests/campaign.test.ts`, `tests/covers.test.ts`.
