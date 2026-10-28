import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { officialExams } from "../data/official-exams";

type Line = { text: string; x: number; y: number; page: number; column: number };
type Extracted = {
  id: string;
  number: number;
  statement: string;
  options: Array<{ id: string; text: string }>;
  answer: string | null;
  sourcePdf: string;
  questionRange: string;
  status: "ready" | "needs_review";
  reviewReason?: string;
};

const root = process.cwd();
const sourceDir = path.join(root, "private", "materials", "official-enem");
const clean = (value: string) => value.replace(/\s+/g, " ").trim();

async function linesFor(file: string): Promise<Line[]> {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await readFile(file)), useWorkerFetch: false, isEvalSupported: false }).promise;
  const lines: Line[] = [];
  for (let page = 1; page <= doc.numPages; page += 1) {
    const content = await (await doc.getPage(page)).getTextContent();
    const items = content.items.filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && Boolean(item.str)).map((item) => ({ text: clean(item.str), x: item.transform[4], y: Math.round(item.transform[5]) })).filter((item) => item.text);
    const maxX = Math.max(...items.map((item) => item.x), 0);
    const mid = maxX / 2;
    const grouped: Array<{ text: string; x: number; y: number; column: number }> = [];
    for (const item of items) {
      const column = item.x < mid ? 0 : 1;
      const existing = grouped.find((line) => line.column === column && Math.abs(line.y - item.y) <= 2);
      if (existing) existing.text = clean(`${existing.text} ${item.text}`);
      else grouped.push({ ...item, column });
    }
    lines.push(...grouped.sort((a, b) => a.column - b.column || b.y - a.y).map((line) => ({ ...line, page })));
  }
  return lines;
}

function questionBlocks(lines: Line[], first: number, last: number) {
  const blocks = new Map<number, { lines: string[]; sourcePage: number }>();
  for (let index = 0; index < lines.length; index += 1) {
    const start = lines[index].text.match(/^QUEST(?:ÃO|AO)\s*0*(\d{1,3})$/i);
    if (!start) continue;
    const number = Number(start[1]);
    if (number < first || number > last || blocks.has(number)) continue;
    const body: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^QUEST(?:ÃO|AO)\s*0*\d{1,3}$/i.test(lines[cursor].text)) break;
      body.push(lines[cursor].text);
    }
    blocks.set(number, { lines: body, sourcePage: lines[index].page });
  }
  return blocks;
}

function parseAnswerKey(text: string, first: number, last: number) {
  const answers = new Map<number, string>();
  const pattern = /(?:^|\s)(\d{1,3})\s+([ABCDE])(?=\s|$)/gi;
  for (const match of text.matchAll(pattern)) {
    const number = Number(match[1]);
    if (number >= first && number <= last && !answers.has(number)) answers.set(number, match[2].toUpperCase());
  }
  return answers;
}

function parseBlock(block: { lines: string[]; sourcePage: number }, exam: (typeof officialExams)[number], answer: string | null): Extracted {
  const optionStarts = block.lines.map((line, index) => ({ line, index })).filter((item) => /^[ABCDE]\s+\S/.test(item.line));
  const options = optionStarts.slice(0, 5).map((item, index) => ({
    id: String.fromCharCode(65 + index),
    text: clean(block.lines.slice(item.index, optionStarts[index + 1]?.index ?? block.lines.length).join(" ").replace(/^[ABCDE]\s+/, "")),
  }));
  const firstOption = optionStarts[0]?.index ?? block.lines.length;
  const statement = clean(block.lines.slice(0, firstOption).join(" "));
  const hasControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(`${statement} ${options.map((item) => item.text).join(" ")}`);
  const status = options.length === 5 && statement.length >= 40 && answer && !hasControls ? "ready" : "needs_review";
  const reviewReason = status === "ready" ? undefined : `alternativas=${options.length}; enunciado=${statement.length} caracteres; gabarito=${answer ? "presente" : "ausente"}${hasControls ? "; texto_capturado_com_controle" : ""}`;
  return { id: `${exam.id}-q-${block.sourcePage}-${statement.slice(0, 12).replace(/\W+/g, "-")}`, number: 0, statement, options, answer, sourcePdf: exam.sourceFile, questionRange: exam.questionRange, status, reviewReason };
}

async function main() {
const booklet = officialExams.filter((item) => item.part === "caderno");
const result: Extracted[] = [];
for (const exam of booklet) {
  const first = exam.day === 1 ? 1 : 91;
  const last = exam.day === 1 ? 90 : 180;
  const questionLines = await linesFor(path.join(sourceDir, exam.sourceFile));
  const key = officialExams.find((item) => item.year === exam.year && item.day === exam.day && item.part === "gabarito");
  const answerText = key ? (await linesFor(path.join(sourceDir, key.sourceFile))).map((line) => line.text).join(" ") : "";
  const answers = parseAnswerKey(answerText, first, last);
  for (const [number, block] of questionBlocks(questionLines, first, last)) {
    const parsed = parseBlock(block, exam, answers.get(number) || null);
    parsed.number = number;
    result.push(parsed);
  }
}
await mkdir(path.join(root, "tmp", "official-exams"), { recursive: true });
await writeFile(path.join(root, "tmp", "official-exams", "questions.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ total: result.length, ready: result.filter((item) => item.status === "ready").length, needsReview: result.filter((item) => item.status === "needs_review").length, bySource: Object.groupBy(result, (item) => item.sourcePdf) }, null, 2));
}

void main();
