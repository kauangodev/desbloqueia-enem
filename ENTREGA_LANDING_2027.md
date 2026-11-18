# Landing 2027 — auditoria, implementação e evidências (branch `feature/landing-2027-conversao`)

Para revisão. **Nada em `main`.** Parte da branch `feature/jornada-pix-gratis`: a landing usa o cadastro Grátis e o checkout Pix dessa branch, atrás das mesmas chaves (`NEXT_PUBLIC_FEATURE_GRATIS`, `NEXT_PUBLIC_FEATURE_PIX`). Com as chaves desligadas ela funciona (CTA "Testar uma questão" e planos "Falar com o atendimento"/Cakto, como hoje).

**Skills externas (Anthropic `frontend-design`, `impeccable`, `cro`, `web-design-guidelines`, `analytics`):** não foram instaladas nem tiveram `SKILL.md` lido neste ambiente. A metodologia foi aplicada a partir da descrição do prompt (critique/audit/distill/polish, hipótese→métrica, checagem técnica de teclado/foco/formulários) e de ferramentas já disponíveis (Playwright no Chrome instalado, axe do projeto). Nenhum script remoto foi executado.

## 1. Auditoria (antes) — `evidencias-landing/antes/` (versão publicada, 1440/768/390, tema escuro)
| # | Achado | Viewport/estado | Efeito no usuário | Arquivo | Correção | Evidência depois |
|---|---|---|---|---|---|---|
| 1 | Barra fixa "CONHECER OS PLANOS" duplicava o CTA do topo e cobria o começo da questão | 390, topo | Duas ações iguais na mesma tela; demonstração cortada | `SalesSticky.tsx` | Barra só aparece depois que o topo saiu da tela e some sobre planos/acesso | `depois/*-390-topo.png` |
| 2 | Topo com 3 blocos de metadados (3 condições, "pela Cakto", calendário) + leque de capas competindo com a questão | 1440/390 | Promessa diluída; a demonstração (prova do produto) era secundária | `SalesSections.tsx` (`SalesHero`) | H1 + 1 parágrafo + 1 ação dominante + 1 alternativa; capas movidas para "Por dentro do material"; calendário numa linha | `depois/*-topo.png` |
| 3 | CTA em caixa alta, degradê e brilho laranja | todos | Peso visual de peça promocional; texto alto cansa | `landing-sales.css`/`landing-plus.css` | Laranja sólido, texto normal, foco visível de 3px | `depois/*-topo.png` |
| 4 | Capas e listas antes do preço nos cartões de plano | 1440, planos | Preço e ação só depois de ler tudo | `SalesOffers` | Nome → intenção → preço → ação → benefícios; 3 planos (Grátis/Essencial/Premium) lado a lado | `depois-gratis-pix/*-planos.png` |
| 5 | Texto antigo: "Matemática e Natureza com a Matemática e Natureza", "além da Operação" | planos/amostras | Copy confusa e termo interno | `SalesSections.tsx` | Reescrito; sem "Operação" (teste e2e garante) | teste `sem textos antigos` |
| 6 | Cabeçalho com barra laranja de rolagem e seletor de tema largo (3 botões) | 1440 | Ornamento disputa atenção; controle ocupa o cabeçalho | `site.tsx`, `theme-toggle.tsx`, CSS | Barra removida; seletor compacto (Claro/Escuro/Sistema) | `depois/*-topo.png` |
| 7 | Prévia da Trilha era uma lista estática | trilha | "Prévia" sem interação | `SalesTrilha` | `TrilhaPreview`: troca de unidade e etapa, questão real do acervo, marca "Grátis"/"Essencial" | teste e2e da prévia |
| 8 | Após a resposta só havia "Quero treinar assim todo dia" → planos | demo respondida | Destino não correspondia ao rótulo; foco perdido ao reiniciar | `TryQuestion.tsx` | "Praticar na GoDev" → cadastro (grátis ativo) ou planos; foco volta à 1ª alternativa | teste de teclado |
| 9 | Alvos de toque < 44px no rodapé e em links de frase; inputs de 14px (zoom no iOS); tags de 11px | todos | Toque difícil; zoom automático | `public-theme.css`, `landing-plus.css` | 44px (rodapé, links de frase via padding/margin), 16px nos campos, tags 12px | auditoria `responsive.spec` |
| 10 | Teste e2e e auditoria estavam desatualizados (menu "Materiais", catálogo curvo, `.guarantee`, banner de cookies) | — | Suíte vermelha escondia regressões | `tests/e2e/*` | Atualizados/removidos com justificativa | 77/77 |

