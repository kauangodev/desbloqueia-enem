// Gera o registro por questão da revisão de 11/11/2026. Uso: node --import tsx scripts/gerar-registro-questoes.ts
import { writeFileSync } from "node:fs";
import { questions } from "../lib/operacao/catalog";
import { questionBank, canonicalKey } from "../data/question-bank";

const resolucoesAmpliadas = new Set(["aut-mat-048", "s1-mat-031", "s1-mat-033", "s1-mat-038", "s1-mat-042", "s2-mat-033", "s4-mat-020", "s4-mat-032", "s4-mat-033", "s4-mat-037"]);
const amostrasLanding = new Set(["aut-mat-003", "aut-fis-005", "aut-qui-001", "aut-mat-005", "aut-bio-008"]);
const csv = (v: string | number) => `"${String(v).split('"').join('""')}"`;
const rows: string[] = ["banco;id;disciplina_area;assunto;origem;ocorrencias;status;problema;correcao;verificacao"];

for (const q of questions) {
  let status = "Revisado";
  let problema = "";
  let correcao = "";
  let verificacao = "Leitura independente do enunciado, contas refeitas e conferência do gabarito; checagem automática de coerência resolução × alternativa";
  if (q.origin === "oficial") verificacao = "Gabarito conferido com o gabarito oficial do 2º dia (Caderno 7 Azul) no repositório; resolução não reconstruída item a item; anulações/retificações não consultadas";
  if (resolucoesAmpliadas.has(q.id)) { status = "Corrigido"; problema = "Resolução apenas com a conta, sem o raciocínio"; correcao = "Resolução ampliada; resultado e gabarito conferidos e mantidos"; }
  if (amostrasLanding.has(q.id)) verificacao += "; amostra pública da landing (cálculo refeito)";
  rows.push([`Operação 2º Domingo (${q.bank || "base"})`, q.id, q.discipline, q.topic, q.origin, 1, status, problema, correcao, verificacao].map(csv).join(";"));
}

const groups = new Map<string, { first: (typeof questionBank)[number]; n: number }>();
for (const q of questionBank) {
  const key = canonicalKey(q);
  const g = groups.get(key);
  if (g) g.n += 1; else groups.set(key, { first: q, n: 1 });
}
for (const { first, n } of groups.values()) {
  const area = first.area;
  const corrigido = first.statement.startsWith("Uma nota 6 tem peso 1 e uma nota 8 tem peso 2");
  rows.push([
    "Banco geral (listas e simulados)", first.id, area, first.topic, first.origin, n,
    corrigido ? "Corrigido" : "Revisado",
    corrigido ? "Gabarito cadastrado 7,0, mas a própria resolução calcula 22/3 ≈ 7,3" : "",
    corrigido ? "Gabarito passou para a alternativa 7,3 (regra em data/question-bank.ts, vale para todas as cópias embaralhadas)" : "",
    "Leitura do enunciado, das alternativas e da explicação; contas refeitas (Matemática e Natureza); coerência conceitual (Linguagens e Humanas). Origem 'revisao_inicial' no cadastro; sem revisão externa",
  ].map(csv).join(";"));
}
writeFileSync("entrega/revisao-questoes-2026-11-11.csv", "﻿" + rows.join("\n"));
console.log("linhas:", rows.length - 1, "| Operação:", questions.length, "| Banco geral (distintas):", groups.size);
