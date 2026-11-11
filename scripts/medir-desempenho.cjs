// Medição de laboratório (Chrome headless, celular emulado, sem throttling): LCP, CLS, long tasks (proxy de TBT) e bytes.
// Uso: node scripts/medir-desempenho.cjs <url> [rodadas]. TBT aqui é soma de long tasks - 50 ms; NÃO é INP de campo.
const { chromium } = require("playwright");
(async () => {
  const url = process.argv[2];
  const runs = Number(process.argv[3] || 3);
  const browser = await chromium.launch({ channel: "chrome" });
  const rows = [];
  for (let i = 0; i < runs; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
    const page = await ctx.newPage();
    let bytes = 0, js = 0, img = 0;
    page.on("response", async (r) => {
      try {
        const len = Number(r.headers()["content-length"] || 0) || (await r.body()).length;
        bytes += len;
        const t = r.headers()["content-type"] || "";
        if (t.includes("javascript")) js += len;
        if (t.includes("image")) img += len;
      } catch {}
    });
    await page.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.tbt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(6000);
    const m = await page.evaluate(() => window.__m);
    rows.push({ lcp: Math.round(m.lcp), cls: +m.cls.toFixed(3), tbt: Math.round(m.tbt), kb: Math.round(bytes / 1024), jsKb: Math.round(js / 1024), imgKb: Math.round(img / 1024) });
    await ctx.close();
  }
  await browser.close();
  const med = (k) => rows.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  console.log(url, "rodadas:", rows.length, "| mediana LCP", med("lcp"), "ms | CLS", med("cls"), "| TBT(lab)", med("tbt"), "ms | total", med("kb"), "KB | JS", med("jsKb"), "KB | imagens", med("imgKb"), "KB");
  console.log(JSON.stringify(rows));
})();
