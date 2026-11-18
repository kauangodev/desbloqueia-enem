# Roteiro de homologação — Jornada Grátis + Pix

Branch `feature/jornada-pix-gratis`. Use um **ambiente de teste com banco de teste** (nome contendo `test`, `homolog` ou `staging`). Nada aqui toca `main` nem o banco de produção.

## 0. Pré-requisitos
- Banco MySQL/MariaDB de teste com o esquema atual de produção (01 a 05) e **backup** feito.
- Deploy da branch no ambiente de teste (ou `pnpm build && pnpm start` local apontando para o banco de teste).
- Variáveis (valores de teste, nunca os de produção): `HOSTINGER_MYSQL_*`, `SESSION_SECRET` (32+ caracteres), `RESEND_API_KEY`/`EMAIL_FROM` (para e-mails reais de teste), `NEXT_PUBLIC_APP_URL` com o endereço do ambiente de teste.
- Chaves (todas **desligadas** no começo): `NEXT_PUBLIC_FEATURE_GRATIS`, `NEXT_PUBLIC_FEATURE_GOOGLE`, `NEXT_PUBLIC_FEATURE_PIX`. Chaves `NEXT_PUBLIC_` entram no build: mudar exige novo build.

## 1. Migração 06
1. Aplicar `scripts/hostinger-mysql-schema-06-pix.sql` no banco de teste (funciona em MySQL e MariaDB; pode ser repetida).
2. Conferir: tabelas `pix_offers`, `pix_orders`, `pix_order_events`, `auth_identities`; colunas `signup_source`, `terms_version`, `terms_accepted_at`, `marketing_optin`, `last_login_at` em `users`.
3. Conferir que `orders`, `payment_events` e `entitlements` antigos continuam com a mesma contagem de linhas.

## 2. Script automático (camada SQL)
```powershell
$env:HOSTINGER_MYSQL_HOST="..."; $env:HOSTINGER_MYSQL_DATABASE="godev_homolog"; $env:HOSTINGER_MYSQL_USER="..."; $env:HOSTINGER_MYSQL_PASSWORD="..."
$env:SESSION_SECRET="segredo-de-teste-com-32-caracteres-ou-mais"
$env:HOMOLOG_CONFIRM="sim"
node --require ./scripts/preload-server-only.cjs --import tsx scripts/homologacao-pix.ts
```
O script recusa rodar sem `HOMOLOG_CONFIRM=sim` ou se o nome do banco não contiver `test`, `homolog` ou `staging`. Usa só dados sintéticos (`hml-…@example.invalid`, recebedor "HML TESTE"), restaura as ofertas que estavam ativas e apaga o que criou. Verifica, entre outras coisas:
- oferta sem código ou com valor divergente **não** ativa; com código válido ativa; rascunho novo convive com a oferta ativa;
- 6 pedidos simultâneos do mesmo aluno → 1 pedido; outro aluno não vê o pedido;
- "Já fiz o Pix" idempotente e sem conceder direito;
- confirmação recusa recebedor errado, valor errado e data futura; 2 confirmações simultâneas → 1 efeito; direito criado para o aluno certo;
- mesma referência bancária não confirma outro pedido;
- CRM (lista, detalhe, indicadores, fila) e reembolso revogando só o direito do pedido.
Resultado esperado: `N/N verificações OK` e saída 0. **Qualquer FALHA bloqueia a homologação** (registre a saída).

## 3. Roteiro manual (UI) — com as chaves ligadas em etapas
Registre uma captura (desktop 1366 e celular 390) de cada passo marcado 📷.

**3.1 Cadastro grátis** (`GRATIS=1`)
- [ ] `/entrar?modo=cadastro` mostra termos (obrigatório) e novidades (opcional, desmarcado) 📷
- [ ] Cadastro sem aceitar os termos é recusado; com aceite, mensagem genérica
- [ ] Repetir com o **mesmo e-mail**: mesma mensagem genérica (sem revelar que existe)
- [ ] E-mail chega; link abre "definir senha"; após definir, entra e cai em `/aluno`
- [ ] Antes de confirmar o link, o login é recusado e o acesso ao estudo não existe
- [ ] Link vencido/reutilizado mostra erro com saída para pedir outro; "Primeiro acesso ou esqueci a senha" reenvia para conta Grátis
- [ ] No CRM, o cadastro aparece com origem "E-mail", plano Grátis, pendente → verificada

