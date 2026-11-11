// Auditoria automatizada de páginas: axe (WCAG 2.x A/AA), overflow horizontal, erros de console e falhas de rede.
// Uso: node scripts/audit-paginas.cjs http://localhost:3400 /landing /entrar ...  (largura via VW="320,390,768,1024,1440,1920")
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;

(async () => {
  const [base, ...paths] = process.argv.slice(2);
  const widths = (process.env.VW || "390,1440").split(",").map(Number);
  const browser = await chromium.launch({ channel: "chrome" });
  const rows = [];
  for (const path of paths) {
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 800 : 900 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 140)); });
      page.on("requestfailed", (r) => errors.push("requestfailed " + r.url().slice(0, 100)));
      page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(0, 100)}`); });
      let status = "ok";
      try {
        await page.goto(base + path, { waitUntil: "load", timeout: 45000 });
        await page.waitForTimeout(1500);
      } catch (e) { status = "falha: " + String(e).slice(0, 80); }
      const final = new URL(page.url()).pathname;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
      let violations = [];
      try {
        const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        violations = res.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`);
      } catch (e) { violations = ["axe falhou: " + String(e).slice(0, 60)]; }
      rows.push({ path, w, final, status, overflow, violations, errors: [...new Set(errors)].slice(0, 4) });
      await ctx.close();
    }
  }
  await browser.close();
  for (const r of rows) {
    console.log(`${r.path} @${r.w} -> ${r.final} | ${r.status} | overflow ${r.overflow}px | axe: ${r.violations.join(", ") || "0 violações"}${r.errors.length ? " | erros: " + r.errors.join(" ; ") : ""}`);
  }
})();