**Limitação das capturas:** as capturas "antes" em tema "claro" eram escuras (o site começa no escuro e a preferência não estava salva); só "depois" tem claro de verdade. Capturas guardadas: 1440, 768 e 390 em claro/escuro; 1024/360/320 ficam nas medições (`medidas.json`): 0 rolagem horizontal em todas.

## 2. O que mudou
- **Topo:** H1 "Saiba o que estudar para o ENEM 2027.", apoio "Siga uma trilha, resolva questões comentadas e volte aos temas em que mais precisa praticar.", ação dominante ("Começar grátis" com o Grátis ativo; "Testar uma questão" antes; "Continuar estudando" para quem tem acesso) e alternativa "Ver planos". Questão pública ao lado com peso visual maior; layout assimétrico, largura útil 1140.
- **Demonstração:** descarte reversível, correção com raciocínio e erro comum, "Tentar de novo" devolvendo o foco, "Praticar na GoDev".
- **Trilha:** prévia navegável (3 unidades reais; a primeira marcada "Grátis" quando o plano está ativo; Prática/Desafio mostram uma questão real do acervo; "Prévia da Trilha" diferenciada de progresso de aluno).
- **Planos:** 3 cartões comparáveis; preço e botão no alto; benefícios depois; comparação detalhada mantida; só benefícios habilitados; sem taxa e sem Cakto quando o corte Pix está ligado; botão de responsável oculto no Pix (link com token ainda não existe).
- **Cabeçalho/rodapé:** sem barra decorativa; seletor de tema compacto; rodapé com alvos de 44px.
- Âncoras `#amostra #beneficios #ofertas #acesso #duvidas #trilha #experimentar #planos` preservadas.

## 3. Eventos de negócio (mapa)
| Evento | Origem | Quando | Contagem |
|---|---|---|---|
| `landing_viewed` | navegador, com consentimento | visita (1×/página) | visitantes únicos (id aleatório) — **denominador de "visita elegível"** (acrescentado ao conjunto pedido) |
| `demo_started` | navegador | 1ª interação com a questão (1×/página) | visitantes |
| `demo_answered` | navegador | cada resposta (`correct: true/false`; sem a alternativa escolhida) | — |
| `plans_viewed` | navegador | seção de planos entra na tela (1×/página) | visitantes |
| `signup_started` | navegador | clique em botão com `data-signup` (hero, barra, plano, Trilha, pós-demo) | cliques |
| `signup_verified` | **servidor** | link de e-mail confirmado (só cadastro público) ou conta Google criada | 1 por conta (chave única) |
| `first_study_completed` | **servidor** | 1ª resposta registrada na conta (questão avulsa, treino ou Trilha) | 1 por conta (chave única) |
| `checkout_started` | **servidor** | pedido Pix **criado** (reaproveitar pedido aberto não repete) | 1 por pedido |
| `purchase_confirmed` | **servidor** | operador confirma o crédito (muda o estado); repetir/duas aprovações não contam | 1 por pedido (chave única) |