**3.2 Plano Grátis no portal**
- [ ] Início, Trilha, Treino rápido, Banco, Flash cards e Fórmulas mostram só o módulo da unidade introdutória 📷
- [ ] Outro módulo (`/aluno/matematica-natureza/materiais/<outro>`) mostra o aviso de Essencial 📷
- [ ] 10 questões no dia: a 11ª recusa com a mensagem de renovação; repetir uma já respondida não gasta
- [ ] `/aluno/materiais`, leitor e PDFs continuam exigindo plano pago
- [ ] Dia seguinte (fuso de Brasília): a cota renova

**3.3 Google** (`GOOGLE=1`, com `GOOGLE_CLIENT_ID/SECRET` de teste)
- [ ] Cliente OAuth do tipo Web; URI de redirecionamento exato: `<ambiente de teste>/api/auth/google/callback`
- [ ] Primeiro login cria aluno (origem Google, verificado); segundo login usa a mesma conta
- [ ] Google com e-mail de conta GoDev existente **não** vincula: volta ao login com a orientação
- [ ] Cancelar no Google, `state` adulterado e cookie vencido voltam ao login com mensagem
- [ ] Conta suspensa é recusada; destino externo (`redirect=https://…`) é ignorado
- [ ] **Pendente de implementação:** vínculo do Google a conta antiga por dentro de "Minha conta"

**3.4 Ofertas e checkout Pix** (admin de teste, papel proprietário/administrador)
- [ ] Admin → Pagamentos Pix: criar rascunho com **Pix Copia e Cola sintético** (gere com o script ou use um código de teste do banco de teste) 📷
- [ ] "Visualizar checkout" mostra o QR e o código iguais; "Ativar Pix" só habilita com CRC/valor/recebedor corretos
- [ ] Conta de teste: Planos → Pagar com Pix → revisar (total, recebedor, e-mail da conta) → pedido → QR + Copiar 📷
- [ ] "Já fiz o Pix" → "Aguardando conferência"; reabrir a página mantém o estado
- [ ] Admin: fila mostra o pedido; Conferir exige EndToEndId, valor, data/hora e recebedor; confirmação pede revisão do efeito 📷
- [ ] Após confirmar: aluno vê plano ativo; o acesso Essencial funciona; Meus pagamentos mostra "Pago"
- [ ] Reembolso: informar referência → acesso do pedido revogado, outros direitos preservados
- [ ] Sem oferta ativa, o plano aparece "Pagamento por Pix em breve" e o Grátis segue funcionando
- [ ] Papel `support`: vê a fila mas não confirma nem edita ofertas (403)

**3.5 CRM**
- [ ] `/admin?tab=cadastros`: indicadores com definição; filtros plano/origem/atividade; paginação 📷
- [ ] Aluno que só fez login não aparece como ativo no estudo; quem respondeu 1 questão aparece com 1 dia ativo
- [ ] Detalhe do aluno mostra último login × último estudo, pedidos e direitos

**3.6 Corte comercial** (`PIX=1`, depois de 3.1–3.5 aprovados)
- [ ] Landing mostra Grátis + Essencial + Premium, sem "R$ 0,99" nem "Cakto" (exceto a frase para quem comprou antes) 📷
- [ ] Mesmo total na landing, comparação, `/aluno/planos`, checkout e Meus pagamentos
- [ ] `/api/checkout/premium?utm_source=x&email=y` → 307 para o checkout GoDev só com `utm_source`
- [ ] Webhook antigo `/api/webhooks/cakto` continua respondendo para pedidos já existentes (reembolso/chargeback de compra antiga)
- [ ] Âncoras `#amostra #beneficios #ofertas #acesso #duvidas` presentes

## 4. Qualidade
- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` (com chaves desligadas e ligadas)
- [ ] Lighthouse/CWV da landing, 360/390/768/1024/1366/1440, 320 sem rolagem horizontal, zoom 200%
- [ ] Reescrever os testes e2e antigos (`tests/e2e/site.spec.ts`) e rodar `pnpm test:e2e`
- [ ] **Revisão jurídica** de termos/privacidade (inclui menores) antes de ligar `GRATIS` em produção

## 5. Dados que o proprietário fornece depois (sem mudança de código)
Recebedor (nome como no banco), Pix Copia e Cola do Essencial e do Premium (e imagem, se houver), preço final de cada plano e prazo de conferência. Operação: Admin → Pagamentos Pix → rascunho → prévia com o **aplicativo do banco** → Ativar Pix.

## 6. Aprovação e reversão
- Aprovar somente com: script 100% OK, 3.1–3.6 marcados, evidências anexadas.
- Reversão: desligar as chaves e refazer o build; ou redeploy do commit anterior. As tabelas e colunas da migração 06 podem ficar (inofensivas) ou ser removidas; pedidos Pix criados e direitos `pix:*` continuam válidos enquanto existirem.