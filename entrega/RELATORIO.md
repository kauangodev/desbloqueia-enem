# GoDev Education — relatório de auditoria v2

## A. Auditoria inicial

O projeto é Next.js App Router com `/` e `/diagnostico` como quiz de entrada, `/landing` como página de vendas e `/aluno/*`/`/admin/*` como áreas protegidas. As pendências reproduzíveis desta rodada foram peso excessivo das capas, prioridade excessiva de imagens no carrossel, preview social incompatível com compartilhamento e ausência de registro de progresso da execução.

## B. Visual e conteúdo

- Mantida a direção editorial e a logo existentes.
- As capas reais continuam preservadas em PNG e as superfícies públicas passaram a usar WebP responsivo.
- A prévia social passou a usar `public/og.jpg`, 1200×630 e abaixo de 200 KB.
- O carrossel reserva prioridade apenas para a primeira imagem.
- 404, erro de rota e erro global permanecem em português.

## C. Técnico

- Adicionado `scripts/optimize-covers.mjs`, com larguras 320/640/960 e verificação de limite de 200 KB na versão mobile.
- Adicionado `scripts/generate-og.mjs`.
- `sharp` foi adicionado como dependência de desenvolvimento para gerar os artefatos locais.
- Nenhuma rota de autenticação, banco, preço, checkout ou webhook foi alterada nesta fase.

## D. Responsividade e acessibilidade

As larguras cobertas pela suíte existente incluem 320, 360, 390, 430, 768, 1024, 1440 e 1920px. A suíte E2E inclui navegação, catálogo, redução de movimento, rotas protegidas, políticas, suporte e acessibilidade automatizada.

## E. Segurança

Nenhuma credencial foi adicionada, nenhum banco de produção foi modificado e nenhum pagamento real foi executado. Os testes locais de autorização, isolamento, rate limit e webhook permanecem verdes.

## F. Testes

- `pnpm run typecheck`: aprovado.
- `pnpm run build` com heap controlado: aprovado; 33 rotas geradas.
- `pnpm exec playwright test`: 19/19 aprovados.
- `pnpm test`: 35/35 aprovados.
- `pnpm run optimize:covers`: aprovado; 48 WebP gerados.
- `pnpm run generate:og`: aprovado; preview de 34.353 bytes.
- `pnpm audit --prod --audit-level high`: nenhum alerta conhecido.

## G. Performance

As capas de 320px ficaram entre 17 KB e 20 KB; as de 640px e 960px também ficaram abaixo de 200 KB. Lighthouse de campo não foi executado neste ambiente.

## H. GitHub

Branch de trabalho: `release/godev-premium`. A publicação deve ocorrer por PR para `main`, sem force-push. O commit aprovado da rodada anterior foi `14bca3614ab282d47a1d2ec3afc040cb77b403fc`; esta rodada ainda precisa de um novo PR após os testes finais.

## I. Hostinger/publicação

O domínio público é atendido pelo pipeline GitHub/Vercel disponível nesta sessão. O hPanel e seus logs/cache internos não estão disponíveis por um conector operacional; não serão declarados como verificados sem evidência.

## J. Pendências

- Testes E2E autenticados dependem de credenciais locais autorizadas em `.env.local`.
- Upload, checkout pago e webhook assinado não serão executados em produção.
- A tag de backup remota deve ser confirmada pelo transporte Git autenticado antes de ser declarada como existente.

## K. Parecer

**APTO COM RESSALVAS para a rodada visual e técnica local.** O código e os testes locais estão verdes, mas a homologação autenticada, métricas Lighthouse de campo e operações de pagamento/Hostinger ainda não têm evidência suficiente para um parecer irrestrito de produção.
