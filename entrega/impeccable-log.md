# Registro do Impeccable — GoDev Education

## Contexto

- Skill usada: `.agents/skills/impeccable/SKILL.md`.
- `impeccable context` executado para carregar `PRODUCT.md` e `DESIGN.md`.
- O `craft-floor` foi consultado antes da alteração visual.

## Limitação do launcher

O launcher local respondeu `Unknown command: "critique"` ao tentar executar a auditoria pelo subcomando. A instalação disponível não expôs `init`, `critique` ou `audit` como comandos de terminal. Não houve tentativa de contornar isso com scripts não oficiais.

## Substituição aplicada

Foi feita auditoria direta dos componentes e das folhas carregadas, seguida de validação da preview renderizada e dos gates de typecheck, testes, build e diff. A correção foi isolada em `app/master-fix.css` e em uma inclusão de item na navegação móvel, preservando o backend e as rotas existentes.

## Escopo validado

- Contraste e superfícies nos temas claro e escuro.
- Layout desktop/tablet/mobile do shell de aluno e admin.
- Drawer móvel fora do fluxo quando fechado.
- Barra inferior com cinco destinos.
- CTA e demonstração de questões na landing.
- Ausência de overflow horizontal intencional no preview estreito.

