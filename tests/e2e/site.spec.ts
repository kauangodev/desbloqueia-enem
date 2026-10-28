import { test, expect } from "@playwright/test";
test("landing, planos, capas e FAQ", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Sua reta final,\s*mais leve e organizada\./,
  );
  await expect(page.getByText("DESBLOQUEIA ENEM 2026", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-carousel-card]")).toHaveCount(32);
  await expect(
    page.getByRole("heading", { name: "Essencial", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("↗");
  await expect(
    page.getByRole("heading", { name: "Premium", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Matemática/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Matemática");
  await page.getByRole("tab", { name: /Matemática/ }).press("Home");
  await expect(page.getByRole("tab").first()).toBeFocused();
  await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
  await page.getByText("A biblioteca tem 1.800 questões?").click();
  await expect(page.locator("details[open]")).toContainText("Sim.");
  const planLink = page.getByRole("link", { name: "Receber orientação", exact: true }).last();
  await expect(planLink).toHaveAttribute("href", "/suporte");
});

test("faixa de matérias corre suavemente da esquerda para a direita", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const track = page.locator("[data-discipline-track]");
  await expect(track).toBeVisible();
  await expect(track.locator("span")).toHaveCount(10);
  const x = () =>
    track.evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      return matrix.m41;
    });
  const before = await x();
  await page.waitForTimeout(400);
  expect(await x()).toBeGreaterThan(before);
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
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-carousel-card]").first()).toBeVisible();
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
      for (const control of await page.locator(".hero .actions a").all()) {
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(43.5);
        expect(box?.width).toBeGreaterThan(0);
      }
      for (const control of await page.locator(".catalog-arrow").all()) {
        const box = await control.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(43.5);
        expect(box?.height).toBeGreaterThanOrEqual(43.5);
      }
      await menu.click();
      await page
        .locator(".nav")
        .getByRole("link", { name: "Materiais", exact: true })
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
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1400);
      await page.screenshot({
        path: `test-results/${screenshotName}.png`,
        fullPage: true,
      });
    }
  });

test("carrossel tem curva, movimento contínuo, arraste e retomada", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/");
  const cards = page.locator("[data-carousel-card]");
  await expect(cards.first()).toBeVisible();
  const dimensions = await cards.evaluateAll((items) =>
    items.map((item) => ({
      width: Number.parseFloat((item as HTMLElement).style.width),
      height: Number.parseFloat((item as HTMLElement).style.height),
    })),
  );
  expect(Math.max(...dimensions.map((item) => item.width))).toBeGreaterThan(
    Math.min(...dimensions.map((item) => item.width)) + 20,
  );
  expect(Math.max(...dimensions.map((item) => item.height))).toBeGreaterThan(
    Math.min(...dimensions.map((item) => item.height)) + 45,
  );

  const before = await cards.first().getAttribute("style");
  await page.waitForTimeout(320);
  const afterAuto = await cards.first().getAttribute("style");
  expect(afterAuto).not.toBe(before);

  const carousel = page.getByRole("region", {
    name: "Capas dos materiais do Desbloqueia ENEM 2026",
  });
  const box = await carousel.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 150, box!.y + box!.height / 2, {
    steps: 4,
  });
  const afterDrag = await cards.first().getAttribute("style");
  expect(afterDrag).not.toBe(afterAuto);
  await page.mouse.up();
  await page.waitForTimeout(260);
  const afterRelease = await cards.first().getAttribute("style");
  expect(afterRelease).not.toBe(afterDrag);
});

test("redução de movimento mantém o carrossel estável", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page.locator("[data-carousel-card]").first();
  await expect(card).toBeVisible();
  await expect
    .poll(() => card.getAttribute("style"))
    .not.toBeNull();
  const before = await card.getAttribute("style");
  await page.waitForTimeout(320);
  expect(await card.getAttribute("style")).toBe(before);
});
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
  for (const route of ["/entrar", "/comprar/essencial", "/comprar/premium", "/suporte", "/politicas/termos"]) {
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
  expect((await request.get("/api/checkout/premium")).status()).toBe(503);
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

