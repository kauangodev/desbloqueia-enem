# Onboarding de 3 etapas, auditoria de segurança focada e estado da retirada da Cakto

Branch `main`, commit desta entrega. Tudo abaixo descreve o que foi feito e verificado, e o que **não** foi.

## 1. Onboarding (entregue, atrás da chave `NEXT_PUBLIC_FEATURE_ONBOARDING=1`, desligada por padrão)

- **Estado no servidor**, por aluno, em `operacao_state` (kind `onboarding`, ref `v1`). Não exige migração nova e usa o mesmo banco do estudo.
- **Modelo puro** em `lib/onboarding/model.ts` (validação e regras de etapa), **API** `GET/POST /api/onboarding`, **modal** `components/aluno/onboarding-gate.tsx` (`<dialog>` modal nativo: foco preso, fundo inerte), **CSS** `app/onboarding.css` (tokens claro/escuro).
- Etapa 1 (obrigatória): data de nascimento, validada no servidor (calendário real, bissexto, não futura, idade plausível 10–100). Tem "Sair da conta". Etapa 2: nota atual/meta opcionais (`null` = não sei, nunca zero; meta menor que a nota não é barrada), interesses futuros só como registro. Etapa 3: ritmo Leve/Regular/Intenso/Personalizado (3/6/10/1–30 questões). **Sem XP** (não existe motor de XP por evento nesta base; não foi inventado).
- Cada etapa é salva ao avançar. Recarregar, trocar de aparelho ou duas abas não perde nada: o avanço nunca regride e a conclusão nunca é desfeita. Falha de leitura no servidor **não bloqueia o estudo** (o modal só deixa de aparecer).
- Segurança: `sameOrigin`, sessão obrigatória, limite de 60 gravações/hora por aluno (RPC `take_rate_limit`), corpo ≤ 2 KB, validação zod + modelo. O cliente não define dono, versão nem conclusão.
- Verificado: 5 testes unitários novos (data, idade no aniversário, objetivo, ritmo, etapas), tsc e eslint limpos, e o fluxo completo no navegador (etapa 1 com erro de data futura, etapas 2 e 3, conclusão que fecha o modal) em tema claro e escuro, desktop e 390 px, com o modo de teste local (memória, sem banco).

### Dependências antes de ligar a chave
1. **Revisão jurídica da coleta da data de nascimento** (LGPD, crianças e adolescentes, ECA Digital) e decisão sobre menores e aferição de idade. O texto do modal **não** promete autorização de responsável nem cita um limite de idade, porque esse fluxo não existe. Nada concede ou nega acesso por idade. As fontes indicadas no pedido (ANPD) não foram consultadas nesta execução.
2. Validar em homologação com o banco real (o fluxo só foi exercitado com armazenamento em memória).

### Não feito neste marco
Presença na landing ("Monte seu plano de estudo"), edição das metas em Configurações, métricas de onboarding no admin (iniciados/concluídos/abandono por etapa), conta com data corrigida pelo atendimento, retomada do destino que motivou o cadastro.

## 2. Cakto

- **Já isolada atrás da chave `NEXT_PUBLIC_FEATURE_PIX`** (implementada antes): com ela ligada, `/api/checkout/*` responde 307 ao checkout próprio, a taxa de R$ 0,99 vira 0 e nenhum CTA abre a Cakto. Webhook e tabelas antigas permanecem para histórico.
- **A chave continua desligada em produção, de propósito.** Ligá-la agora encerraria a única venda que funciona (a Cakto) sem que o Pix esteja operável: faltam as migrações 06/07 no banco, o recebedor e os dois códigos Copia e Cola cadastrados no admin e a homologação. O próprio pedido proíbe retirar a Cakto antes de o fluxo novo estar validado.
- Ocorrências restantes (142 em 39 arquivos, auditadas por contagem): migrações históricas, `scripts/cakto-provision.mjs`, `lib/payment.ts`, webhook, `config/cakto-products.json`, painel admin (aba Produtos) e textos legais. O webhook aceita assinatura HMAC **ou** o segredo no corpo (mecanismo da própria Cakto) e fica desativado sem `CAKTO_WEBHOOK_ENABLED=true`.

## 3. Auditoria de segurança (focada, não completa)

Escopo real: revisão de código das rotas do Pix, do onboarding, do webhook legado, cabeçalhos de produção e busca de segredos versionados. **Não** foi uma auditoria ASVS completa, não houve teste de intrusão, nem revisão do banco ou da Hostinger.

| ID | Achado | Severidade | Ação |
| --- | --- | --- | --- |
| S1 | Produção sem `Strict-Transport-Security` (verificado por cabeçalhos do domínio) | Média | Corrigido: `max-age=15552000`, sem `includeSubDomains`/`preload`. Efetivo após o deploy |
| S2 | `POST /api/pix/orders/[id]/notify` sem limite de taxa (idempotente e restrito ao dono, mas abusável) | Baixa | Corrigido: 30/hora por aluno |
| S3 | Sem Content-Security-Policy além de `upgrade-insecure-requests` | Média | **Não corrigido**: exige aplicação progressiva (OAuth, QR e fontes). Recomendado começar em modo só-relatório |
| S4 | Webhook Cakto aceita segredo no corpo além da assinatura; sem proteção própria contra reenvio | Baixa (desativado por padrão) | Aceito como legado; desativar quando as compras antigas deixarem de chegar |
| S5 | `/api/events` e o limite em memória do funil valem por processo | Baixa | Já documentado; precisa de trava no banco se houver várias instâncias |

Verificado sem achados: `/api/admin/pix` exige permissão por ação no servidor (`billing.manage` e `payments.reconcile`), pedidos Pix só são lidos e avisados pelo dono, nenhum padrão de segredo (chaves privadas, tokens) nos arquivos versionados e nenhum `.env` versionado.

Não verificado: RLS/privilégios do banco real, exposição de `.git`/backups na hospedagem, dependências (auditoria de advisories não executada), upload de comprovantes (não existe nesta base), reautenticação na troca de recebedor.

## 4. Pix, QR Codes e publicação

- **QR Codes/Copia e Cola da GoDev não estão no repositório e não foram vistos**; por regra, ficam só no admin (Pagamentos Pix → Ofertas). Sem eles, nenhum plano pago é vendido por Pix.
- **Banco e Hostinger:** não há acesso a banco nem ao hPanel nesta sessão. O deploy acontece pelo push em `main` (build automático). Migrações 06 e 07 e variáveis de ambiente (`NEXT_PUBLIC_FEATURE_*`, credenciais Google, `PIX_ORDER_TTL_HOURS`) precisam ser aplicadas por quem tem esse acesso; roteiro em `HOMOLOGACAO_JORNADA_PIX.md`.
- Um backup antes de migrar é responsabilidade de quem aplica; não foi executado aqui.
