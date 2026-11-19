// Captura rápida: node scripts/shot.cjs <rota> <tema> <largura> <arquivo> [altura|full]
const { chromium } = require("@playwright/test");
const [route, theme, w, out, h] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const c = await b.newContext({ viewport: { width: +w, height: +(h && h !== "full" ? h : 900) }, colorScheme: theme, reducedMotion: "reduce" });
  await c.addInitScript((t) => { try { localStorage.setItem("godev-theme", t); localStorage.setItem("godev-consent", JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000 * 90).toISOString() })); } catch {} }, theme);
  const p = await c.newPage();
  await p.goto("http://localhost:3210" + route, { waitUntil: "networkidle", timeout: 90000 });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, fullPage: h === "full" });
  await b.close();
})();
