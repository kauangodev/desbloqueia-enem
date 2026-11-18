# Auditoria da área do aluno (/aluno) frente ao aprovaenem.xyz/home

Data: 18/11/2026. Comparação de estrutura, navegação e funções. Nada do conteúdo ou visual do aprovaenem foi copiado.

## 1. Estrutura de referência (aprovaenem)

Barra lateral agrupada: Início, Dashboard, ENEM (Trilha, Treino Rápido, Banco de Questões), Simulados, Redação IA,
Flash Cards, Vestibulares, Missões, Preditivas, Aprender (Tutor IA, Professor IA, Linguagens, Plano de Estudos),
Comunidade (Amigos, Grupos, Feed, Ranking, Loja), card "Desbloqueie tudo" e rodapé do usuário. Barra superior com meta
do dia, sequência, nível. Início com atalhos, números, missões, atividade e contagem regressiva.

## 2. Achados na área do aluno da GoDev (antes)

| # | Achado | Gravidade | Situação |
|---|---|---|---|
| 1 | Menu plano com 12 itens, sem grupos | Média | **Corrigido**: Início/Dashboard, Praticar, Estudar, Acompanhar, Conta |
| 2 | Sem barra de ritmo (meta do dia, sequência, nível) | Média | **Corrigido**: chips na barra superior |
| 3 | Início com números fixos ("XP = nº de tentativas × 10", "Tempo de estudo —") e dois sistemas de XP | Alta | **Corrigido**: início recalculado de ações verificadas; XP só na 1ª tentativa; painel de XP antigo retirado do início |
| 4 | Sem Dashboard de diagnóstico | Alta | **Criado** `/aluno/dashboard`: acertos de primeira vs. atuais por disciplina, 14 dias de atividade, tópicos fracos (mín. 2 questões), últimos simulados |
| 5 | Sem Treino rápido | Alta | **Criado** `/aluno/treino-rapido`: 5 questões, prioriza inéditas, filtro por disciplina, resumo com XP |
| 6 | Sem Missões nem Ofensiva | Média | **Criados** `/aluno/missoes` (3 missões do dia, desafio do mês, conquistas) e `/aluno/ofensiva` (calendário, melhor sequência, metas 7/14/30/50) |
| 7 | Sem Flash cards | Média | **Criado** `/aluno/flash-cards`: revisão espaçada (caixas 0–5, 1/3/7/14/30 dias) sobre as 24 fichas de fórmulas; novo `action: "flash"` na API, validado no servidor |
| 8 | Sem tela de Planos dentro da área | Alta (receita) | **Criado** `/aluno/planos` + card de upgrade no menu e no início |
| 9 | "Aguardando acesso" sem orientação | Média | **Corrigido**: cartão de ativação com planos e atendimento |
| 10 | Banco de questões, Meus erros, Minha revisão escondidos dentro de "Operação" | Média | **Corrigido**: itens no menu principal (rotas existentes mantidas) |
| 11 | Atalhos de teclado, eliminar alternativa, rascunho e tempo por questão ausentes | Média | **Corrigido** (rodada anterior): questões e simulados |

## 3. Fora do escopo desta rodada (exige decisão ou infraestrutura)

Tutor/Professor IA (custo por uso), Redação com correção por IA (em manutenção), Ranking/ligas, Amigos, Grupos,
Comunidade, Loja de tokens, Preditivas, Vestibulares e Linguagens. Não foram colocados no menu como "em breve" para não
prometer o que não existe. O plano de estudos já existe como "Minha revisão".

## 4. Riscos conhecidos

- Os indicadores dependem da leitura de `operacao_state` a cada página; se a leitura falhar, as páginas mostram o conteúdo
  sem os indicadores (não quebram).
- A contagem de XP e sequência usa o fuso de São Paulo e o histórico de tentativas já gravado: alunos antigos terão
  números calculados retroativamente.
- `lib/supabase.ts` ganhou um usuário de teste **só para desenvolvimento** (exige `NODE_ENV` ≠ production e
  `GODEV_DEV_USER=1`); em produção nunca ativa.
