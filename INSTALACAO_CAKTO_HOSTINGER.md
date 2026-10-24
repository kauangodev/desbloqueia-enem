# Instalação Cakto + Hostinger

## Arquitetura atual

O projeto publicado é Next.js em Vercel com Supabase para autenticação, banco, RLS e armazenamento. A Cakto é tratada como gateway de pagamento e fonte de confirmação via webhook. Não há implementação MySQL/Hostinger neste repositório.

## O que precisa existir antes da migração

1. Banco MySQL criado na Hostinger e credenciais de produção fora do repositório.
2. Schema equivalente para perfis, pedidos, eventos, entitlements, materiais, tentativas e auditoria.
3. Migração validada com contagens e hashes dos dados.
4. Backend compatível com o runtime de hospedagem escolhido, incluindo assinatura do webhook e job de fulfillment.
5. Testes de autorização, idempotência, reembolso, chargeback e expiração.
6. DNS, variáveis, cron e e-mail transacional configurados.

## Variáveis de referência

As variáveis `HOSTINGER_MYSQL_*` no `.env.example` são somente um contrato de planejamento. O código atual não as lê.

## Critério de conclusão

A migração só poderá ser considerada concluída após deploy em um ambiente Hostinger, execução das migrations, teste de compra/webhook real e verificação da área de alunos e do painel administrativo.

