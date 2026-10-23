# GoDev Education — Desbloqueia ENEM 2026

Next.js App Router, Supabase Auth/PostgreSQL/Storage, fila transacional de fulfillment e Cakto.

`pnpm install`, `pnpm dev`. Validação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

Consulte [docs/SETUP.md](docs/SETUP.md) para ativar infraestrutura e pagamentos. Nenhum segredo ou PDF pago está no repositório. Sem configuração externa, login e compra ficam indisponíveis; não existe bypass de demonstração nas rotas privadas.

URL estável deste projeto: https://desbloqueia-enem.vercel.app.

Links de demonstração temporários podem ser configurados com `DEMO_ACCESS_SECRET`, `DEMO_STUDENT_TOKEN` e `DEMO_ADMIN_TOKEN`. Eles criam apenas uma sessão de preview controlada pelo proprietário e não substituem a autenticação dos clientes.

As skills de design instaladas estão em `.skills/`. A direção visual e as restrições estão em DESIGN.md e PRODUCT.md.
