# Auditoria de gabaritos

- O verificador atual confirma cinco opções e que o gabarito aponta para uma delas.
- As 32 questões autorais possuem explicação e próximo passo.
- Os gabaritos não foram classificados como infalíveis; o status permanece `revisao_inicial`.
- Não há evidência de validação independente de todos os cálculos nem revisão pedagógica humana dos 2.100 itens, porque esses itens ainda não existem no projeto.
- A correção atual do aluno calcula no backend o score da atividade carregada, mas ainda usa um catálogo TypeScript pequeno e não snapshots versionados de todas as questões.

