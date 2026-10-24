# Relatório pedagógico — meta de 2.100 questões

Data: 24/10/2026

## Contagem auditada

| Item | Atual | Meta | Estado |
| --- | ---: | ---: | --- |
| Simulados | 2 | 30 | pendente |
| Questões nos simulados | 24 | 600 | pendente |
| Listas de exercícios | 1 | 50 | pendente |
| Questões nos exercícios | 8 | 1.500 | pendente |
| Questões autorais interativas completas | 32 | 2.100 | pendente |
| Referências na biblioteca | 1.800 | 1.800 | catálogo presente |
| Resoluções autorais conferidas na biblioteca | 7 | cobertura total | pendente |

## Validações executadas

- 32 IDs autorais são únicos.
- As 32 questões atuais têm cinco alternativas.
- As 32 questões têm gabarito, explicação e próximo passo.
- Não foram encontradas questões duplicadas no banco autoral atual.
- A biblioteca possui 1.793 registros marcados como pendentes e não deve ser tratada como banco interativo completo.
- A origem atual das questões autorais é `Autoral · matriz ENEM`; elas não são questões oficiais do Inep.

## Decisão de publicação

O critério de 2.100 questões não foi marcado como concluído. Produzir 2.068 questões novas com resolução confiável exige geração em lotes, validação automática e revisão pedagógica humana. Criar ou duplicar conteúdo apenas para alcançar o número violaria a regra de integridade do briefing.

## Próximo lote necessário

Antes de integrar novos lotes, o modelo precisa ser migrado de um array TypeScript para tabelas versionadas de questões, alternativas e atividades. A API de avaliações também precisa deixar de aceitar somente `simulado-1` e `simulado-2` e buscar o conteúdo protegido no servidor, sem enviar o gabarito ao aluno antes da submissão.

