# Jornada Grátis + Pix — Etapa 3: checkout Pix e conciliação manual (branch `feature/jornada-pix-gratis`)

Para revisão. **Nada em `main`.** As telas existem, mas nenhum link do site aponta para elas ainda (a landing e `/aluno/planos` continuam levando à Cakto até o corte comercial).

## O que foi implementado
- **Dados** (`lib/pix/store.ts`, MySQL com transação e `FOR UPDATE`): ofertas versionadas (rascunho → ativa → encerrada), pedidos, eventos, confirmação, reembolso, nota do operador. A regra de estados é a de `lib/pix/orders.ts` (testada). A confirmação grava o pedido, a referência bancária (índice **único**), a linha em `entitlements` com `order_id = "pix:<id>"`, o evento e o log de auditoria na mesma transação. Reembolso desativa só a linha `pix:<id>`.
- **Aluno:** `/aluno/checkout/[plan]` (revisão: conta beneficiária, total, recebedor; sem oferta ativa mostra "ainda não está disponível" e o Grátis segue), `POST /api/pix/orders` (cria ou reaproveita o pedido aberto; limite 12/h), `/aluno/pagamentos` (lista), `/aluno/pagamentos/[id]` (QR desenhado a partir do **mesmo texto** do Copia e Cola, botão Copiar, "Já fiz o Pix" idempotente, prazo de conferência, estados), `POST /api/pix/orders/[id]/notify`.
- **Admin:** aba "Pagamentos Pix": ofertas (preço em R$, recebedor, Copia e Cola, prazo; **Salvar rascunho**, **Visualizar checkout**, **Ativar Pix**, que só habilita se CRC/valor/recebedor passam), fila por status com busca e paginação no servidor, painel de conferência (EndToEndId, valor, data/hora, recebedor; confirmação pede confirmação explícita com aluno, plano e valor), reembolso com referência. Novas permissões: `payments.read` (suporte também), `payments.reconcile` e `billing.manage` (proprietário/administrador); `POST /api/admin/pix` checa a permissão no servidor em cada ação.
- Dependência nova: `qrcode` (+ `@types/qrcode`), com o lockfile atualizado.

## Verificação
- `pnpm test` 140/140 (inclui pedido expirado + "já fiz o Pix"); `tsc`, ESLint dos arquivos tocados e `pnpm build` ok; rotas aparecem no build.
- QR: gerado a partir de um Copia e Cola **sintético** com CRC válido (SVG ok).
- **Não verificado:** as consultas SQL e as transações de `store.ts` **não foram executadas contra um MySQL** (não há MySQL local nesta máquina; só tipos, lint e build). Isto exige homologação com o banco e a migração 06 aplicada antes de qualquer uso. Também não foram executadas as telas autenticadas com pedidos reais, nem capturas.

## Pendente (estado verdadeiro)
- Link do responsável (token de curta validade), comprovante opcional (upload), expiração por tarefa agendada (hoje a expiração é aplicada ao abrir a fila), e-mail de "acesso liberado" após a confirmação, "Divergência/exceções" como fila própria (existe só a nota do operador).
- Botões "Pagar com Pix" na landing e em `/aluno/planos`, preço único nas telas, remoção da taxa de R$ 0,99 da nova cobrança e **bloqueio de novas vendas pela Cakto** (corte): não feitos; o webhook e os pedidos antigos seguem intactos.
- Cadastro/login com Google, CRM (alunos e cadastros, frequência real), conversão por coorte, exportação, privacidade/termos.
- Provedor com cobrança individual/webhook bancário: apenas o contrato conceitual (`orders.ts`); nada ativo.

## Para homologar
1. Backup e aplicar `scripts/hostinger-mysql-schema-06-pix.sql`.
2. No admin → Pagamentos Pix, criar rascunho com **código sintético de teste** (identificado como teste), ativar, abrir `/aluno/checkout/essencial` com uma conta de teste, "Pagar com Pix", "Já fiz o Pix", conferir na fila, confirmar com um EndToEndId fictício e ver o acesso Essencial; depois registrar reembolso e ver o acesso revogado.
2. Nunca usar o código real do proprietário antes da prévia no aplicativo do banco.

## Reversão
Remover os arquivos novos ou não ativar nenhuma oferta (sem oferta ativa nada é vendido). As tabelas 06 podem ser descartadas sem afetar o legado.
