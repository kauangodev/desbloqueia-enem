import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/landing",
  "/entrar",
  "/suporte",
  "/politicas/privacidade",
  "/politicas/termos",
  "/politicas/reembolso",
];
const widths = [320, 360, 390, 430, 768, 1024, 1440];

test.describe("responsive public surfaces", () => {
  for (const route of routes) {
    for (const width of widths) {
      test(`${route} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(route, { waitUntil: "networkidle" });
        expect(response?.status(), `${route} must render`).toBeLessThan(400);
        await expect(page.locator("body")).toBeVisible();

        const audit = await page.evaluate((viewportWidth) => {
          const visible = (element: Element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
          };
          const overflow = [...document.querySelectorAll("body *")]
            .filter(visible)
            .filter((element) => !element.closest("[aria-hidden=\"true\"]") && !element.closest(".material-index, .discipline-marquee, .katex-mathml") && getComputedStyle(element).overflowX !== "auto")
            .filter((element) => element.getBoundingClientRect().right > viewportWidth + 1)
            .slice(0, 8)
            .map((element) => `${element.tagName}.${element.className}(${(element.textContent || "").trim().slice(0, 24)})`);
          const smallText = [...document.querySelectorAll("body *")]
            .filter(visible)
            .filter((element) => element.children.length === 0 && element.tagName !== "I")
            .filter((element) => !element.closest("[aria-hidden=\"true\"], .sr-only, .brand-sub, .theme-toggle-label, .discipline-group, .portal-nav-icon, .admin-side-icon") && parseFloat(getComputedStyle(element).fontSize) < 12)
            .slice(0, 8)
            .map((element) => `${element.tagName}.${element.className}(${(element.textContent || "").trim().slice(0, 24)})`);
          const smallControls = [...document.querySelectorAll("a,button,input,select,textarea,[role=button]")]
            .filter(visible)
            .filter((element) => element.getBoundingClientRect().height < 44)
            .filter((element) => !element.closest("p"))
            .slice(0, 8)
            .map((element) => `${element.tagName}.${element.className}`);
          const smallInputs = [...document.querySelectorAll("input,select,textarea")]
            .filter(visible)
            .filter((element) => parseFloat(getComputedStyle(element).fontSize) < 16)
            .map((element) => `${element.tagName}.${element.className}`);
          return { scrollWidth: document.documentElement.scrollWidth, overflow, smallText, smallControls, smallInputs };
        }, width);

        expect(audit.scrollWidth, `${route} has horizontal document overflow`).toBeLessThanOrEqual(width);
        expect(audit.overflow, `${route} has visible overflow: ${audit.overflow.join(", ")}`).toEqual([]);
        expect(audit.smallText, `${route} has text smaller than 12px`).toEqual([]);
        expect(audit.smallInputs, `${route} has an input below 16px`).toEqual([]);
        if (width <= 430) expect(audit.smallControls, `${route} has a small control`).toEqual([]);

        await page.screenshot({ path: `tests/__screenshots__/${route.replace(/\//g, "_").replace(/^_/, "home")}-${width}.png`, fullPage: true });
      });
    }
  }

// Removido: o bloco .guarantee não existe mais na landing (a garantia agora está em Acesso e garantia, coberta pelo teste de contraste da página inteira).
});
