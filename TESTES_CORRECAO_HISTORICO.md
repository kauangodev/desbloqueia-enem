# Testes de correção e histórico

## Comprovado

- `pnpm test`: 23 testes aprovados, incluindo autorização, isolamento RLS, persistência de tentativas, limites e pagamentos.
- `pnpm typecheck`: aprovado.
- `pnpm lint`: aprovado.
- `pnpm build`: aprovado.
- A API `POST /api/assessments` recalcula o score no servidor e grava `assessment_attempts` com respostas e data.
- O histórico filtra tentativas pelo usuário autenticado.

## Lacunas ainda abertas

- A interface calcula a correção detalhada localmente antes de confirmar a persistência.
- A tabela atual guarda respostas, mas não snapshot imutável do enunciado, alternativas e resolução.
- Não há fluxo completo de tentativa em andamento, retomada após rede, marcação para revisão ou navegação por índice.
- Não existem ainda 30 simulados e 60 listas para testar os critérios de quantidade.
- O teste de logout/login e consulta posterior de uma correção não foi executado com dados reais de produção.

