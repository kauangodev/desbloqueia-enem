# Baseline da área do aluno — 18/11/2026 (revisão `01382b0`, branch `main`)

Registro feito antes das mudanças desta rodada.

## Sistema real (confirmado no checkout)
- **Runtime/pacotes:** Next.js 16.4.6 (webpack no build), React 19, pnpm (lockfile `pnpm-lock.yaml`), Node na Hostinger como "Web App Node.js"
  com deploy por push na `main` do GitHub.
- **Autenticação e dados:** `lib/supabase.ts` é um adaptador **MySQL** (`lib/mysql.ts`, `mysql2`) com sessão assinada própria
  (cookie `godev_session`). O README descreve o Supabase histórico; o caminho ativo é MySQL. `identity()` e `canAccess(plano)` são a
  fonte de permissão. O usuário de teste local (`GODEV_DEV_USER=1`) só funciona fora de produção.
- **Esquema MySQL aplicável:** `scripts/hostinger-mysql-schema*.sql` (01–05), `hostinger-admin-management.sql`,
  `hostinger-ebooks-migration.sql`, `official-exams-migration.sql`. Progresso da Operação, flash cards, favoritos, sessões,
  tentativas e plano vivem na tabela chave-valor `operacao_state (user_id, kind, ref, data)`, acessada por `lib/operacao/store.ts`.
  **Nenhuma tabela nova foi necessária nesta rodada.**
- **Permissões:** `app/aluno/layout.tsx` exige sessão (redireciona para `/entrar`); `operacaoUser()` exige plano Essencial ou
  administrador; Premium libera biblioteca, simulados do banco geral e checklists; `proxy.ts` aplica `Cache-Control: private, no-store`
  em `/aluno/*`, `/admin/*` e APIs privadas.

## Rotas reais do aluno
`/aluno` (início), `/aluno/dashboard`, `/aluno/treino-rapido`, `/aluno/flash-cards`, `/aluno/missoes`, `/aluno/ofensiva`,
`/aluno/planos`, `/aluno/ler/[id]`, `/aluno/operacao-segundo-domingo/{,plano,materiais,materiais/[id],questoes,treinos,erros,formulas}`.
`/aluno/simulados`, `/aluno/correcoes`, `/aluno/cronograma`, `/aluno/exercicios`, `/aluno/materiais`, `/aluno/biblioteca`,
`/aluno/checklists`, `/aluno/conta`, `/aluno/suporte` e `/aluno/redacao` são atendidas pela rota dinâmica
`app/aluno/[section]/page.tsx` (mecanismo de roteamento do projeto). Seção desconhecida devolve 404.

## Fluxo de dados da prática
Resposta → `POST /api/operacao {action:"answer"}` → `recordAttempt` grava a tentativa (`attempt:<id>`, histórico de até 40) →
`loadProgress` (`lib/operacao/progress.ts`) deriva progresso, `momentum` (sequência, XP, missões) e conquistas. XP só na 1ª
tentativa. Sessões (treinos/simulados): `sessionStart/Save/Finish`, prazo e resultado calculados no servidor.

## Redação
`lib/features.ts`: `NEXT_PUBLIC_FEATURE_REDACAO === "1"` liga a Redação. Em produção a entrada do menu não aparece, ou seja, a flag está
desligada (variável ausente ou diferente de 1). A rota `/aluno/redacao` redireciona para `/aluno?aviso=redacao` com aviso. O motivo
documentado nos relatórios: correção automática em manutenção. Histórico: tabela `essay_submissions` (0 registros na última
leitura). **Não alterado nesta rodada.**

## Testes de base
- `pnpm test`: 86/86. `pnpm typecheck`: sem erros.
- `pnpm lint`: 7 erros e 102 avisos **já existentes** (2 em `components/site.tsx` e `components/support.tsx`, 5 `require()` em scripts).
- `pnpm build`: concluído. Playwright 1.64.1 instalado, mas sem navegador baixado nesta máquina: `test:e2e` não executado.
- Homologação como aluno comum: feita localmente com o usuário de teste (perfil student, plano Essencial); em produção, apenas com a
  sessão de administrador.

## Divergências registradas
- `PRODUCT.md`/`DESIGN.md` descrevem direção clara e editorial ("sem tema escuro obrigatório, neon"). O site publicado usa a identidade
  escura da GoDev (aprovada pelo proprietário em 14/11/2026, commits `b6005d3`/`413b154`). Esta rodada **mantém a identidade em produção**
  e não troca a paleta; atualizar `DESIGN.md` é decisão do proprietário.
- A área do aluno é sempre escura; o tema claro/escuro do seletor vale só para páginas públicas.
