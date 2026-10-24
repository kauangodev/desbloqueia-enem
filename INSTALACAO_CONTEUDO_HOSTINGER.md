# Instalação de conteúdo na Hostinger

O projeto atual ainda roda com Supabase e Vercel; não há driver, schema ou credenciais MySQL no runtime. Portanto, nenhuma importação Hostinger foi declarada como executada.

## Preparação necessária

1. Criar tabelas versionadas para questões, alternativas, atividades, versões, tentativas e respostas.
2. Importar somente lotes validados, com transação e chave idempotente.
3. Preservar snapshots usados nas tentativas históricas.
4. Criar índices por atividade, área, disciplina e usuário.
5. Manter gabarito no servidor e usar consultas parametrizadas.
6. Conferir contagens antes e depois da migração.

O arquivo `PROGRESSO_GERACAO_QUESTOES.json` registra o estado atual. A migração só poderá ser concluída com um banco Hostinger disponível e testes de autorização, persistência e recuperação executados nesse ambiente.

