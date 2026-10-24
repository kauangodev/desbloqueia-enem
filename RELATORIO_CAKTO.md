# Relatório de integração Cakto

Data da auditoria: 24/10/2026  
Projeto: `desbloqueia-enem`  
Ambiente publicado: `https://desbloqueia-enem.vercel.app`

## Estado comprovado

- O checkout está protegido por configuração de ambiente e não abre quando o conjunto mínimo não está homologado.
- A rota pública `GET /api/checkout/essencial` respondeu `503` com `{"error":"Vendas ainda não disponíveis."}` na verificação ao vivo. Portanto, não é correto anunciar vendas ativas neste momento.
- A rota `POST /api/webhooks/cakto` rejeitou um evento sem assinatura com `401`. A barreira de autenticação existe; isso não comprova o recebimento de um webhook legítimo da Cakto.
- O pipeline local foi exercitado por 22 testes: idempotência, aprovação, recusa, Pix pendente, reembolso, chargeback, vínculo por e-mail, convite administrativo, entrega e isolamento por RLS.

## Fluxo implementado

1. A Cakto envia um evento assinado.
2. A aplicação valida tamanho, JSON, assinatura/segredo, esquema, produto e oferta.
3. `receive_payment` persiste pedido e evento de forma idempotente.
4. Uma aprovação cria ou atualiza o entitlement pelo e-mail normalizado.
5. O job de fulfillment cria a conta e prepara a entrega de acesso.
6. O aluno pode concluir o cadastro com senha no próprio site, quando já houver entitlement ativo ou convite administrativo.

## Pendências de produção

- Ativar `CHECKOUT_ENABLED`, `AUTH_EMAIL_READY`, `CAKTO_WEBHOOK_ENABLED` e o segredo do webhook somente após homologar os dois produtos e URLs na conta Cakto.
- Confirmar no painel Cakto o formato real dos eventos e fazer um teste aprovado, um pendente e um reembolso com IDs reais.
- Configurar Supabase, e-mail transacional e job cron no ambiente de produção.
- O repositório não contém cliente MySQL, variáveis Hostinger nem migração para Hostinger.
- Eventos de assinatura recorrente ainda não fazem parte do esquema atual; não devem ser enviados ao endpoint sem contrato de payload e regra de acesso.

## Conclusão

A integração está estruturada e testada localmente, mas vendas reais continuam desativadas no ambiente publicado. A condição “100% funcional em produção” só pode ser afirmada depois de um webhook real validado e da abertura explícita do checkout.

