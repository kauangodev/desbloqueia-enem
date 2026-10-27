# GoDev Education — auditoria do escopo de estudos/admin

Data da revisão: 27/10/2026. Domínio auditado: `https://godeveducation.com.br/`.

## Parecer

**Ainda não apto para liberação ampla nem para abertura de vendas.** O acesso autenticado do proprietário foi comprovado no `/admin` e no `/aluno`, o build local passa e a nova camada de gamificação foi implementada no código. Entretanto, a revisão final ainda não pode ser homologada em produção porque a fila da Hostinger permanece em construção, a migration MySQL de gamificação não foi executada, o acervo de questões contém duplicação indevida e os arquivos privados locais não reconciliam os 14 materiais anunciados.

Cakto e correção automática de redações estão fora deste cálculo, conforme escopo. A redação permanece em manutenção e as vendas continuam desativadas.

## Matriz ponderada

| Dimensão | Peso global | Nota da dimensão | Evidência | Estado |
|---|---:|---:|---|---|
| Funcionalidade, segurança, administração e persistência MySQL | 40% | 45/100 | Sessão real do proprietário em `/admin` e `/aluno`; typecheck e testes de pagamento; migration MySQL isolada não executada; administração ainda não cobre todo CRUD editorial | Parcial |
| Conteúdo: PDFs, questões, correções e histórico | 25% | 25/100 | 5 PDFs locais; 2.100 IDs, mas somente 332 grupos normalizados e 1.768 repetições; histórico de tentativas existe no código | Bloqueado |
| Responsividade, acessibilidade e qualidade visual | 20% | 50/100 | Rotas autenticadas abertas no navegador e testes E2E existentes; auditoria completa em todos os viewports ainda não executada | Parcial |
| Gamificação e integridade dos indicadores | 15% | 35/100 | Ledger, regras idempotentes, API e painel implementados; migration e teste real no MySQL ainda pendentes | Parcial |

**Percentual global verificável nesta execução: 39,5%.**

**Aprovação funcional estrita:** não calculada como aprovada; os bloqueadores críticos impedem contar o escopo como homologado. Para fins de acompanhamento, 25 testes automatizados do runtime existente passaram, mas eles não substituem homologação MySQL.

## Evidências executadas

- `pnpm typecheck`: aprovado.
- `pnpm test`: 25/25 aprovados.
- `pnpm build`: aprovado; a rota `/api/gamification` entrou no build.
- Sessão real do proprietário: `/admin` carregou o painel; `/aluno` exibiu “Administrador” e os materiais liberados.
- Leitor PDF: o worker `.mjs` antigo falhou por MIME; o worker `.js` foi publicado no GitHub, mas a fila da Hostinger ainda não terminou para permitir homologação final.
- Hostinger: o aplicativo aponta para `kauangodev/desbloqueia-enem`, branch `main`; as revisões recentes apareceram como `Construindo` durante a auditoria.
- phpMyAdmin: a página abriu, mas exigiu login próprio; nenhum segredo foi solicitado, lido ou registrado.

## Implementações desta revisão

- `scripts/hostinger-mysql-schema-04-gamification.sql`: tabelas idempotentes de ledger e metas.
- `lib/gamification.ts`: regras versionadas, XP por evento e deduplicação por usuário/atividade.
- `app/api/gamification/route.ts`: resumo e registro autorizado de eventos verificados no banco.
- `components/gamification-panel.tsx`: painel do aluno com nível, XP, dias e progresso.
- conclusão de atividade e tarefa passam a registrar eventos sem quebrar o estudo se a migration ainda não existir.
- leitor PDF usa o worker JavaScript publicado em `public/vendor/pdf.worker.min.js`.

## Bloqueadores e próxima ação segura

1. Concluir a fila da Hostinger e validar a revisão ativa no domínio; depois reabrir um PDF autenticado e verificar primeira página, navegação e progresso.
2. Fazer backup/exportação MySQL no hPanel/phpMyAdmin com a sessão do proprietário; executar `scripts/hostinger-mysql-schema-04-gamification.sql` uma vez.
3. Reconstruir/revisar o banco de questões até atingir pelo menos 1.800 identidades realmente distintas, com origem, gabarito e resolução conferidos. Não transformar cópias em itens novos.
4. Reconciliar os 14 registros do catálogo com arquivos duráveis no storage privado; hoje há 5 PDFs locais auditáveis.
5. Executar teste MySQL isolado e auditoria visual nos viewports 320–1920px antes de qualquer parecer de liberação.

Não há recomendação de abertura de vendas enquanto esses itens permanecerem pendentes.
