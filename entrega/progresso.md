# GoDev Education — progresso da auditoria v2

## Fase 1 — descoberta

- Status: concluída com ressalvas.
- Branch local criada: `release/godev-premium`.
- Repositório: `kauangodev/desbloqueia-enem`; alterações locais não rastreadas foram preservadas.
- Stack confirmada: Next.js App Router, React, TypeScript, `next/font` e `next/image`.
- Rotas públicas confirmadas no código: `/`, `/diagnostico`, `/landing`, `/entrar`, `/suporte` e `/politicas/*`.
- Rotas privadas confirmadas no código: `/aluno/*` e `/admin/*`.
- APIs e integração Cakto localizadas em `app/api/**`.
- Quiz de entrada presente em `/` e `/diagnostico`; a landing permanece em `/landing`.
- `PRODUCT.md` e `DESIGN.md` existentes e carregados pelo contexto Impeccable.
- O comando de terminal `impeccable init` não existe como CLI; o launcher informou que `init` é uma ação conversacional. O contexto existente foi preservado.

## Restrições registradas

- Nenhuma variável nova de produção, migração de banco, compra real ou alteração de credenciais será executada.
- Correção automática de redações permanece em manutenção.
- Testes autenticados dependem de credenciais E2E locais autorizadas.
- A publicação atual é feita pelo pipeline GitHub/Vercel que atende o domínio; logs internos e limpeza de cache do hPanel ainda dependem de acesso ao painel.

## Gate técnico da descoberta

- `pnpm run typecheck`: aprovado.
- `pnpm run build` com heap controlado: aprovado; 33 rotas geradas.
- `pnpm exec playwright test`: 19/19 aprovados.
- `pnpm test`: 35/35 aprovados.
- O launcher local Impeccable aceita `context`, mas não expõe `init`, `critique` ou `audit` como comandos de terminal. A alternativa Playwright/Axe será usada e esta limitação não será mascarada.

## Fases 2/3/6 — correções verificadas

- Adicionado o pipeline local `optimize:covers`, usando `sharp` sem substituir os PNGs originais.
- Geradas 48 versões WebP (16 capas × 320/640/960px); a maior versão 320px ficou em 16.820 bytes.
- A landing usa as versões leves de 320px; o catálogo e o motion usam as versões 640px.
- Preview social convertido para `public/og.jpg` (1200×630, 34.353 bytes) e metadata atualizada.
- Carrossel prioriza somente a primeira imagem para LCP.
- `pnpm audit --prod --audit-level high`: nenhum alerta conhecido.
- Após as mudanças: build aprovado, 19/19 E2E aprovados e 35/35 testes unitários aprovados.

## Próximo gate

Criar commit da fase e abrir PR para `main`. A publicação só ocorre após os checks remotos verdes; não executar compra, migração ou alteração de segredo em produção.
