# Registro do Impeccable — GoDev Education

## Contexto

- Skill usada: `.agents/skills/impeccable/SKILL.md`.
- `impeccable context` executado para carregar `PRODUCT.md` e `DESIGN.md`.
- O `craft-floor` foi consultado antes da alteração visual.

## Limitação do launcher

O launcher local expôs `context` e `detect`; os comandos conversacionais `init`, `critique` e `audit` não ficam disponíveis como automação terminal nesta instalação. Não houve tentativa de contornar isso com scripts não oficiais.

## Substituição aplicada

Foi feita auditoria direta dos componentes e das folhas carregadas, seguida do detector em dois componentes-alvo, validação da preview renderizada e dos gates de typecheck, lint direcionado, testes e build. A correção foi isolada em `app/godev-release.css`, com ajuste contextual em `app/admin/page.tsx` e import em `app/layout.tsx`, preservando o backend e as rotas existentes.

## Escopo validado

- Contraste e superfícies nos temas claro e escuro.
- Layout desktop/tablet/mobile do shell de aluno e admin.
- Drawer móvel fora do fluxo quando fechado.
- Barra inferior com cinco destinos.
- CTA e demonstração de questões na landing.
- Ausência de overflow horizontal intencional no preview estreito.
- Detector Impeccable em `components/landing/LandingPage.tsx` e `app/admin/page.tsx`: `[]`.


