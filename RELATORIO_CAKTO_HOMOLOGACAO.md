# Relatório de homologação técnica Cakto

Data: 24/10/2026  
Endpoint: `POST /api/webhooks/cakto`  
URL esperada para cadastro: `https://desbloqueia-enem.vercel.app/api/webhooks/cakto`

## Auditoria do contrato oficial

A documentação oficial da Cakto informa que a API usa OAuth2 com `client_id` e `client_secret`, token em `POST https://api.cakto.com.br/public_api/token/` e escopos separados para leitura, escrita, produtos, ofertas, pedidos, assinaturas e webhooks. O projeto não possui credenciais reais configuradas e, por isso, nenhuma chamada autenticada foi executada.

Para a entrega do webhook, a documentação informa `X-Cakto-Timestamp`, `X-Cakto-Signature` com HMAC-SHA256 sobre `timestamp.corpo-cru`, além do campo `secret` no corpo. O handler atual preserva o corpo cru, aplica tolerância de cinco minutos, comparação em tempo constante, validação de schema e suporta objeto V1 ou lista V2.

## Resultado técnico atual

- HTTPS e rota pública: confirmados no domínio Vercel.
- Assinatura inválida: rejeitada com `401` em teste ao vivo.
- JSON inválido: rejeitado antes do processamento.
- Evento antigo: rejeitado pela janela temporal.
- Idempotência: coberta por `pedido:evento` e lock transacional.
- Estados pendentes: não liberam acesso.
- Aprovação, reembolso e chargeback: cobertos por testes locais.
- Eventos oficiais adicionais: schema e transições adicionados para renovação, cancelamento, pausa, atraso, retomada, solicitação de reembolso e Open Finance.
- Compra real/teste oficial da conta: não executada, pois não há autorização para cobrar e não há credenciais verificáveis disponíveis.

## Pendências externas

1. Criar uma chave de API no painel Cakto com escopos mínimos necessários.
2. Cadastrar a URL acima e selecionar somente eventos usados pela operação.
3. Copiar o secret do webhook para `CAKTO_WEBHOOK_SECRET` no ambiente de produção.
4. Executar o teste oficial de webhook da própria conta e confirmar no painel o histórico de entrega.
5. Manter `CHECKOUT_ENABLED=false` até o teste aprovado, a validação de acesso e o reenvio seguro estarem confirmados.

## Conclusão

O código está preparado para homologação, mas a homologação Cakto não está concluída. A documentação oficial também informa que a Cakto considera uma entrega bem-sucedida somente com `2xx` e recomenda enfileirar o evento antes do processamento pesado; a arquitetura atual persiste sincronicamente no Supabase e retorna erro quando o banco não confirma a gravação. Isso é seguro contra falso sucesso, mas ainda é uma pendência de resiliência para uma operação de alto volume.

