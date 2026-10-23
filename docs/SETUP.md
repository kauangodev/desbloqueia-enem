# GoDev Education — ativação

O site reutiliza `kauangodev/desbloqueia-enem`, branch `main`, projeto Vercel `desbloqueia-enem`.
URL confirmada para este projeto: https://desbloqueia-enem.vercel.app. O endereço sem hífen pertence ao projeto `desbloqueiaenem`; não foi transferido nem declarado canônico.

## 1. Banco, autenticação e arquivos (Supabase)

1. Crie/selecione o projeto Supabase e execute, em ordem, `supabase/migrations/001_platform.sql`, `002_catalog.sql` e `003_cakto_launch.sql` pelo SQL Editor. Migrações iniciais: executar uma vez.
2. Configure as três variáveis Supabase de `.env.example` no Vercel. Somente URL e chave anônima são públicas. Nunca exponha service_role.
3. Em Auth, configure Site URL para o domínio acima e permita o callback `/auth/callback`. Configure SMTP de produção para os links de acesso. Desative cadastros públicos; contas são criadas pelo fulfillment e convites administrativos.
4. Crie o proprietário por convite no Supabase Auth. Promova somente seu UUID com `update public.profiles set role='admin' where id='<UUID conferido>';`. Nenhum cadastro público recebe papel administrativo.
5. Entre em `/admin`. Em Materiais, envie os PDFs privados e publique os respectivos itens. O bucket `materials` é privado; não há política pública de leitura. O servidor verifica plano e emite URL de 60 segundos.
6. Os seis materiais recebidos já têm metadados no catálogo, mas começam não publicados. Os PDFs originais não foram copiados para GitHub ou public/. Envie o caderno Essencial de 40 exercícios como material próprio: não libere o kit Premium completo para suprir essa seleção. Simulados, redação e checklists podem ser cadastrados separadamente ou consultados no volume completo Premium.

Nenhuma amostra interior foi designada como pública: a landing usa apenas as capas já publicadas. Para publicar uma amostra autorizada, acrescente somente esse PDF em `public/samples/` e registre o caminho em Materiais.

## 2. Cakto e compras

Referências consultadas: https://docs.cakto.com.br/conceitos/webhooks e https://www.cakto.com.br/api.

- O catálogo de lançamento está em `config/cakto-products.json`: Essencial por R$ 19,90 e Premium por R$ 39,90, ambos em pagamento único. As descrições e benefícios refletem somente os materiais existentes.
- Os produtos de produção foram criados na Cakto em 23/10/2026. A migration `004_cakto_live_offers.sql` registra os IDs e links oficiais, mantendo as ofertas desativadas até a homologação completa da entrega.
- As capas quadradas de checkout estão em `public/products/`. Depois de publicar o site, os arquivos ficam nos endereços definidos no catálogo e podem ser aplicados às ofertas.
- Para conferir o plano sem alterar a conta, execute `npm run cakto:plan`. Para provisionar, use localmente `CAKTO_CLIENT_ID` e `CAKTO_CLIENT_SECRET` com escopos mínimos de leitura/escrita para produtos, ofertas e webhooks, então execute `npm run cakto:provision`. O script reutiliza produtos com o mesmo nome, cria os ausentes, atualiza as ofertas, vincula as capas e cadastra o webhook.
- O resultado fica somente em `private/cakto-provision-result.json`, pasta ignorada pelo Git. Ele contém IDs, links dos checkouts e o secret do webhook; não publique esse arquivo.
- Preencha os IDs exatos e checkout em `/admin?tab=produtos`. Domínio permitido: `https://pay.cakto.com.br`.
- Webhook: `https://desbloqueia-enem.vercel.app/api/webhooks/cakto`.
- Secret em `CAKTO_WEBHOOK_SECRET`; ativação separada em `CAKTO_WEBHOOK_ENABLED=true`.
- Assinatura oficial: HMAC SHA-256 de `timestamp.corpo_original`, headers `X-Cakto-Timestamp` e `X-Cakto-Signature: v1=...`; tolerância de cinco minutos. Não usar um segredo enviado pelo cliente como autorização.
- São processados purchase_approved (somente status paid), purchase_refused, refund, chargeback e geração pendente. V1 e lista V2 são aceitas. Só ofertas cadastradas são aceitas. Fixtures usam IDs `product-*` de teste e nunca são cadastradas na produção.
- Pedido, evento, direito e fila de entrega são gravados em uma transação PostgreSQL. Duplicidade é por pedido + evento, com trava por pedido. Reembolso/chargeback são terminais e revogam apenas o pedido correspondente; outros direitos continuam ativos.
- Payload persistido contém somente o subconjunto validado. Não são persistidos secret, CPF, cartão ou telefone do webhook.
- Na documentação atual, respostas HTTP de erro não garantem retentativa automática Cakto. Monitore o histórico e reenvie eventos que não puderam ser persistidos. Não retornamos 2xx antes de gravar.

## 3. E-mail e fila

Configure `RESEND_API_KEY`, `EMAIL_FROM` (domínio verificado) e `CRON_SECRET` aleatório no servidor. Configure um agendador para chamar `GET /api/jobs/fulfillment` com `Authorization: Bearer <CRON_SECRET>` a cada 5 minutos. Use plano compatível; o painel Vercel encontrado está em Hobby, não foi contratado upgrade.

O worker cria/vincula a conta, liga direitos ao usuário e envia instruções. O login em si usa Supabase Auth/SMTP e PKCE. E-mail transacional contém link para `/entrar`, nunca senha. Fila persistente, lease de cinco minutos, backoff e limite de oito tentativas. Admin pode reenfileirar. `accepted` significa aceitação pelo Resend, não entrega comprovada. Monitore falhas e configure alertas operacionais no provedor. O Resend deduplica por ID de entrega; após sua janela de retenção, retry pode gerar nova mensagem.

## 4. Marca, suporte e comercial

O logo oficial não estava no repositório/anexo. Identificação textual provisória GoDev Education; nenhum símbolo oficial foi recriado. Substituir quando o arquivo for disponibilizado.

Em `/admin?tab=suporte`, configure responsável legal, documento, e-mail, horário, nome de suporte, WhatsApp e mensagem. WhatsApp só aparece se ativado e válido. Revise as políticas com os dados comerciais definitivos antes de vender. O endereço sem hífen depende de decisão sobre o outro projeto, não de criar um projeto novo.

## 5. Métricas e lançamento

Meta Pixel e GA opcionais, carregados após consentimento; IDs em `.env.example`. ViewContent e InitiateCheckout são preparados. Não há evento Purchase no navegador. Configure Purchase na Cakto como única fonte; se migrar para CAPI, utilize ID do pedido e desative a outra fonte antes. As UTMs são guardadas apenas após consentimento. Não há credencial de marketing no backend.

Somente após validar compra de homologação, e-mail, login, leitor, upload, cancelamento e privilégios em um Supabase configurado, ative ofertas e `CHECKOUT_ENABLED=true`. A API exige também secret, webhook, e-mail, worker e suporte. Flag não é atestado de homologação. A abertura comercial depende de plano Vercel adequado e validação dos arquivos incluídos em cada oferta.

## Validação e limites da entrega

`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e`.
Os testes de banco executam as migrações reais em PostgreSQL/PGlite, incluindo RLS, filas e eventos. Não substituem a homologação do Supabase/Auth/Storage e dos provedores externos. Playwright verifica a landing, navegação, políticas e bloqueios de acesso. Não há autenticação falsa nem bypass de teste no aplicativo de produção.
