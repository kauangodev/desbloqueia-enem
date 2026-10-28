import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public/vendor", { recursive: true });
const source = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
for (const target of ["public/vendor/pdf.worker.min.mjs", "public/vendor/pdf.worker.min.js"]) {
  copyFileSync(source, target);
}
