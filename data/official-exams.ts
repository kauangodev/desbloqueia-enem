export type OfficialExamPart = "caderno" | "gabarito";

export type OfficialExam = {
  id: string;
  year: 2016 | 2017 | 2021;
  day: 1 | 2;
  part: OfficialExamPart;
  questionRange: string;
  sourceFile: string;
  storagePath: string;
};

export type OfficialMaterial = {
  id: string;
  title: string;
  description: string;
  category: "Provas oficiais";
  plan: "premium";
  pages: number;
  cover: string;
  storage_path: string;
  published: boolean;
  downloadable: boolean;
};

/** O ano foi confirmado pelo título/conteúdo dos PDFs recebidos. */
const rawOfficialExams: Array<[2016 | 2017 | 2021, 1 | 2, OfficialExamPart, "1-90" | "91-180"]> = [
  [2016, 1, "caderno", "1-90"], [2016, 1, "gabarito", "1-90"],
  [2016, 2, "caderno", "91-180"], [2016, 2, "gabarito", "91-180"],
  [2017, 1, "caderno", "1-90"], [2017, 1, "gabarito", "1-90"],
  [2017, 2, "caderno", "91-180"], [2017, 2, "gabarito", "91-180"],
  [2021, 1, "caderno", "1-90"], [2021, 1, "gabarito", "1-90"],
  [2021, 2, "caderno", "91-180"], [2021, 2, "gabarito", "91-180"],
];

export const officialExams: OfficialExam[] = rawOfficialExams.map(([year, day, part, questionRange]) => {
  const id = `enem-${year}-${day}-${part}-azul`;
  const sourceFile = `${year}-${day}-${part}-azul.pdf`;
  return { id, year, day, part, questionRange, sourceFile, storagePath: `private/materials/official-enem/${sourceFile}` };
});

export const officialExamPairs = officialExams.filter((item) => item.part === "caderno").map((caderno) => ({
  caderno,
  gabarito: officialExams.find((item) => item.year === caderno.year && item.day === caderno.day && item.part === "gabarito"),
}));

export const officialMaterials: OfficialMaterial[] = officialExams.map((item) => ({
  id: item.id,
  title: `ENEM ${item.year} · ${item.day === 1 ? "1º" : "2º"} dia · ${item.part === "caderno" ? "Caderno azul" : "Gabarito azul"}`,
  description: item.part === "caderno"
    ? `Questões ${item.questionRange.replace("-", " a ")}. Abra também o gabarito correspondente do mesmo ano e dia.`
    : `Gabarito das questões ${item.questionRange.replace("-", " a ")} do caderno azul.`,
  category: "Provas oficiais",
  plan: "premium",
  pages: item.part === "caderno" ? 32 : 1,
  cover: item.day === 1 ? "/covers/enem-2026/01-lingua-portuguesa.png" : "/covers/enem-2026/15-matematica.png",
  storage_path: item.storagePath,
  published: true,
  downloadable: false,
}));