Abrir o QR e "Já fiz o Pix" **não** são eventos de venda. O navegador só pode emitir os 5 primeiros (o servidor devolve 400 para os de servidor). Parâmetros: lista fechada (`utm_*`, `plan`, `device`, `correct`, `visitor`), sem e-mail, resposta, QR ou código Pix. Sem consentimento nada é gravado nem enviado (teste e2e). Tabela `funnel_events` (migração `scripts/hostinger-mysql-schema-07-funnel.sql`) com índice único por (evento, chave de deduplicação). Painel: Admin → Alunos e cadastros → "Funil da landing (30 dias)" com as 5 taxas pedidas, numerador/denominador e "sem dados" (nunca 0%). Pixels de terceiros (Meta/TikTok/GA) continuam só com consentimento; **o evento de compra confirmada não é enviado a pixels** (acontece no servidor, sem consentimento do navegador); a conversão offline para anúncios fica como evolução.

Ressalva de método: "visita → cadastro verificado" divide contas (todas) por visitantes (só quem consentiu); é indicativa até haver uma medição de visita sem consentimento agregada.

## 4. Verificação
- `pnpm test` 158/158; `tsc` ok; `pnpm build` ok com as chaves desligadas e ligadas.
- **Playwright (Chrome instalado): 77/77 com as chaves desligadas e 77/77 ligadas**, incluindo: sem consentimento 0 eventos; com consentimento exatamente `landing_viewed`, `demo_started`, `demo_answered(correct=false)` e `plans_viewed` sem dados pessoais; atribuição `utm_*` já no primeiro evento; servidor recusa eventos forjados (400) e origem externa (403); demonstração por teclado e foco; prévia da Trilha; 0 rolagem horizontal a 320/390; âncoras; **axe automatizado da landing e entrada**; auditoria responsiva (7 rotas × 7 larguras: sem rolagem, texto ≥ 12px, campos ≥ 16px, controles ≥ 44px).
- Medições: 0 rolagem horizontal em 1440/1024/768/390/360/320, claro e escuro.
- **Não medido:** Core Web Vitals de campo (LCP/INP/CLS em p75) e Lighthouse comparativo; zoom de 200% por inspeção manual; leitor de tela real; SQL do funil (não executado em banco); recusa do `funnel_events` sem a migração 07 (a gravação falha em silêncio e o painel mostra "sem dados").
- Hipóteses de conversão (questão corrigida antes do convite do grátis; preço antes dos benefícios; aviso de análise Pix visível) **não foram testadas com tráfego**: não há resultado de conversão a reportar.

## 5. Pix: leitura dos anexos e privacidade
Os QR Codes do proprietário **não foram recebidos nem lidos aqui** (nenhum anexo nesta sessão); nada real entrou no repositório, em seeds, capturas ou logs. Observação de privacidade: um Pix estático e o Copia e Cola **contêm a chave** (aqui, um e-mail): exibir o QR não esconde a chave de quem o escaneia ou copia. Se o proprietário não quer divulgá-la, o banco deve gerar QR novos com chave aleatória ou e-mail comercial. O checkout só mostra o código ao aluno dono do pedido (autenticado), com `noindex`; o link do responsável com escopo limitado **ainda não existe**.

## 6. Sequência de lançamento
1. Aplicar migrações 06 e 07 em homologação (backup) e rodar `HOMOLOGACAO_JORNADA_PIX.md`.
2. Landing sem ligar nada (chaves desligadas): publicável de imediato como melhoria de topo/Trilha/planos.
3. `GRATIS=1` (revisão jurídica de termos/privacidade antes).
4. Dados Pix reais pelo admin (recebedor, códigos, preços, prazo) → prévia com o app do banco → "Ativar Pix".
5. `PIX=1` (corte da Cakto para compras novas). Reversão: desligar a chave e refazer o build.

## 7. Pendências e decisões abertas
Capas ainda trazem "ENEM 2026" na arte; depoimentos (nenhum publicado, não usados); Core Web Vitals de campo; link do responsável; envio da conversão confirmada a plataformas de anúncio; teste de usabilidade em celular real; experimento A/B só com volume e autorização.