# Auditoria de lançamento — GoDev Educação (11/11/2026)

Escopo executado nesta rodada, com evidências. Itens não verificados estão listados como tais; nada abaixo é "aprovado" sem teste.

## 1. Baseline (antes das alterações)
- Repositório `kauangodev/desbloqueia-enem`, branch `main`, commit publicado `f602cf9` (Hostinger, Web App Node.js, deploy via push ao GitHub, status "Concluído · Atual" no hPanel).
- Domínio `godeveducation.com.br` (cabeçalho `platform: hostinger`).
- Landing: hero 3D (capas reais) + seção de demonstração com **questão de Linguagens** e menu que apontava para planos (itens C/B do briefing confirmados no código).
- Desempenho de laboratório do site publicado (celular emulado, 3 rodadas, sem throttling): LCP mediana 856 ms, CLS 0, long tasks (proxy de TBT) 63 ms, 1.844 KB, JS 1.126 KB. Não é INP de campo.
- Restauração: versão anterior = commit `f602cf9` (o hPanel mantém o histórico de implantações; reimplantar o commit anterior restaura o site).

## 2. Campanha (Inep)
- Segundo dia: **domingo, 15/11/2026**, provas de Ciências da Natureza e Matemática. Confirmado por leitura da página do Inep **via resumo automático** (a página tem ~100 mil caracteres e a leitura literal cobriu só o início); horários informados no resumo: portões 12h–13h, provas 13h30–18h30 (Brasília). Recomenda-se conferência humana do trecho.
- Contagem: já centralizada em `lib/campaign.ts` (fuso America/Sao_Paulo, nunca negativa, texto do dia da prova, urgência encerrada depois). Hoje a landing exibe "Faltam 4 dias" (calculado, não digitado).

## 3. Quantidades anunciadas × acervo real (P0 comercial)
| Item | Anunciado | Real (calculado dos dados) | Ação |
|---|---|---|---|
| E-books | 16 de 34 páginas | 16 PDFs, todos com 34 páginas | verificado, mantido |
| Kit de revisão | "87 páginas" (só no catálogo Cakto do repositório) | 5 PDFs somam **69 páginas** | texto corrigido |
| Banco geral | "2.100 questões autorais" | 2.100 posições, mas só **332 questões distintas** (Linguagens 78, Humanas 74, Natureza 74, Matemática 106): o mesmo item reaparece embaralhado | texto corrigido; calculado por código |
| Listas/simulados do banco geral | "60 listas = 1.500 q" e "30 simulados = 600 q" | 79 das 90 coleções tinham o mesmo item repetido dentro da própria coleção | a coleção agora nunca repete a mesma questão; texto corrigido |
| Operação 2º Domingo | — | **600 questões publicadas** (300 Mat, 100 Fís, 100 Quí, 100 Bio; 21 oficiais, 579 autorais), 32 módulos, 24 fichas, 5 simulados de 90, 11 treinos + diagnóstico | já vinha de `campaignFacts` (dinâmico) |
| Biblioteca histórica | "1.800 referências" | texto da própria plataforma já diz que é índice com links | verificado, mantido |
A vitrine de planos é lida do banco em produção; por isso `accurateFeatures` (lib/inventory.ts) normaliza as linhas inflacionadas independentemente do que estiver gravado no banco. **Pendência fora do repositório:** a página de produto na Cakto pode conter o texto antigo (não acessei a Cakto).
Direitos já concedidos não foram alterados (nenhum acesso removido).

## 4. Banco de questões
- Verificação estrutural de **todas** as 600 (Operação) e 2.100 (geral): ids duplicados, enunciado vazio, alternativas, gabarito válido, alternativas repetidas, resolução. Resultado Operação: 0 ids duplicados, 0 gabaritos inválidos, 10 resoluções telegráficas (apenas a conta). Banco geral: 332 distintas; 10 resoluções curtas; `reviewStatus` = "revisao_inicial" em todas.
- Corrigidas (resolução expandida, resultado conferido, gabarito inalterado): `aut-mat-048, s1-mat-031, s1-mat-033, s1-mat-038, s1-mat-042, s2-mat-033, s4-mat-020, s4-mat-032, s4-mat-033, s4-mat-037`.
- Heurística resolução × gabarito nos 600: 53 sinalizados por formato (R$, separador de milhar); revisei cada um e **todos coerentes**. Distribuição do gabarito equilibrada (A 122, B 117, C 120, D 120, E 121).
- Revisão pedagógica **item a item**: só os 10 acima e as 5 amostras públicas da landing (`aut-mat-003, aut-fis-005, aut-qui-001, aut-mat-005, aut-bio-008`, cálculos refeitos). **Não** declaro revisão pedagógica dos demais; **As 21 questões oficiais foram conferidas contra os gabaritos oficiais do 2º dia (Caderno 7 Azul) de 2016 e 2017 que estão no repositório: 21 de 21 batem.** Anulações e retificações posteriores não foram consultadas.

