# Jornada Grátis + Pix — Etapa 5: landing com três planos e corte da Cakto (branch `feature/jornada-pix-gratis`)

Para revisão. **Nada em `main`.** O corte inteiro fica atrás de **uma chave**: `NEXT_PUBLIC_FEATURE_PIX=1` (com `NEXT_PUBLIC_FEATURE_GRATIS=1` para o cartão Grátis). Com as chaves desligadas (padrão) o site continua exatamente como está hoje, com Cakto e taxa de R$ 0,99; `pnpm build` foi feito nesse estado.

## O que a chave Pix muda
- **Preço único, sem taxa:** `SERVICE_FEE_CENTS` passa a 0; o total exibido é o valor da oferta Pix **ativa** (`publicPlans()` troca o preço pelo da oferta ativa), igual na landing, comparação, `/aluno/planos` e checkout. Pedidos antigos mantêm preço e origem; editar o preço cria uma versão nova só para pedidos novos.
- **Landing:** cartão **Grátis** (unidade introdutória da Trilha, cota diária, diagnóstico, "sem cartão") com "Criar conta grátis" (`/entrar?modo=cadastro`), mais Essencial e Premium. Botão pago: "Pagar o Essencial/Premium com Pix" quando há oferta ativa; sem oferta ativa mostra "Pagamento por Pix em breve" (o Grátis segue disponível). Textos de preço, acesso, garantia e FAQ falam de Pix, sem taxa; o botão "enviar para meu responsável pagar" some (o link com token ainda não existe) e o FAQ explica que qualquer pessoa pode pagar o Pix e o acesso fica na conta do aluno.
- **Fluxo de compra:** `/comprar/[plano]` leva logado direto a `/aluno/checkout/[plano]`; visitante vê "Entrar para pagar" e "Criar conta grátis", voltando ao checkout depois do login por senha. (Quem cria conta por e-mail confirma o link e cai em `/aluno`: precisa clicar em Planos de novo.)
- **Corte da Cakto:** `/api/checkout/[plano]` deixa de abrir a Cakto e responde 307 (não permanente, para o rollback) ao checkout GoDev, repassando só `utm_*`, `fbclid`, `src`, `sck`. **O webhook `/api/webhooks/cakto`, `orders`, `payment_events` e `entitlements` antigos não foram tocados**: compras iniciadas antes da virada, reembolso e chargeback continuam sendo processados.
- **Textos legais/atendimento:** políticas e atendimento passam a descrever Pix (e citar a Cakto só para compras anteriores). Texto jurídico **não foi revisado por advogado** e não trata de menores: precisa de revisão antes de ligar a chave.

## Verificação
- `pnpm test` 151/151 (3 novos em `tests/commerce.test.ts`); `tsc` ok; `pnpm build` ok (flags desligadas); ESLint nos arquivos tocados sem erros novos (restam 1 erro e 1 aviso antigos em `components/support.tsx`).
- Servidor local com `PIX=1`, `GRATIS=1` (sem MySQL): landing 200 com "Criar conta grátis" e o cartão Grátis, **nenhuma menção a R$ 0,99**, "Pagamento por Pix em breve" (sem oferta ativa, comportamento esperado), âncoras `#amostra #beneficios #ofertas #acesso #duvidas` presentes; `/api/checkout/premium?utm_source=ig&email=x@y.z&fbclid=abc` → 307 para `/aluno/checkout/premium?utm_source=ig&fbclid=abc` (e-mail descartado); `/comprar/essencial` → 307 para o checkout.
- **Não verificado:** landing com oferta Pix ativa (precisa de banco), checkout ponta a ponta, atribuição de campanha na confirmação do Pix (os eventos de compra do Meta/analytics não foram religados: nada é disparado na confirmação manual), e2e e capturas.

## Ordem de ativação sugerida (homologação)
1. Backup + migração 06. 2. Admin → Pagamentos Pix: oferta de teste com código sintético, ativar, comprar com conta de teste, confirmar, reembolsar. 3. `NEXT_PUBLIC_FEATURE_GRATIS=1` (+ Google, se desejado). 4. Com o Pix real homologado (prévia com o aplicativo do banco), `NEXT_PUBLIC_FEATURE_PIX=1` e novo build: este é o **corte**. 5. Depois de reconciliar o período de suporte, desativar o webhook Cakto (data e método a definir) e revogar/arquivar ofertas na Cakto (ação externa).

## Reversão
Remover `NEXT_PUBLIC_FEATURE_PIX` e refazer o build devolve preço com taxa e checkout Cakto; pedidos Pix já criados e direitos `pix:*` continuam válidos. Ou redeploy do commit anterior.

## Pendente
Link do responsável com token e comprovante opcional; evento de compra confirmado para analytics/Meta; revisão jurídica e de menores dos termos/privacidade; atualização de `products.features` no banco, se citar 2026/Cakto; capturas desktop/celular; e2e antigos (`tests/e2e/site.spec.ts`) ainda desatualizados.
