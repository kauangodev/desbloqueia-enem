// Medição de laboratório da landing no navegador: node scripts/medir-landing.cjs <url> [largura]
// Mostra peso transferido por tipo, nº de requisições, imagens raster usadas, LCP e CLS (laboratório, DPR 1, rede sem limite).
const { chromium } = require("@playwright/test");
const url = process.argv[2] || "https://godeveducation.com.br/landing";
const width = Number(process.argv[3] || 1366);
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const c = await b.newContext({ viewport: { width, height: width < 600 ? 800 : 768 }, reducedMotion: "reduce" });
  await c.addInitScript(() => { try { localStorage.setItem("godev-consent", JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000).toISOString() })); } catch {} });
  const p = await c.newPage();
  await p.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  const sizes = {}; let count = 0;
  p.on("response", async (r) => { try { const t = r.request().resourceType(); const len = Number(r.headers()["content-length"] || 0) || (await r.body().catch(() => Buffer.alloc(0))).length; sizes[t] = (sizes[t] || 0) + len; count += 1; } catch { /* ignora */ } });
  await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => ({ ...window.__m, images: [...document.images].map((i) => ({ src: i.currentSrc.split("/").slice(-2).join("/"), nat: `${i.naturalWidth}x${i.naturalHeight}`, box: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}` })) }));
  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`${url} @${width}px`);
  console.log(`requisições: ${count} | ` + Object.entries(sizes).map(([k, v]) => `${k} ${kb(v)}`).join(" · "));
  console.log(`LCP (lab): ${Math.round(m.lcp)} ms | CLS (lab): ${m.cls.toFixed(3)} | <img>: ${m.images.length}${m.images.length ? " " + JSON.stringify(m.images) : ""}`);
  await b.close();
})();
