# Correções da revisão da branch `feature/jornada-pix-gratis`

Resposta aos 10 achados da revisão (alto esforço, `main...HEAD`). Nada em `main`.

| # | Achado | Correção | Verificação |
|---|---|---|---|
| 1 | Grátis via o catálogo todo nas páginas e em flash/read/toggle | `lib/planos/scope.ts` (catálogo por plano: módulos, questões e fórmulas do módulo introdutório); materiais, módulo, fórmulas, flash cards, treino rápido e banco listam por ele; `/api/operacao` nega `read`, `flash`, `toggle` e `review` fora do escopo | Servidor local (conta Grátis): outro módulo → bloqueio; lista com 1 módulo; treino rápido com as 28 questões do módulo; `read` de outro módulo 403, do livre 200; flash fora 403 |
| 2 | `ADD COLUMN IF NOT EXISTS` não existe no MySQL | Migração 06 verifica `information_schema` e só então altera (MySQL e MariaDB, repetível); docs corrigidos | Revisão do SQL; **não executada em banco** |
| 3 | Rascunho invisível com oferta ativa | Admin mostra "À venda agora" e "Versão em edição"; o rascunho pode ser conferido e ativado | `tsc`/lint; tela não testada com banco |
| 4 | Checagem de e-mail limitada a 1000 usuários | Consulta direta `SELECT ... WHERE email`; corrida de signUp 409 devolve a mensagem genérica; `request-password` também consulta direto e agora **atende conta Grátis** (antes ela não conseguia recuperar a senha nem reenviar o link) | `tsc`; fluxo de e-mail não executado |
| 5 | Redirect do corte usava `req.url` | Usa `appUrl` | Redirect testado localmente antes; mudança de origem só por inspeção |
| 6 | Pedido duplicado e cota não atômicos | `createOrder` trava a linha do aluno (`FOR UPDATE`); cota do Grátis serializada por aluno (`lib/planos/lock.ts`) | 12 respostas simultâneas: 10 aceitas, 2 recusadas; teste unitário da trava. A trava da cota vale para **um** processo Node; com várias instâncias seria preciso trava no banco |
| 7 | Recebedor e data sem validação | `evidenceProblems`: recebedor igual ao da oferta, data válida, não futura e não anterior ao pedido (folga de 1 dia) | Teste unitário |
| 8 | Consultas repetidas | `overview()` em paralelo; `pixReadiness` memoizada por requisição (`cache`) | `tsc`/lint |
| 9 | Constantes e HMAC duplicados | `lib/auth/terms.ts` e `lib/auth/oauth-cookie.ts` | `tsc` |
| 10 | Sem testes na camada SQL | +3 testes (conferência, módulo grátis, trava); **a camada SQL (`store.ts`, `students.ts`, callback do Google) continua sem teste automatizado** e precisa de homologação com banco | `pnpm test` 154/154 |

`pnpm build` ok com as chaves desligadas.

## Ainda aberto
Homologar `store.ts`/CRM/Google num banco de teste; a sugestão do "Seu próximo passo" no Início pode apontar para conteúdo fora do escopo Grátis (a página mostra o aviso de upgrade); testes e2e antigos continuam desatualizados.
