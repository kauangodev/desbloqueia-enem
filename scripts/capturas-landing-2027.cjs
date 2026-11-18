/**
 * Capturas da landing para comparação antes/depois, no Chrome instalado (Playwright, sem baixar navegador).
 * Uso: node scripts/capturas-landing-2027.cjs <antes|depois> [baseUrl]
 * Saída: evidencias-landing/<rótulo>/<tema>-<largura>-<estado>.png (+ medidas.json com rolagem horizontal e alvos pequenos).
 */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const label = process.argv[2] || "antes";
const base = process.argv[3] || "http://localhost:3210";
const out = path.join("evidencias-landing", label);
fs.mkdirSync(out, { recursive: true });

const viewports = [{ w: 1440, h: 900 }, { w: 1024, h: 768 }, { w: 768, h: 1024 }, { w: 390, h: 844 }, { w: 360, h: 800 }, { w: 320, h: 640 }];
const themes = ["light", "dark"];

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const report = [];
  for (const theme of themes) {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: theme, reducedMotion: "reduce" });
      await context.addInitScript((pref) => { try { localStorage.setItem("godev-theme", pref); localStorage.setItem("godev-consent", JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000 * 90).toISOString() })); } catch {} }, theme);
      const page = await context.newPage();
      await page.goto(`${base}/landing`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const name = (state) => path.join(out, `${theme}-${vp.w}-${state}.png`);
      await page.screenshot({ path: name("topo") });
      // questão: errar e acertar (a primeira alternativa é usada só para exibir o estado de feedback)
      const options = page.locator(".s-try-pick");
      if (await options.count()) {
        await options.first().click();
        await page.waitForTimeout(250);
        await page.locator("#experimentar").scrollIntoViewIfNeeded();
        await page.screenshot({ path: name("questao-respondida") });
      }
      for (const [id, state] of [["trilha", "trilha"], ["ofertas", "planos"], ["duvidas", "faq"]]) {
        const el = page.locator(`#${id}`);
        if (await el.count()) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await page.screenshot({ path: name(state) }); }
      }
      const metrics = await page.evaluate(() => {
        const small = [...document.querySelectorAll("a,button,input,select,summary")].filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && (r.width < 24 || r.height < 24); }).length;
        return { overflowX: document.documentElement.scrollWidth > window.innerWidth, scrollWidth: document.documentElement.scrollWidth, smallTargets: small, h1: document.querySelectorAll("h1").length };
      });
      report.push({ theme, width: vp.w, ...metrics });
      await context.close();
    }
  }
  fs.writeFileSync(path.join(out, "medidas.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(`ok: ${report.length} combinações em ${out}`);
  console.log(report.filter((r) => r.overflowX || r.smallTargets).map((r) => `${r.theme} ${r.width}px: overflowX=${r.overflowX} alvos<24px=${r.smallTargets}`).join("\n") || "sem rolagem horizontal e sem alvos < 24px");
})();
