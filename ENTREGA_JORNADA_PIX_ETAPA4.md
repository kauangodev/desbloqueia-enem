# Jornada Grátis + Pix — Etapa 4: CRM, frequência real e login com Google (branch `feature/jornada-pix-gratis`)

Para revisão. **Nada em `main`.** Google fica atrás de `NEXT_PUBLIC_FEATURE_GRATIS=1` **e** `NEXT_PUBLIC_FEATURE_GOOGLE=1` e de `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` no servidor; sem isso as rotas respondem 404 e o botão não aparece.

## CRM no admin (aba "Alunos e cadastros", `/admin?tab=cadastros`)
- Parte da tabela `users` (inclui quem nunca comprou). Busca por nome/e-mail e filtros de plano, origem (e-mail/Google/legado) e atividade (7 d, 30 d, nunca), com **paginação no servidor** (20 por página). Nunca seleciona hash de senha, token ou segredo.
- Colunas: origem, plano efetivo (Grátis/Essencial/Premium pelo maior direito ativo), cadastro, **último login** e **último estudo** como campos distintos, dias ativos 7/30, estado (verificada, pendente, suspensa). Conta pendente aparece com rótulo próprio e não acessa o estudo.
- **Dia ativo de estudo** (`lib/admin/frequency.ts`): dia em America/Sao_Paulo com resposta de questão, módulo concluído ou treino/simulado finalizado, lidos de `operacao_state`. Login e visita não contam. Aluno sem atividade mostra "sem atividade".
- Detalhe do aluno (`&id=`): conta, plano, origem, Google vinculado, frequência, pedidos Pix e direitos.
- Indicadores com a definição de cada número: cadastros 7/30 d, verificados e pendentes, origem, quem fez a 1ª atividade, ativos 7/30 d, upgrades e receita Pix confirmados, pagamentos a conferir, conversão Grátis→pago por coorte (denominador: verificados dos últimos 30 d; numerador: com 1ª compra Pix confirmada).
- Permissão `students.read` exigida no servidor. Login passou a gravar `last_login_at` sem alterar `updated_at` (evita invalidar sessões de outros aparelhos).

## Login com Google (`/api/auth/google/start` e `/callback`)
Authorization Code + PKCE (S256) + `state` + `nonce` em cookie HttpOnly assinado de 10 min; escopos `openid email profile`; troca do código no servidor; ID token verificado (assinatura RS256 contra o JWKS do Google, emissor, audiência, validade, nonce, e-mail verificado). Identidade única `(google, sub)` em `auth_identities`; conta nova nasce **aluno**, já verificada, com aceite de termos exigido antes. Duas requisições simultâneas caem na unicidade e reaproveitam a mesma conta. Destino pós-login só relativo e interno (`/aluno`, `/admin`). **Colisão com e-mail de conta GoDev existente não vincula**: volta ao login pedindo entrada com a conta original; o vínculo por dentro da conta (prova de posse) **não foi implementado**. Conta suspensa é recusada.

## Verificação
- `pnpm test` 148/148 (novos: `admin-frequency` 4, `google-oidc` 4 — assinatura válida, adulterada, chave errada, `alg: none`, claims e redirect); `tsc`, ESLint e `pnpm build` ok.
- **Não verificado:** consultas SQL do CRM e o callback do Google nunca rodaram (sem MySQL local nem credenciais Google); nenhuma captura de tela do CRM.

## Pendente (estado verdadeiro)
- Vínculo seguro Google ↔ conta antiga a partir de "Minha conta"; "Entrar com Google" de conta já vinculada depende disso para contas legadas.
- Exportação autorizada com auditoria; filtros por período/coorte customizados; paginação do detalhe de atividade.
- Landing: três planos com "Criar conta grátis", botões "Pagar com Pix", preço único, remoção da taxa de R$ 0,99 e **bloqueio de novas vendas Cakto** (corte) — decisão do proprietário sobre o momento.
- Termos e privacidade atualizados (novos métodos, acompanhamento de estudo, menores) e revisados.
- Capturas desktop/celular de landing, cadastro, checkout, espera, confirmação, CRM e fila Pix.

## Configuração do Google (para o proprietário)
Cliente OAuth do tipo Web. Origem: `https://godeveducation.com.br`. URI de redirecionamento exato: `https://godeveducation.com.br/api/auth/google/callback` (homologação: o mesmo caminho no domínio de teste). Variáveis: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (somente servidor), `NEXT_PUBLIC_FEATURE_GOOGLE=1` (refazer o build).
