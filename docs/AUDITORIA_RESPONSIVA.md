# Auditoria responsiva, interações e desempenho — checklist persistente

Atualizado em 2026-11-09. Repositório `kauangodev/desbloqueia-enem`, domínio `godeveducation.com.br`.
Método e limites estão em cada bloco. Situações usadas: **Não iniciado**, **Em verificação**, **Verificado sem alteração**, **Corrigido e retestado**, **Bloqueado**.

Ferramentas: navegador embutido do app (sessão de administrador já aberta, emulação de viewport), Playwright + Chrome (páginas públicas e testes de formulário com interceptação), axe-core (páginas públicas), Lighthouse 12 (landing). A medição automática por script mede: rolagem horizontal da página, elementos fora da largura, texto cortado por `overflow:hidden`, fontes < 11 px.

## 1. Matriz de áreas autenticadas (perfil administrador)

Resultado `ok` = `scrollWidth == largura`, sem elementos fora da tela, sem texto cortado. Tabelas e carrosséis têm rolagem interna própria e foram excluídos da contagem de "fora da tela".

| Rota | 320×700 | 360×740 | 430×932 | 768×1024 | 1024×768 | 1280×800 | 1920×1080 | 2560×1440 | Situação |
|---|---|---|---|---|---|---|---|---|---|
| /aluno | ok | ok | ok | ok | ok | ok* | ok | ok (corrigido) | Corrigido e retestado |
| /aluno/materiais | ok | ok | ok | — | ok | — | ok | — | Verificado sem alteração |
| /aluno/exercicios | ok | — | ok | — | — | — | — | — | Parcial |
| /aluno/simulados | ok | — | ok | — | — | — | — | — | Parcial |
| /aluno/cronograma | ok | ok | ok | ok | ok | — | ok | — | Verificado sem alteração |
| /aluno/checklists | ok | — | — | — | — | — | — | — | Parcial |
| /aluno/correcoes | ok | — | ok | — | — | — | — | — | Parcial |
| /aluno/biblioteca | ok | ok | ok | — | ok | — | ok | — | Verificado sem alteração |
| /aluno/conta | ok | ok | ok | — | ok | — | ok | — | Verificado sem alteração |
| /aluno/suporte | ok | — | ok | — | — | — | — | — | Parcial |
| /aluno/ler/ebook-15-matematica | ok | ok | ok | — | ok | — | ok | — | Verificado sem alteração |
| /aluno/operacao-segundo-domingo | ok | — | — | — | — | — | — | — | Parcial |
| …/operacao-segundo-domingo/treinos | ok | — | — | — | — | — | — | — | Parcial |
| …/operacao-segundo-domingo/questoes | ok | ok | — | ok | ok | — | ok | — | Verificado sem alteração |
| …/operacao-segundo-domingo/erros | ok | — | — | — | — | — | — | — | Parcial |
| /admin?tab=visao | ok | ok | — | ok | ok | ok | ok | ok | Verificado sem alteração |
| /admin?tab=alunos (CRM) | ok | ok | — | ok | ok | — | ok | — | Verificado sem alteração |
| /admin?tab=produtos | ok | ok | — | — | ok | — | ok | — | Verificado sem alteração |
| /admin?tab=materiais | ok | — | — | — | — | — | — | — | Parcial |
| /admin?tab=questoes | ok | ok | — | ok | ok | — | ok | — | Verificado sem alteração |
| /admin?tab=entregas | ok | ok | — | ok | ok | — | ok | — | Verificado sem alteração |
| /admin?tab=equipe | ok | — | — | — | — | — | — | — | Parcial |
| /admin?tab=tickets, suporte | ok | — | — | — | — | — | — | — | Parcial |
| /admin?tab=integracoes, /admin/materiais | — | — | — | — | — | — | — | — | Não iniciado |

`—` = não executado nesta combinação (não presumir aprovação). `*` 1280 foi verificado apenas na rodada anterior (landing, painel).
Alturas: as indicadas na linha de cabeçalho; notebook baixo 1280×560 verificado em /aluno (sidebar rola internamente, último item visível).

