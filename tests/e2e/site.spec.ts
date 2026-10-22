import { test, expect } from "@playwright/test";
test("landing, planos, capas e FAQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Sua reta final",
  );
  await expect(
    page.getByRole("heading", { name: "Essencial", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Premium", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Matemática/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Matemática");
  await page.getByText("A biblioteca tem 1.800 resoluções?").click();
  await expect(page.locator("details[open]")).toContainText("Não.");
  await page
    .getByRole("link", { name: "Escolher Premium", exact: true })
    .click();
  await expect(
    page.getByText("As vendas ainda não estão abertas.", { exact: false }),
  ).toBeVisible();
});
for (const width of [320, 360, 390, 430, 768, 1024, 1440, 1920])
  test(`layout ${width}px e navegação`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".main-cover")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    if (width <= 760) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page
        .locator(".nav")
        .getByRole("link", { name: "Materiais", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toBeVisible();
    }
    if (width === 390 || width === 1440) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `test-results/${width === 390 ? "mobile" : "desktop"}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  });
test("rotas privadas e arquivos exigem sessão", async ({ page, request }) => {
  for (const path of [
    "/aluno",
    "/aluno/materiais",
    "/aluno/biblioteca",
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
});
test("sem integrações não há sucesso simulado", async ({ page, request }) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("button", { name: "Receber link de acesso" }),
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
