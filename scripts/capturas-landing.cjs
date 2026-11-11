// Capturas da landing para revisão visual. Uso: node scripts/capturas-landing.cjs http://localhost:3400 pasta-de-saida
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(base + "/landing", { waitUntil: "load" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/${name}-1-hero.png` });
    const section = page.locator("#experimentar");
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await section.screenshot({ path: `${out}/${name}-2-reta.png` });
    for (const [tab, file] of [["Materiais", "3-materiais"], ["Questões", "4-questoes"], ["Simulado", "5-simulado"], ["Minha revisão", "6-plano"]]) {
      await page.getByRole("tab", { name: tab }).click();
      await page.waitForTimeout(350);
      if (tab === "Questões") {
        await page.locator(".hx-panel:not([hidden]) label.hx-option").nth(1).click();
        await page.locator(".hx-panel:not([hidden]) .hx-btn-primary").click();
        await page.waitForTimeout(500);
      }
      await section.screenshot({ path: `${out}/${name}-${file}.png` });
    }
    await ctx.close();
  }
  await browser.close();
  console.log("ok");
})();
