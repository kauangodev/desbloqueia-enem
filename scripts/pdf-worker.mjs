import { copyFileSync, existsSync, mkdirSync } from "node:fs";
mkdirSync("public/vendor", { recursive: true });
if (!existsSync("public/vendor/pdf.worker.min.mjs")) {
  copyFileSync(
    "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
    "public/vendor/pdf.worker.min.mjs",
  );
}
