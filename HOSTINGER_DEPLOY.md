# Migração para Hostinger — GoDev Education

> Status em 26/10/2026: guia preparado; a aplicação publicada ainda usa Supabase como backend de autenticação, banco e storage. Este arquivo não afirma que a migração foi concluída.

## Situação atual

- Frontend e rotas server-side: Next.js 16.
- Fonte de código: GitHub `kauangodev/desbloqueia-enem`, branch `main`.
- Backend atual: Supabase Auth, Postgres, RLS e Storage.
- Pagamentos: fluxo Cakto configurado no código; homologação de compra real e webhook ainda devem ser executados em ambiente controlado.
- Conteúdo local: 2.100 questões autorais, 30 simulados de 20 questões e 60 listas de exercícios. A biblioteca histórica possui 1.800 referências; apenas as resoluções efetivamente cadastradas devem ser anunciadas como resolvidas.

## Bloqueios para uma instalação independente

A hospedagem compartilhada da Hostinger não substitui automaticamente:

1. Supabase Auth e suas sessões.
2. Postgres/RLS e as políticas de autorização.
3. Supabase Storage e URLs assinadas.
4. Execução de webhooks Cakto com persistência idempotente.
5. SMTP transacional para confirmação e recuperação de senha.
6. Chave da OpenAI para correção de redação, se esse recurso for ativado.

Não copie valores reais de `.env` para o ZIP ou para o GitHub.

## Plano de migração

1. Confirmar um plano Hostinger que execute Node.js/Next.js server-side ou escolher uma arquitetura estática + API separada.
2. Definir banco de destino (PostgreSQL recomendado para reduzir mudanças) e preparar migrações equivalentes, incluindo RLS ou autorização server-side.
3. Migrar usuários, entitlements, tentativas, redações, tickets, auditoria, materiais e arquivos; validar contagens e checksums.
4. Reimplementar sessões, cookies, recuperação de senha, storage privado e URLs temporárias.
5. Configurar SMTP, webhook Cakto, segredo de assinatura, idempotência e replay protection.
6. Configurar variáveis de ambiente apenas no painel do provedor.
7. Rodar build limpo, testes unitários, E2E autenticado e teste de compra em sandbox.
8. Fazer a troca de DNS somente após homologar o domínio e as integrações de produção.

## Variáveis obrigatórias

Use `.env.example` como contrato. Os valores reais devem ser definidos no ambiente de destino, nunca versionados.

## Critério de aceite

A migração só deve ser marcada como concluída quando um usuário de teste conseguir: criar conta, confirmar/recuperar senha, receber entitlement após webhook válido, acessar apenas o plano comprado, abrir arquivos protegidos, realizar atividade e ver seu resultado; e quando um administrador conseguir consultar CRM, auditoria, tickets e métricas sem contornar autorização.

## Evidência da conta GoDevEducation (27/10/2026)

O domínio está associado no hPanel ao plano exibido como **Unlimited Web Hosting**. A seção **Web Apps** existe, mas o botão **Criar site** aparece desabilitado e o painel oferece upgrade para **Cloud Startup**. O domínio atual foi criado como site comum; o diretório public_html está vazio.

Isso não é uma incompatibilidade do Next.js. É uma diferença de tipo de site: a Hostinger informa que um site PHP/HTML já criado não pode ser convertido em Node.js no mesmo registro. O procedimento seguro é criar uma nova Web App Node.js, conectar o GitHub e testar em um endereço temporário/subdomínio. Somente após o build e os fluxos autenticados passarem, remover o site comum ou substituir o vínculo do domínio.

Não aprovar upgrade, remoção ou troca de domínio automaticamente: essas ações podem gerar cobrança ou indisponibilidade. O plano compatível e a disponibilidade do botão devem ser confirmados no hPanel antes da etapa de publicação.
