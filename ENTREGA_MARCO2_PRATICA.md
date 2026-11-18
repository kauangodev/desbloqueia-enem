# Marco 2 — Prática e currículo (branch `feature/virada-2027`)

Entregue para revisão. **Nada foi publicado em `main`.** Este marco foi pequeno de propósito: o acervo real só cobre Matemática e Ciências da Natureza, então várias linhas da matriz de paridade dependem de conteúdo editorial que ainda não existe.

## Implementado
- **Tópicos recorrentes** (`/aluno/recorrentes`, item "Tópicos recorrentes" em "Estudar"): conta as questões oficiais do acervo por tópico e ano (`lib/aluno/recorrentes.ts`), com atalhos para treinar (Banco filtrado por `d` e `t`) e rever o conteúdo. A página diz a amostra real (21 questões oficiais, 2016 e 2017, só Matemática e Natureza) e que **não é previsão** para 2027.
- Testes: `tests/recorrentes.test.ts` (2). Total `pnpm test`: 128/128. `tsc` e ESLint dos arquivos tocados limpos. Página respondeu 200 em dev com a conta de teste local, com o aviso de amostra e os atalhos.

## Estado da matriz (honesto)
| Item | Estado |
|---|---|
| Tópicos recorrentes | implementado e testado localmente; conteúdo **parcial** (2 anos, 2 áreas); não homologado |
| Banco unificado ENEM (4 áreas) | **pendente**: só Mat/Natureza no novo Banco; Linguagens/Humanas existem apenas no acervo antigo (`/aluno/exercicios`) |
| Simulados por formato | **pendente**: `/aluno/simulados` (antigo, Premium) e `/treinos` (novo) coexistem; unificar exige decisão de produto |
| Plano de estudos editável | pendente (hoje: plano automático, janela de 14 dias) |
| Vestibulares, Questões autorais (catálogo), Linguagens | pendente: sem conteúdo editorial |

## Para decidir
1. Unificar `/aluno/simulados` e `/treinos` em uma só tela (afeta o Premium).
2. Quais vestibulares entram primeiro e quem fornece as questões.

Rollback: redeploy do commit anterior; sem migrações.
