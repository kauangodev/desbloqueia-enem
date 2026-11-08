import katex from "katex";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

function math(source: string, display: boolean): string {
  try {
    return katex.renderToString(source.trim(), { displayMode: display, throwOnError: true, output: "htmlAndMathml", strict: "ignore" });
  } catch {
    return `<code>${escapeHtml(source)}</code>`;
  }
}

/** Renderiza texto editorial: parágrafos, listas "- ", **negrito**, *itálico*, $inline$ e $$bloco$$ (KaTeX no servidor). */
export function renderRich(text: string): string {
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((line) => /^\s*- /.test(line))) {
        return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*- /, ""))}</li>`).join("")}</ul>`;
      }
      if (lines.every((line) => /^\s*\d+\. /.test(line))) {
        return `<ol>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*\d+\. /, ""))}</li>`).join("")}</ol>`;
      }
      const only = block.trim();
      if (/^\$\$[\s\S]+\$\$$/.test(only)) return `<div class="math-block">${math(only.slice(2, -2), true)}</div>`;
      return `<p>${renderInline(lines.join(" "))}</p>`;
    })
    .join("");
}

export function renderInline(text: string): string {
  return text
    .split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g)
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) return math(part.slice(2, -2), true);
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return math(part.slice(1, -1), false);
      return inline(part);
    })
    .join("");
}
