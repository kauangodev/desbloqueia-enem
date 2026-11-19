// Folhas de contato claro|escuro por rota: node scripts/sheets.cjs <largura> <pasta> <rota> [rota...]
// Mede também sobras: rolagem horizontal e texto com contraste < 4.5:1 (amostra).
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const fs = require("node:fs");
const [w, dir, ...routes] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  for (const route of routes) {
    const shots = []; const notes = [];
    for (const theme of ["light", "dark"]) {
      const c = await b.newContext({ viewport: { width: +w, height: +w < 600 ? 800 : 900 }, colorScheme: theme, reducedMotion: "reduce" });
      await c.addInitScript((t) => { try { localStorage.setItem("godev-theme", t); localStorage.setItem("godev-consent", JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString(), expires: new Date(Date.now() + 86400000 * 90).toISOString() })); } catch {} }, theme);
      const p = await c.newPage();
      const res = await p.goto("http://localhost:3210" + route, { waitUntil: "networkidle", timeout: 90000 }).catch(() => null);
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
      const info = await p.evaluate(() => {
        const bad = [];
        const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
        const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const m = parse(getComputedStyle(e).backgroundColor); if (m.length && (m[3] === undefined || m[3] > 0.9)) return m.slice(0, 3); } return [255, 255, 255]; };
        for (const el of document.querySelectorAll(".workspace *, .admin-content *")) {
          if (el.children.length || !el.textContent.trim()) continue;
          const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
          const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
          const fg = parse(cs.color); const bg = bgOf(el); bad.push({ t: el.textContent.trim().slice(0, 30), fg: fg.slice(0, 3), bg, size: parseFloat(cs.fontSize), cls: el.className.toString().slice(0, 40) });
        }
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, items: bad.slice(0, 400) };
      });
      const low = info.items.filter((i) => { const a = lum(i.fg), bgl = lum(i.bg); const cr = (Math.max(a, bgl) + 0.05) / (Math.min(a, bgl) + 0.05); return cr < 4.5; });
      notes.push(`${theme}: status=${res?.status()} overflowX=${info.sw > info.iw} baixoContraste=${low.length}${low.slice(0, 4).map((i) => ` [${i.cls}|${i.t}]`).join("")}`);
      shots.push(await p.screenshot());
      await c.close();
    }
    const name = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
    const meta = await sharp(shots[0]).metadata();
    const sheet = await sharp({ create: { width: meta.width * 2 + 12, height: meta.height, channels: 3, background: "#888" } }).composite([{ input: shots[0], left: 0, top: 0 }, { input: shots[1], left: meta.width + 12, top: 0 }]).jpeg({ quality: 80 }).toBuffer();
    fs.writeFileSync(`${dir}/${name}.jpg`, sheet);
    console.log(`${route}\n  ${notes.join("\n  ")}`);
  }
  await b.close();
})();
