# Configuração Cakto + Hostinger

## Cakto

As credenciais OAuth2 são exclusivamente de servidor:

- `CAKTO_CLIENT_ID`
- `CAKTO_CLIENT_SECRET`
- `CAKTO_API_BASE_URL=https://api.cakto.com.br/public_api`
- `CAKTO_WEBHOOK_SECRET`
- `CAKTO_WEBHOOK_ENABLED`
- `CHECKOUT_ENABLED`

O segredo do webhook é diferente do par OAuth2. Nenhuma dessas variáveis deve ser exposta ao navegador, commitada ou incluída em ZIP público.

## Hostinger

O projeto atual ainda usa Supabase e Vercel. As variáveis `HOSTINGER_MYSQL_*` no `.env.example` documentam somente o destino planejado; o runtime não as lê. Para concluir a migração são necessários banco, schema equivalente, migração com contagem/hash, backend compatível, cron, e-mail e testes de autorização.

## Ordem segura de ativação

1. Aplicar migrations no banco ativo.
2. Configurar segredos na plataforma de hospedagem.
3. Cadastrar o webhook e executar o teste oficial.
4. Validar pedido de teste e acesso pelo mesmo e-mail.
5. Só então ativar `CHECKOUT_ENABLED`.