## 5. Landing: exploração navegável
- Hero com abas: Reta final (livros 3D preservados + disciplinas), Materiais (4 capas reais, amostra de leitura com fórmulas), Questões (feedback, resolução, erro comum), Simulado (mapa, dúvida, progresso, resultado demonstrativo "amostra de 5", sem TRI), Minha revisão (plano de exemplo com checklist). CTA comercial separado: "Acessar a preparação completa" (ou "Continuar minha revisão" para quem tem acesso).
- Demonstração com estado local, sem progresso real e só com 5 questões + 4 módulos enviados ao navegador. Primeira questão agora é de Matemática. Removidos a seção duplicada e o menu que apenas levava aos planos.
- Teclado: setas/Home/End nas abas; alternativas são rádios reais; leitor rolável é focável.

## 6. Matriz (Rota | Perfil | Dimensão | Estado | Evidência)
| Rota | Perfil | Dimensão | Estado | Evidência |
|---|---|---|---|---|
| `/` → `/landing` | Visitante | redirect, responsivo 320–1920, axe, console | Corrigido e retestado | scripts/audit-paginas.cjs: 6 larguras, 0 violações, 0 overflow |
| `/entrar`, `/suporte`, `/politicas/termos`, `/politicas/privacidade` | Visitante | 320–1440, axe | Verificado sem alteração | 0 violações, 0 overflow |
| `/comprar/essencial`, `/comprar/premium` | Visitante | axe | Corrigido e retestado | link de reembolso sem sublinhado (link-in-text-block) → sublinhado; 0 violações em 6 larguras |
| Marca (cabeçalho) | todos | axe label-in-name | Corrigido e retestado | nome acessível agora contém o texto visível |
| `/aluno/operacao-segundo-domingo/*` (7 rotas) | Aluno (conta demo local) | overflow 320 | Corrigido e retestado (rodada anterior) | alternativa marcada rolava o `<html>`; corrigido em `godev-operacao.css` |
| `/aluno`, `/aluno/{materiais,exercicios,simulados,checklists,correcoes,cronograma,biblioteca,conta,suporte}` | Aluno (conta administradora do proprietário, em produção, somente leitura) | 1600 px: overflow, h1, nomes de botões/links, alt, rótulos de campos, ids duplicados, sobreposições fixas | Verificado, 1 achado corrigido | script de DOM executado no navegador; 0 problemas estruturais. Achado: **título de aba idêntico** em todas as seções → `generateMetadata` por seção |
| `/aluno/operacao-segundo-domingo/*` (7 rotas) | Aluno (produção, leitura) | 1600 px | Verificado, 1 achado corrigido | links isolados "Ver no módulo" com 20 px de altura → 32 px (WCAG 2.2, 2.5.8). Alternativa marcada: confirmado em produção que o `<html>` não rola mais |
| `/admin?tab={visao,alunos,produtos,materiais,questoes,entregas,equipe,tickets}` | Administrador (produção, leitura) | 1600 px, mesmas checagens | Verificado sem alteração | 0 overflow, 0 controles sem nome, 0 ids duplicados. **Gráficos e tabelas só foram checados estruturalmente; dados, escala, legenda e toque não foram avaliados** |
| Telas autenticadas em celular | Aluno/Admin | 320–768 px | **Não verificado** | o Chrome conectado não aplicou o redimensionamento ao viewport (continuou 1600 px); o único teste autenticado em 320 px foi o da Operação, em conta demo local |
| Fluxo Cakto (compra→webhook→acesso) | — | funcional | **Não verificado** | requer sandbox/webhook; existe suíte `tests/payment.test.ts` (passa) |
Larguras intermediárias (360/430/600/820/1280/1366/1536/2560), paisagem, zoom 200% e teclado virtual: **não testados**. Emulação apenas; nenhum dispositivo físico.

## 7. Testes
- `npm test`: 66/66 (inclui novos testes de inventário e de coleções sem repetição).
- `tsc --noEmit`, `eslint` (arquivos alterados) e `npm run build`: sem erros.

## 8. Pendências reais (não concluídas)
1. Auditoria autenticada completa da área do aluno e do painel administrativo (gráficos, tabelas, CRM, permissões).
2. Teste ponta a ponta de compra/liberação (sandbox Cakto).
3. Revisão pedagógica integral dos 600 + 332 itens (as oficiais já têm gabarito conferido; falta o raciocínio das autorais).
4. Banco geral: 332 questões distintas para 60 listas/30 simulados — para entregar 1.500/600 questões distintas é preciso produzir conteúdo novo.
5. Texto da página do produto na Cakto.
