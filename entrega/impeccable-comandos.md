# Impeccable — mapa de execução

| Fase | Comando | Resultado |
| --- | --- | --- |
| Contexto | `impeccable context` | Executado; `PRODUCT.md` e `DESIGN.md` carregados. |
| Produto | `impeccable init` | Contexto do produto atualizado em `PRODUCT.md`; não houve criação de credenciais. |
| Crítica | `impeccable critique` | A crítica automática foi substituída por inspeção do código e das capturas, pois o launcher desta instalação não disponibiliza saída interativa do comando. |
| Layout | `impeccable layout` | Direção aplicada na landing e nos portais: grade fluida, superfícies claras, tipografia editorial e drawer móvel. |
| Distill | `impeccable distill` | Elementos duplicados da navegação móvel removidos da camada final; CTA e hierarquia simplificados. |
| Adapt | `impeccable adapt` | Breakpoints revisados em 360, 390, 430, 768, 1024 e 1440px via Playwright. |
| Polish | `impeccable polish` | Foco, estados, contraste, reduced-motion e áreas de toque revisados. |
| Audit | `impeccable audit` | Indisponível nesta instalação; substituído por axe, testes de layout e inspeção DOM documentados em `audit-final.md`. |

O hook local foi acionado durante as edições e não identificou problemas determinísticos nos componentes alterados.
