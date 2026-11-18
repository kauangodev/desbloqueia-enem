# Jornada Grátis + Pix — Etapa 1: inventário e fundação (branch `feature/jornada-pix-gratis`)

Para revisão. **Nada publicado em `main`; nenhuma rota, tela ou comportamento de produção mudou nesta etapa.**

## 1. Inventário (código inspecionado em main `ab4d4e3`)
| Peça | Estado atual | Impacto |
|---|---|---|
| `lib/supabase.ts` | Adaptador MySQL (`users`, sessão `godev_session` assinada, `signUp`, reset por token em hash, `receive_payment` da Cakto). `canAccess(plan)` só aceita admin ou direito ativo Essencial/Premium; **não existe nível Grátis**. | Base dos direitos; precisa de `rightsFor` no lugar do `some(...)`. |
| `POST /api/auth/register` | Exige direito de compra ou convite (403 caso contrário). | Abrir cadastro público = nova rota/regra, com verificação por e-mail. |
| `lib/operacao/store.ts` `operacaoUser()` | Usa `canAccess("essencial")`: sem plano, **todo** o estudo (Trilha, Banco, Treino, Flash cards, Dashboard, Início) devolve `null`. | Principal ponto a abrir para o Grátis, com cotas. |
| Outros `canAccess` | `/api/materials/[id]`, `/api/storage`, `/aluno/ler/[id]`, `/api/assessments`, `/api/essays`, `/api/study`, `[section]` (Premium: biblioteca/simulados/checklists). | Continuam protegidos; Grátis não herda. |
| Checkout | `/api/checkout/[plan]` redireciona para `pay.cakto.com.br`; `receive_payment` trata webhook Cakto. `lib/pricing.ts` soma R$ 0,99 (`SERVICE_FEE_CENTS`). Valores-base: R$ 10,90 / R$ 19,90 (`lib/config.ts`). | Compras novas passam ao checkout Pix; o webhook e `orders`/`entitlements` ficam para pedidos antigos. |
| Login | `components/login-form.tsx` ainda orienta usar o e-mail aprovado na Cakto. | Copy a trocar na etapa de cadastro. |
| Admin | `/admin?tab=` com visão, CRM, produtos, materiais, questões, edições, entregas, equipe. Permissões em `lib/admin-permissions.ts`. | Novas abas: Alunos e cadastros, Pagamentos Pix, Planos. |
| Frequência | `operacao_state` (attempt/session/read…) e `momentum.ts` já definem dia ativo por atividade pedagógica. | Reutilizar para "dia ativo de estudo" no CRM (login não conta). |
| Banco | `scripts/hostinger-mysql-schema*.sql` (01–05). | Migração 06 criada. |

## 2. Entregue nesta etapa (testado localmente)
- `lib/planos/model.ts`: planos Grátis/Essencial/Premium; ofertas em centavos BRL com versão e vigência (`validateOffer`, `currentOffer`); `rightsFor` (Grátis só para conta verificada, maior direito ativo vence, reembolso remove só aquele pedido, plano desconhecido ignorado); cota diária com deduplicação e janela em `America/Sao_Paulo` (`consumeDaily`).
- `lib/pix/payload.ts`: leitura/validação do Pix Copia e Cola (CRC16, valor, recebedor, estático × dinâmico). O sistema não gera o código: confere o que o banco gerou.
- `lib/pix/orders.ts`: estados `aguardando_pix → em_conferencia → pago / expirado / cancelado / reembolsado`; "Já fiz o Pix" idempotente e sem conceder direito; confirmação exige referência bancária e valor igual; mesma referência não paga dois pedidos; pagamento tardio decidido pelo operador; reembolso só de pedido pago.
- `scripts/hostinger-mysql-schema-06-pix.sql`: tabelas `pix_offers`, `pix_orders`, `pix_order_events`, `auth_identities` e colunas novas em `users`. Aditiva e repetível; não toca `orders`, `payment_events` nem `entitlements`.
- Testes: `tests/pix-planos.test.ts` (9). Total 137/137; `tsc` e ESLint limpos. Os códigos Pix dos testes são **sintéticos** (chave e recebedor fictícios).

## 3. Estado por requisito
| Requisito | Estado |
|---|---|
| Catálogo de planos/ofertas e direitos (domínio) | implementado e testado localmente; **não ligado às rotas** |
| Validação de QR/Copia e Cola e pedido Pix (domínio) | implementado e testado localmente |
| Migração 06 | escrita; **não aplicada** em nenhum banco; as colunas novas são verificadas em `information_schema` (funciona em MySQL e MariaDB) |
| Cadastro público (e-mail/Google), verificação, onboarding | **pendente** |
| Grátis no portal (abrir `operacaoUser`, cotas, unidade introdutória) | **pendente** (precisa definir a unidade grátis da Trilha e os limites) |
| Checkout Pix (telas, QR, Meus pagamentos, link do responsável) e fila de conciliação | **pendente** |
| Admin (Alunos e cadastros, Pagamentos Pix, Planos e configuração) | **pendente** |
| Corte da Cakto para compras novas | **pendente** (fica por último; webhook antigo permanece) |
| Privacidade/termos para os novos métodos e menores | **pendente** |

## 4. Dependências do proprietário
Recebedor, Pix Copia e Cola do Essencial e do Premium (e imagem, se aplicável), preço final, prazo de conferência. Para Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e callback `https://godeveducation.com.br/api/auth/google/callback` (homologação: o domínio de teste equivalente). Chaves de Resend já existentes.

## 5. Reversão
Esta etapa só adiciona arquivos; basta descartar a branch. A migração 06, quando aplicada, é removível sem afetar o legado.