### Problemas encontrados na matriz e correções
| Onde | Problema | Correção | Situação |
|---|---|---|---|
| Barra superior do aluno, 320 px | Campo de busca ficava com ~22 px de largura | Menos espaço entre itens e padding menor até 420 px | Corrigido (reteste após o deploy desta rodada) |
| Navegação do aluno | Selo "Reta final" com 10 px | 12 px | Corrigido |
| /aluno em 2560 px | Conteúdo esticado a 2312 px | Largura máxima 1560 px a partir de 1700 px | Corrigido e retestado (rodada anterior) |
| Tabelas do admin | Rolagem interna existia, sem indicação de colunas extras nem foco por teclado | Sombras laterais, `tabIndex=0`, `role=region`, `aria-label` | Corrigido (reteste após o deploy) |

## 2. Páginas públicas (Playwright, produção)

15 combinações de tela + zoom 200 % (DPR 2) + texto 200 %, em /landing, /entrar, /politicas/privacidade, /suporte, /convite e 404: sem rolagem horizontal depois das correções (banner de cookies em ≤390 px e 404 com texto ampliado foram corrigidos). axe 4.x (WCAG 2 A/AA e 2.1 AA): 0 violações em desktop e celular.

## 3. Interações

| Item | Verificação | Resultado | Situação |
|---|---|---|---|
| Tabelas (admin) | 2 tabelas no CRM/equipe com `.table-wrap` (overflow auto). Largura da tabela 680–1062 px em contêiner de 358 px | Página não transborda; rolagem horizontal própria | Corrigido (indicador e foco) |
| Modal: mapa de questões | Sheet com foco preso, Escape, bloqueio de fundo (rodada anterior, 390 px) | ok | Verificado |
| Modal: aviso de cookies | Foco, Escape, botão cortado ≤390 px; altura máxima em paisagem | Corrigido | Corrigido e retestado |
| Modal: oferta Premium (landing) | Não aberto nesta rodada | — | Não iniciado |
| Confirmação "Recomeçar" | Implementada; não exercitada na tentativa real | — | Bloqueado: requer conta de teste |
| Toasts | Não existe componente de toast; o projeto usa mensagens inline com `role=status` | — | Não aplicável |
| Formulário /entrar | Obrigatório, e-mail inválido, erro do servidor (resposta interceptada), falha de rede, resposta lenta + duplo clique | Dados preservados; botão reabilitado; 1 requisição no duplo clique. Antes: mensagem com `role=status` e sem `aria-invalid`/`aria-describedby` | Corrigido (reteste após deploy) |
| Formulários administrativos | Não enviados (alterariam dados reais) | — | Bloqueado: requer registro/conta de teste |
| Teclado virtual | Aproximação com altura de viewport 190 px (não é teclado real) | Campo focado visível, página rolável | Limitação: sem dispositivo real |
| Paisagem | 844×390, 667×375, 1024×600, 1180×820, 820×1180 em /landing; 844×390 em /entrar | Sem overflow; botões do banner visíveis | Verificado |

## 4. Desempenho (medição por Performance API no navegador embutido, produção, 1280×800, cache normal, sem throttling)

Não equivale ao Lighthouse. Três navegações por rota; valores individuais: FCP/LCP em ms; CLS; JS = KB transferidos; DOM = nós.

| Rota | LCP | CLS | JS KB | Nós DOM |
|---|---|---|---|---|
| /aluno | 156, 160, 152 | 0 | 413 | 518 |
| /aluno/ler/ebook-15-matematica | 116, 192, 120 | 0,035 | 516–1017 | 228 |
| …/operacao-segundo-domingo/questoes | 316, 252 | 0 | 416 | 451 |
| /admin?tab=visao | 376, 156 | 0 | 415 | 385 |
| /admin?tab=alunos | 164, 160 | 0 | 415 | 344 |

Sem gargalo comprovado; nenhuma otimização aplicada. Lighthouse nas rotas autenticadas: **Bloqueado** (exige cookie de sessão que não deve ser extraído do navegador; menor ação: rodar o Lighthouse do próprio DevTools com a sessão aberta).

## 5. Vidro e sombras

Tokens em `app/godev-refine.css` (`--float-*`, `--glass-*`). Vidro apenas na barra superior (`.portal-topbar`, `.site-header`), com fallback opaco e `prefers-reduced-transparency`. Cards decorativos sem moldura dura: cards do aluno e do admin (rodada anterior), `.stat`, `.materials-view`, `.manual-access-form`, `.admin-form`, `.form-card` (esta rodada). Leitor, tabelas e campos mantêm superfícies opacas e bordas.
