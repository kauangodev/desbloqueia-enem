# Marco 1 — Virada 2027 e fundação (branch `feature/virada-2027`)

Entregue para revisão e homologação. **Nada foi publicado em `main`.**

## O que mudou
- **Modelo de edições** (`lib/edicoes/model.ts`, `data/edicoes.ts`): edição ENEM 2027 ativa com todas as datas "a confirmar"; ENEM 2026 arquivada. Regra: nenhuma data de 2026 é reaproveitada para 2027. Texto exibido: "Calendário oficial do ENEM 2027 a confirmar". Fuso `America/Sao_Paulo`.
- **Rota** `/aluno/operacao-segundo-domingo/*` → `/aluno/matematica-natureza/*` (redirect 307, preserva caminho e query `d,t,o,df,y,q,dur,s,m,n`). O alias público `/operacao-segundo-domingo` também redireciona. 307 de propósito: um rollback não fica preso em 308 em cache.
- **Landing**: H1 "Sua preparação para o ENEM 2027, passo a passo.", CTAs "Conhecer os planos" / "Experimentar uma questão", prévia da Trilha, nav "Como funciona / Recursos / Planos / Dúvidas". Âncoras `#amostra #beneficios #ofertas #acesso #duvidas` preservadas (+ `#trilha`, `#experimentar`, `#planos`).
- **Plano de estudos**: janela móvel de 14 dias quando não há prova confirmada (não inventa dia de prova).
- **Textos**: "Operação 2º Domingo" e "Reta final 2026" removidos de app/components/lib.
- **RBAC**: `parseAdminRole` estrito; papel desconhecido falha fechado (`normalizeAdminRole` → menor privilégio; `hasAdminPermission`/`canGrantRole` negam).
- **Admin**: nova aba somente leitura "Edições e calendário" (`?tab=edicoes`).

## Migrações
Nenhuma. `operacao_state` mantém os mesmos `kind`; compras, acessos e progresso intactos. **Rollback**: redeploy do commit anterior no hPanel (os redirects somem junto).

## Verificação
- `pnpm test`: 126/126. `tsc --noEmit`: limpo. ESLint nos arquivos tocados: limpo. `pnpm build`: ok.
- E2E (Chrome instalado): 14 passam, incluindo `virada-2027.spec.ts` (redirect com query, login exigido nos caminhos novo/antigo, landing sem datas de 2026).
- **6 falham em `tests/e2e/site.spec.ts` por especificações antigas**, não por esta mudança: banner de cookies cobre o botão do menu (layout 320–430) e `.material-index` não existe mais na landing. Precisam ser reescritas.
- **Não feito**: capturas 360/390/768/1024/1366/1440, 200% de zoom, Core Web Vitals, WCAG automatizado nesta branch.

## Pendências e dependências (por estado)
| Item | Estado |
|---|---|
| Edições/calendário, redirects, landing, RBAC | implementado, testado localmente; **não homologado** |
| Trilha, Banco, Flash cards, Missões, Ofensiva, Planos, Treino rápido | já em produção (marcos anteriores) |
| Simulados catálogo, Redação IA, Vestibulares, Questões autorais, Tutor IA, Linguagens, Amigos/Grupos/Feed/Ranking/Loja, Configurações (exportar/excluir) | **não iniciados** |
| Admin: edição de edições, moderação, filas de IA, auditoria | não iniciado |

Dependências externas: calendário oficial do Inep 2027; chaves/cotas de provedores de IA; conteúdo editorial (Humanas, Linguagens, Redação, vestibulares, idiomas); política de moderação e privacidade para menores; homologação do Cakto. O texto de `products.features` no banco pode ainda citar 2026 (não alterado; ajuste manual).
