# Entrega — redesenho do /aluno e Trilha ENEM (branch `feature/aluno-redesign-trilha`)

Base: `main` em `29391c1`. **Não mesclado e não publicado.** Duas etapas, revisáveis em separado (ver "Commits").

## Baseline lido no checkout
- Next 16.4.6 (build com webpack), React 19, pnpm. Auth/dados: `lib/supabase.ts` é adaptador **MySQL** com sessão assinada própria; o README ainda cita o Supabase histórico.
- Progresso do aluno: tabela chave-valor `operacao_state (user_id, kind, ref, data)` via `lib/operacao/store.ts`. **Nenhuma tabela nova.**
- `TodayCard`/`todayPlan` já estavam ativos na `main` e foram evoluídos (não duplicados). "Retomar" antes levava à página genérica de treinos.
- Cascata CSS: o item "Operação 2º Domingo" do menu era destacado por regras com `!important` em `godev-operacao.css` (corrigido na origem).
- Lint global: 7 erros anteriores (2 em `components/site.tsx`/`support.tsx`, 5 `require()` em scripts). Nos arquivos tocados: 0 erros.

## Etapa 1 — shell, Início e Banco
| Área | O que mudou |
|---|---|
| Shell | Sidebar de 224 px sem rolagem horizontal (causa: link de cookies com 24 px de margem lateral; rolagem do menu oculta e rótulos quebram linha em vez de truncar). Item da campanha neutro até ficar ativo; um único item ativo. Topbar: busca rotulada "Buscar nos materiais", resumo de ritmo à direita em texto, perfil compacto. No celular, só busca e perfil (o ritmo fica no Início/Dashboard/Missões). |
| Início | Saudação curta → **"Seu próximo passo"** (ação única, motivo, duração, alternativas) → 4 atalhos → resumo de progresso uma vez (com link ao Dashboard) → próximas tarefas. Removidos a lista longa de materiais e o cartão de ritmo duplicado. |
| `todayPlan` | Ordem documentada em `lib/aluno/today.ts`: sessão em andamento → **Trilha** → revisões vencidas → erros → lacuna do diagnóstico → primeiro treino → próxima revisão → leitura → treino rápido. Sessão iniciada há 3+ dias **sem nenhuma resposta** deixa de dominar (vai para o fim). "Retomar" abre a sessão certa (`/treinos?abrir=<tipo>`). |
| Banco / Meus erros | H1 "Banco de questões"/"Meus erros"; "Operação 2º Domingo" vira trilha de navegação. Aviso de data só na visão geral. Navegação local em abas (colapsa em botão "Seções da Operação" no celular, com Esc e foco). Busca + disciplina + tópico + **"Filtros (n)"** (painel com origem, ano, dificuldade, duração, status), chips removíveis, contagem. Metadados em texto; favoritar/revisar com ícone e rótulo; "Confirmar resposta" é a ação principal. Parâmetros `d t o df y q dur s m n` preservados. |

## Etapa 2 — Trilha ENEM
Rotas: `/aluno/trilha` (mapa), `/aluno/trilha/[unit]`, `/aluno/trilha/[unit]/[stage]` (`pratica|desafio|teste|revisao`), `POST /api/trilha`.

Arquivos: `lib/trilha/model.ts` (regras puras), `lib/trilha/service.ts` (persistência), `app/api/trilha/route.ts`, `components/trilha/*`, `app/trilha.css`, `lib/operacao/attempts.ts` (gravação de tentativa compartilhada com Banco/Caderno/Dashboard), `lib/operacao/{kv,memory-kv}.ts`.

**Modelo de dados** (sem migração): novos `kind` em `operacao_state`: `trilha-u` (estado da unidade), `trilha-s` (sessão da etapa), `trilha-pref` (série/modo). O fundamento reaproveita o evento `read` do módulo; respostas reaproveitam `attempt`.

**Regras de jogo (propostas, configuráveis em `model.ts`)**
- Unidade = módulo publicado (IDs `u-<módulo>`); pré-requisitos editoriais em `PREREQUISITOS` (validados: sem ciclos nem órfãos).
- Fundamento (ação explícita) → Prática guiada (4 itens, correção a cada resposta) → Desafio ENEM (5 itens, correção só na entrega, meta 80% arredondado para cima = 4 de 5, em branco vale zero) → Revisão espaçada 1, 3 e 7 dias (3 itens, meta 2 de 3; erro volta ao início) → **Teste de avanço** (5 itens; valida só a própria unidade, não libera pré-requisitos).
- "Concluída por estudo" e "Dominada pelo teste" são registros distintos. Modo **Aprender** segue a ordem; **Treinar** dispensa fundamento e pré-requisito para prática e desafio.
- Itens: seleção determinística por semente, prioriza inéditos (nova tentativa = itens novos quando há acervo); com acervo curto repete e avisa.
- Servidor valida unidade, etapa, pré-requisito, item e gabarito. Resposta repetida devolve a primeira; entrega repetida/simultânea grava uma tentativa e um resultado (dedupe por ID de sessão e por item).

