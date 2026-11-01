# Crítica consolidada — GoDev Education

## Alta prioridade

1. A navegação móvel antiga comprimia ícones em uma faixa horizontal e mantinha uma segunda barra fixa inferior. Isso cortava rótulos, escondia a topbar e cobria conteúdo.
2. O portal do aluno apresentava uma saudação genérica e um card ilustrativo no lugar da leitura rápida de progresso solicitada na referência.
3. O admin misturava o cabeçalho de operação com uma ação secundária e não tinha uma estrutura de menu móvel independente.
4. O CSS legado mantinha regras de temas e componentes antigos carregadas globalmente, permitindo regressões de contraste e de responsividade.

## Média prioridade

- O período e o estado demonstrativo precisavam ficar agrupados com a saudação.
- A página de materiais não tinha uma rota semântica `/admin/materiais`.
- O foco de navegação e o fechamento por Escape precisavam ser explícitos no menu móvel.

## Direção aplicada

Preservar conteúdo, backend, autenticação, preços e checkout; usar superfícies claras, verde profundo institucional, Newsreader para títulos e Inter para interface; remover o rail móvel; usar drawer com backdrop, Escape e bloqueio de rolagem; manter links reais e estados demonstrativos quando não houver dado persistido.
