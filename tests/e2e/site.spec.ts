import { test, expect } from "@playwright/test";

// O aviso de cookies cobre botões do cabeçalho em telas pequenas: nos testes de layout a escolha já está feita ("só essenciais").
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("godev-consent", JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000 * 90).toISOString() })); } catch {} });
});
test("landing, planos e FAQ (ENEM 2027)", async ({ page }) => {
  await page.goto("/landing");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prepare-se para o ENEM 2027 com mais direção.");
  await expect(page.getByText("Calendário oficial do ENEM 2027 a confirmar")).toBeVisible();
  for (const id of ["amostra", "beneficios", "ofertas", "acesso", "duvidas", "trilha", "experimentar", "planos"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Essencial", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Operação 2º Domingo|Reta final|Enem 2026, 2º dia/);
  await expect(page.getByRole("link", { name: "Ler a política de reembolso", exact: true })).toHaveAttribute("href", "/politicas/reembolso");
});
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1440, height: 1080 },
  { width: 1920, height: 1080 },
] as const;

for (const viewport of viewports)
  test(`layout ${viewport.width}x${viewport.height} e navegação`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/landing");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    if (viewport.width <= 760) {
      const menu = page.getByRole("button", { name: "Abrir menu" });
      const menuBox = await menu.boundingBox();
      expect(menuBox?.width).toBeGreaterThanOrEqual(43.5);
      expect(menuBox?.height).toBeGreaterThanOrEqual(43.5);
      const loginBox = await page.getByRole("link", { name: "Entrar" }).boundingBox();
      expect(loginBox?.height).toBeGreaterThanOrEqual(43.5);
      for (const control of await page.locator(".landing-actions a").all()) {
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(43.5);
        expect(box?.width).toBeGreaterThan(0);
      }
      await menu.click();
      await page
        .locator(".nav")
        .getByRole("link", { name: "Recursos", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toBeVisible();
    }
    const screenshotName =
      viewport.width === 390 && viewport.height === 844
        ? "hero-mobile-390"
        : viewport.width === 430 && viewport.height === 932
          ? "hero-mobile-430"
          : viewport.width === 1440 && viewport.height === 1080
            ? "hero-desktop-1440"
            : null;
    if (screenshotName) {
      await page.goto("/landing");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1400);
      await page.screenshot({
        path: `test-results/${screenshotName}.png`,
        fullPage: true,
      });
    }
  });

// Removidos: o catálogo curvo de materiais saiu da landing (a página agora mostra a demonstração, a Trilha e as amostras).
test("rotas privadas e arquivos exigem sessão", async ({ page, request }) => {
  await page.context().addCookies([{ name: "desbloqueia_demo", value: "admin.invalid", domain: "127.0.0.1", path: "/" }]);
  for (const path of [
    "/aluno",
    "/aluno/materiais",
    "/aluno/biblioteca",
    "/aluno/exercicios",
    "/aluno/simulados",
    "/aluno/correcoes",
    "/admin",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/entrar/);
  }
  const pdf = await request.get("/api/materials/kit");
  expect(pdf.status()).toBe(401);
  const admin = await request.post("/api/admin", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { action: "upload" },
  });
  expect(admin.status()).toBe(403);
  const worker = await request.get("/api/jobs/fulfillment");
  expect(worker.status()).toBe(401);
  await page.goto("/demo/acesso?token=invalid");
  await expect(page).toHaveURL(/\/entrar/);
  expect((await page.context().cookies()).some((c) => c.name === "desbloqueia_demo")).toBe(false);
});

test("páginas públicas são responsivas em 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const route of ["/", "/landing", "/entrar", "/comprar/essencial", "/comprar/premium", "/suporte", "/politicas/termos"]) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBeTruthy();
  }
});
test("sem integrações não há sucesso simulado", async ({ page, request }) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("button", { name: "Entrar na área de alunos" }),
  ).toBeDisabled();
  expect(
    (
      await request.post("/api/webhooks/cakto", {
        data: { event: "purchase_approved" },
      })
    ).status(),
  ).toBe(503);
  // Sem o corte Pix o checkout fica indisponível (503); com a chave Pix ligada o link antigo segue ao checkout GoDev (307).
  expect([503, 307]).toContain((await request.get("/api/checkout/premium", { maxRedirects: 0 })).status());
});
test("políticas e suporte têm rotas reais", async ({ page }) => {
  for (const path of [
    "/politicas/privacidade",
    "/politicas/termos",
    "/politicas/reembolso",
    "/suporte",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});


// Mobile layout coverage is part of the release gate.


test("onboarding: API indisponível com a chave desligada e exige sessão quando ligada", async ({ request }) => {
  const get = await request.get("/api/onboarding");
  expect([404, 401]).toContain(get.status());
  const post = await request.post("/api/onboarding", { data: { step: 1, birthDate: "2005-03-19" }, headers: { origin: "https://evil.example" } });
  expect([404, 403]).toContain(post.status());
});