**Cobertura real** (do catálogo publicado): Matemática 12 unidades; Natureza 20 (Física 6, Química 6, Biologia 8); **Humanas, Linguagens e Redação: 0** — a tela mostra "cobertura em preparação" e links aos materiais, sem indicador de conclusão. Cada unidade tem 9 a 29 questões; 32/32 com a sequência completa. Série e objetivo são guardados, mas **ainda não alteram a recomendação** (o acervo não tem marcação por série); a tela diz isso.

## Evidências (comandos desta máquina)
- `pnpm test`: **119/119** (novos: `trilha-model` 11, `trilha-service` 8, `today` 9, `filters`, `aluno-logic`, `momentum`).
- `pnpm exec tsc --noEmit`: limpo. `pnpm build`: concluído (rotas `/aluno/trilha`, `[unit]`, `[unit]/[stage]`, `/api/trilha`).
- Navegador (Chrome via Playwright, servidor local com usuário de teste, perfil **aluno comum** Essencial): cenário completo **24/24**: aluno novo → mapa → bloqueio com motivo → fundamento persistido após recarregar → prática com erro e correção → desafio sem gabarito antes da entrega → recarregar restaura respostas → reprovação (2/5, meta 4/5, ações de reforço) → novo desafio com itens inéditos → aprovação → unidade concluída → unidade seguinte abre → Início segue a Trilha → Caderno recebe os erros → Banco com enunciado a 473 px do topo em 1366×768.
- Layout: **38/38** — 10 telas × 8 larguras (320, 360, 390, 430, 768, 1024, 1366, 1440) e zoom 200% sem rolagem horizontal de página nem de menu; alvos de toque ≥ 44 px nos controles principais a 390 px; contraste efetivo ≥ 4,5:1 nos textos medidos (a medição achou e corrigiu texto escuro sobre fundo escuro em botões e na aba ativa); Esc fecha o painel de filtros e devolve o foco ao botão.
- Capturas em `docs/evidencias-redesign/` (Início, Banco, filtros abertos, mapa, unidade, prática, resultado do desafio; 1366 e 390 px).

## Não verificado / limitações
- **Persistência em MySQL real**: testada com o armazenamento em memória (mesma interface `Kv`) e no navegador local; o caminho MySQL (`upsert` em `operacao_state`) é o já usado em produção, mas esta etapa não foi exercitada num banco de homologação (não existe). Sem transação no armazenamento: duas requisições simultâneas ao **mesmo item** podem gravar a tentativa duas vezes no histórico (XP não muda: vale a 1ª).
- Capturas **"antes"** não foram salvas como arquivo (produção exige login no Chrome do proprietário); o estado anterior está descrito acima e nos commits `29391c1`/`01382b0`.
- Leitor de tela, gaveta do menu móvel (foco ao fechar) e checkout/Cakto/reembolso **não foram testados**; `test:e2e` do repositório não rodou (sem navegador do Playwright; o Chrome instalado foi usado só nas verificações acima, fora do repositório).
- Tema claro não foi estendido: a área do aluno continua sempre escura.
- Revisão vencida foi testada por data simulada nos testes de serviço, não esperando 1 dia.

## Decisões que mudam a experiência
1. Início deixou de listar materiais e de repetir métricas; o acervo fica em "Meus materiais".
2. "Trilha ENEM" entra em Estudar e no Início. Humanas/Linguagens/Redação aparecem como "em preparação".
3. Em "Aprender", prática exige fundamento marcado e desafio exige prática concluída (teste de avanço sempre disponível).

## Publicação na Hostinger e reversão
1. Revisar a branch e mesclar na `main` (push na `main` dispara o deploy; ~8 min). Nenhuma variável de ambiente nova, nenhuma migração.
2. hPanel → Implantações: aguardar "Concluído · Atual". Conferir `/aluno`, `/aluno/trilha`, `/aluno/operacao-segundo-domingo/questoes?d=fisica&df=dificil&n=2`.
3. Reversão: reimplantar `29391c1` no hPanel (ou `git revert` do merge). Os registros `trilha-*` ficam inertes no banco e **não afetam** o código anterior; tentativas gravadas continuam válidas.
