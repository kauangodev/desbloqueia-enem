import { existsSync, statSync } from "node:fs";
import { officialExams, officialExamPairs } from "../data/official-exams";

const results = officialExams.map((item) => ({
  ...item,
  exists: existsSync(`private/materials/official-enem/${item.sourceFile}`),
  bytes: existsSync(`private/materials/official-enem/${item.sourceFile}`)
    ? statSync(`private/materials/official-enem/${item.sourceFile}`).size
    : 0,
}));
const report = {
  total: results.length,
  pairs: officialExamPairs.length,
  missing: results.filter((item) => !item.exists),
  invalid: results.filter((item) => item.bytes < 1000),
  unpaired: officialExamPairs.filter((item) => !item.gabarito),
  results,
};
console.log(JSON.stringify(report, null, 2));
if (report.missing.length || report.invalid.length || report.unpaired.length) process.exitCode = 1;
