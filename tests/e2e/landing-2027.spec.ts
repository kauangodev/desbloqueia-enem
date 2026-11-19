import { expect, test, type Page } from "@playwright/test";

const consent = (analytics: boolean) => ({ v: 1, analytics, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000 * 90).toISOString() });
async function withConsent(page: Page, analytics: boolean) {
  await page.addInitScript((value) => { try { localStorage.setItem("godev-consent", JSON.stringify(value)); } catch {} }, consent(analytics));
}
type Sent = { name: string; params: Record<string, unknown> };
function collectEvents(page: Page): Sent[] {
  const sent: Sent[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/events") && request.method() === "POST") {
      try { sent.push(JSON.parse(request.postData() || "{}")); } catch { /* ignora */ }
    }
  });
  return sent;
}

test("sem consentimento nenhum evento é enviado, e a demonstração funciona", async ({ page }) => {
  await withConsent(page, false);
  const sent = collectEvents(page);
  await page.goto("/landing");
  await page.locator(".s-try-pick").first().click();
  await expect(page.locator(".s-try-feedback strong").first()).toBeVisible();
  await page.locator("#ofertas").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  expect(sent).toHaveLength(0);
});

test("com consentimento: landing_viewed, demo_started, demo_answered e plans_viewed, sem dados pessoais e sem repetir", async ({ page }) => {
  await withConsent(page, true);
  const sent = collectEvents(page);
  await page.goto("/landing?utm_source=teste&utm_campaign=c1&email=x@y.z");
  await page.waitForTimeout(300);
  await page.locator(".s-try-pick").first().click(); // A está errada na questão de amostra
  await page.locator("#ofertas").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const names = sent.map((e) => e.name);
  expect(names.filter((n) => n === "landing_viewed")).toHaveLength(1);
  expect(names.filter((n) => n === "demo_started")).toHaveLength(1);
  expect(names.filter((n) => n === "demo_answered")).toHaveLength(1);
  expect(names.filter((n) => n === "plans_viewed")).toHaveLength(1);
  expect(sent.find((e) => e.name === "demo_answered")!.params.correct).toBe(false);
  const text = JSON.stringify(sent);
  expect(text).not.toMatch(/x@y\.z|"email"|"selected"|copyPaste|"pix/i);
  expect(sent.find((e) => e.name === "landing_viewed")!.params.utm_source).toBe("teste");
});

test("o servidor recusa eventos forjados e origem externa", async ({ request }) => {
  for (const name of ["purchase_confirmed", "signup_verified", "first_study_completed", "checkout_started"]) {
    const res = await request.post("/api/events", { data: { name }, headers: { origin: "https://godeveducation.com.br" } });
    expect(res.status()).toBe(400);
  }
  const external = await request.post("/api/events", { data: { name: "demo_started" }, headers: { origin: "https://evil.example" } });
  expect(external.status()).toBe(403);
  const ok = await request.post("/api/events", { data: { name: "demo_started", params: { plan: "premium", email: "a@b.c" } }, headers: { origin: "https://godeveducation.com.br" } });
  expect(ok.status()).toBe(204);
});

test("demonstração por teclado: escolher, ler o resultado e tentar de novo devolve o foco", async ({ page }) => {
  await withConsent(page, false);
  await page.goto("/landing");
  const first = page.locator(".s-try-pick").first();
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".s-try-feedback")).toBeFocused();
  await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.locator(".s-try-pick").first()).toBeFocused();
});

test("prévia da Trilha: trocar de unidade e de etapa muda o conteúdo", async ({ page }) => {
  await withConsent(page, false);
  await page.goto("/landing");
  const panel = page.getByRole("region", { name: /Fundamento · / });
  await expect(panel).toBeVisible();
  const unitButtons = page.locator(".s-tp-unit");
  expect(await unitButtons.count()).toBeGreaterThanOrEqual(2);
  const firstTitle = await panel.locator("h3").innerText();
  await unitButtons.nth(1).click();
  await expect(page.getByRole("region", { name: /Fundamento · / }).locator("h3")).not.toHaveText(firstTitle);
  await page.getByRole("button", { name: /Prática/ }).click();
  await expect(page.getByText("Exemplo real do acervo")).toBeVisible();
});

for (const width of [320, 390]) {
  test(`sem rolagem horizontal em ${width}px e sem textos antigos`, async ({ page }) => {
    await withConsent(page, false);
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/landing");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    const body = await page.locator("main").innerText();
    expect(body).not.toMatch(/Operação|Reta final|Operação 2º Domingo/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Prepare-se para o ENEM 2027 com direção/);
  });
}

test("âncoras antigas continuam e o topo tem uma ação dominante", async ({ page }) => {
  await withConsent(page, false);
  await page.goto("/landing");
  for (const id of ["amostra", "beneficios", "ofertas", "acesso", "duvidas", "trilha", "experimentar"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator("#topo .v2-btn-lg:not(.v2-btn-outline)")).toHaveCount(1);
  await expect(page.locator(".scroll-progress")).toHaveCount(0);
});
