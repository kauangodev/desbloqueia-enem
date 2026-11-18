# Entrega — Etapa 1 da área do aluno (branch `feature/aluno-integrado`)

Base: `main` em `01382b0`. Contexto e baseline: `docs/BASELINE_AREA_ALUNO_2026-11-18.md`.

## Menor etapa publicável
Esta branch é a menor etapa publicável: **não há mudança de esquema, de variável de ambiente nem de dependência**. Tudo é aditivo
e reversível por `git revert`. A branch **não foi mesclada na `main`** (a `main` dispara deploy automático na Hostinger).

## O que foi implementado e comprovado

| Módulo | Implementado | Comprovado |
|---|---|---|
| Início: ação "Hoje" | `lib/aluno/today.ts` + `components/aluno/today-card.tsx`. Uma ação principal com motivo e duração (quando o acervo permite): retomar sessão mais avançada → revisões vencidas → caderno de erros → lacuna do diagnóstico → primeiro treino → próxima revisão → treino rápido. Alternativas sem repetir destino. Estado pós-prova explícito ("sem data oficial cadastrada para a próxima edição"). | 7 testes unitários; renderização local como aluno comum (perfil student, plano Essencial) em 360/390/430/768/1440 px. |
| Dashboard por período | 7/30/90 dias e tudo (`?p=`). Denominadores visíveis ("X de Y primeiras tentativas"), aviso de amostra pequena (< 10 questões), tópicos fracos ligados ao treino **e** ao módulo de conteúdo. `lib/operacao/diagnostic.ts` com janela. | 3 testes novos (janela, denominador, amostra). Em produção a versão anterior foi vista com dados reais; esta versão só localmente. |
| Banco e caderno de erros | Filtros combináveis (disciplina, tópico, origem, **ano da prova**, dificuldade, duração, status, busca) **na URL** (`?d=&t=&o=&y=&df=&dur=&s=&q=&m=&n=`), contagem "N de 600 no acervo", "Copiar link", "Ir para a questão". Valores inválidos viram o padrão. Link antigo `?m=` continua valendo. `lib/operacao/filters.ts`. | 4 testes; URL reescrita ao mudar filtro e filtros restaurados ao recarregar (verificado no navegador). |
| Layout responsivo | Medido com Playwright + Chrome instalado: 8 telas × 5 larguras, sem rolagem horizontal. | Resultado nesta rodada: 40/40 sem overflow de página. |

Já entregues antes (rodadas anteriores, em produção): menu agrupado, barra de ritmo, treino rápido, missões, ofensiva, flash cards
(revisão espaçada), planos, eliminar alternativa/rascunho/atalhos.

## Rotas
Sem rota nova. Alteradas: `/aluno`, `/aluno/dashboard`, `/aluno/operacao-segundo-domingo/{questoes,erros}`. Rotas do menu
(`/aluno/simulados`, `/correcoes`, `/cronograma`) seguem atendidas por `app/aluno/[section]/page.tsx`; URLs divulgadas
(`/aluno/exercicios`, `/aluno/biblioteca`, `/aluno/materiais`) também.

## Esquema / ordem de migração / configuração
- Nenhuma migração. Os cartões já usam `operacao_state` (`kind="flash"`), criada em `scripts/hostinger-mysql-schema-05-operacao.sql`.
- Nenhuma variável nova. `NEXT_PUBLIC_FEATURE_REDACAO` continua ausente/desligada em produção (Redação não reativada).

## Testes e evidências (comandos executados nesta máquina)
- `pnpm test`: **98/98**. `pnpm exec tsc --noEmit`: sem erros. `pnpm build`: concluído.
- `pnpm lint` global: 7 erros **anteriores** à mudança (2 em `components/site.tsx`/`support.tsx`, 5 `require()` em scripts); nos arquivos
  tocados: 0 erros.
- `pnpm test:e2e` **não executado**: o Playwright não tem navegador baixado aqui (o ajuste `channel: "chrome"` foi usado só nas
  verificações de layout, fora do repositório).
- Homologação como aluno comum: local (usuário de teste `GODEV_DEV_USER=1`, inativo em produção). Persistência real e Cakto não foram
  exercitadas fora de produção, porque **não há ambiente de homologação com banco separado** (veja pendências).

## Publicação na Hostinger
1. Revisar o PR `feature/aluno-integrado` → `main`.
2. Mesclar. O hPanel (Sites → godeveducation.com.br → Implantações) faz o build do commit da `main` (cerca de 3 min). Aguarde "Concluído · Atual".
3. Conferir: `/landing` (200), `/aluno` com sessão (início com "Hoje"), `/aluno/dashboard?p=7`,
   `/aluno/operacao-segundo-domingo/questoes?d=fisica&df=dificil`.
4. **Reversão:** no hPanel, reimplante o commit anterior (`01382b0`) ou `git revert <merge>`. Como não há dado novo no banco, a reversão é
   compatível com tudo que os alunos gravaram.

## Pendências (não iniciadas nesta rodada) e por quê
| Item | Situação | Dependência / impacto |
|---|---|---|
| Simulados com formatos por dia/reduzido/personalizado, parâmetros versionados e concorrência entre abas | Não iniciado | Exige decisão de produto (formato oficial) e testes de concorrência com banco real |
| Flash cards com fila no servidor e cartões privados do aluno | Não iniciado | Novo tipo em `operacao_state` + edição; a fila atual é calculada no cliente |
| Trilha por série, plano determinístico editável, cronograma integrado | Não iniciado | Conteúdo de Humanas/Linguagens ainda não publicado na Operação |
| Linguagens (Inglês/Espanhol), Vestibulares, questões dissertativas | Não iniciado | Acervo com origem e permissão verificáveis (editorial) |
| Redação, Tutor IA, Professor IA | Não iniciado | Chave e cota do provedor de IA, política de dados de menores, reativar a flag só após validar a correção |
| Amigos, grupos, feed, denúncias, ranking, loja | Não iniciado | Política de privacidade/retenção para menores, moderação, esquema novo e transações idempotentes |
| Idempotência de XP/missões por evento persistido | Parcial | O XP continua derivado das tentativas (1ª tentativa por questão), o que já evita duplicidade; eventos persistidos exigem migração |
| Homologação de compra/reembolso | Não feita | Precisa de ambiente Cakto de teste e banco separado |
