# Jornada Grátis + Pix — Etapa 2: cadastro público e Grátis no portal (branch `feature/jornada-pix-gratis`)

Para revisão. **Tudo atrás da chave `NEXT_PUBLIC_FEATURE_GRATIS=1` (padrão: desligada).** Com a chave desligada o comportamento de produção é o mesmo de antes (cadastro só para quem comprou/convidado; sem Grátis).

## O que mudou
- `lib/features.ts`: chave `gratis`.
- `POST /api/auth/register`: com a chave ligada, qualquer e-mail pode se cadastrar, exigindo `acceptTerms`; resposta única ("Se este e-mail puder ser cadastrado, enviamos um link…") para existente ou novo, sem enumeração de contas. Registra `signup_source`, `terms_version` (2026-11), aceite e `marketing_optin` (opcional, desmarcado) quando a migração 06 estiver aplicada; sem ela o cadastro segue sem esse registro. A verificação reaproveita o link por e-mail existente (token em hash, expira, uso único): a conta só entra depois de confirmar; pendente não acessa nada.
- `components/login-form.tsx`: com a chave ligada, o cadastro mostra termos (obrigatório) e novidades (opcional) e o texto deixa de falar em Cakto.
- `lib/operacao/store.ts`: `operacaoUser()` devolve `tier`. Conta verificada sem compra vira `gratis` (só com a chave). Administrador e compradores seguem como antes.
- Escopo do Grátis aplicado **no servidor** (`lib/planos/gate.ts`, `free.ts`): Trilha só na unidade introdutória (`GRATIS_UNIT_ID`, padrão: a primeira da Trilha); respostas só em questões do módulo dessa unidade, com cota diária (`GRATIS_QUESTOES_DIA`, padrão 10; repetir a mesma questão não gasta; janela America/Sao_Paulo); só o diagnóstico como sessão; `GET /api/operacao/questions` filtra o que o Grátis não pode ver. Materiais, PDFs, leitor e as demais seções continuam exigindo Essencial/Premium (`canAccess` não mudou).

## Verificação
- `pnpm test` 140/140 (3 novos em `tests/gratis-gate.test.ts`); `tsc`, ESLint dos arquivos tocados e `pnpm build` ok.
- Servidor local com conta de teste Grátis (memória): questão fora do módulo → 403; 10 respostas dentro → 200; 11ª → 403 com mensagem de renovação; repetir a 1ª → 200; `sim-1` → 403; diagnóstico → 200; outra unidade da Trilha → 403.

## Ainda NÃO feito nesta etapa (estado verdadeiro)
- Login com Google (precisa de `GOOGLE_CLIENT_ID/SECRET` e callback; não iniciado).
- Interface do Grátis: faixa "Plano Grátis, 10 questões por dia" e saldo; bloqueios da Trilha/Banco aparecem hoje como mensagem de erro da API, sem telas de upgrade dedicadas. Trilha mostra todas as unidades como antes (a API recusa as demais).
- Questões do diagnóstico e do fim de sessão não consomem a cota diária (o servidor escolhe as 16 do diagnóstico).
- Migração 06 **não aplicada** (registro de aceite e identidades dependem dela).
- Checkout Pix (telas/rotas), conciliação, link do responsável, CRM e abas do admin, corte da Cakto.
- Verificação do cadastro ponta a ponta com e-mail real (Resend) não executada: só a rota foi testada por tipo/lint/build, sem enviar e-mail.
- Texto da política de privacidade/termos não foi atualizado para os novos métodos nem revisado para menores.

## Para ativar em homologação
1. Aplicar `scripts/hostinger-mysql-schema-06-pix.sql` (backup antes; MySQL 8.0.29+ para `add column if not exists`).
2. Definir `NEXT_PUBLIC_FEATURE_GRATIS=1` (e, se quiser, `GRATIS_UNIT_ID`, `GRATIS_QUESTOES_DIA`) e refazer o build (chave `NEXT_PUBLIC_` entra no build).
3. Reversão: remover a chave e refazer o build; contas criadas permanecem, mas sem acesso ao estudo (sem tier).
