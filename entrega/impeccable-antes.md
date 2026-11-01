# Auditoria antes da reformulação

Data: 01/11/2026

O contexto oficial da skill Impeccable foi carregado e a base de craft foi consultada antes da alteração. O executável local da skill não expõe o subcomando `audit` nesta instalação: a chamada `impeccable audit` retornou `Unknown command`. Por isso, a auditoria inicial foi feita diretamente no código, nos componentes renderizados e na suíte Playwright existente.

Principais problemas encontrados:

- A landing misturava uma direção visual antiga, com tokens de tema e estilos de alto contraste inconsistente, ao fluxo de demonstração.
- A tipografia não tinha uma escala editorial clara; o layout usava famílias e regras herdadas de várias passagens visuais.
- O catálogo e rodapés herdavam cores de estados anteriores, o que podia produzir textos claros sobre superfícies claras.
- A navegação móvel não tinha backdrop, fechamento por Escape nem controle de rolagem do documento.
- As rotas de política compartilhavam o título genérico do layout.
- O portal de aluno não tinha uma barra superior consistente com busca, notificações e identidade do usuário.

O objetivo desta etapa é corrigir a camada visual sem alterar autenticação, pagamentos, Cakto, banco ou variáveis secretas.

