import "server-only";
import { formulas, modules, questions } from "./catalog";
import { kindIds, sessionKinds } from "./kinds";

/** Números reais do acervo publicado, calculados do catálogo (nunca digitados à mão na oferta). */
export function campaignFacts() {
  const byDiscipline = (d: string) => questions.filter((q) => q.discipline === d).length;
  const simulados = kindIds.filter((k) => sessionKinds[k].group === "simulado");
  const treinos = kindIds.filter((k) => sessionKinds[k].group === "treino");
  return {
    modules: modules.length,
    questions: questions.length,
    formulas: formulas.length,
    simulados: simulados.length,
    simuladoQuestions: sessionKinds[simulados[0]].per * 2,
    treinos: treinos.length,
    treinoQuestions: sessionKinds[treinos[0]].per * 2,
    byDiscipline: {
      matematica: byDiscipline("matematica"),
      fisica: byDiscipline("fisica"),
      quimica: byDiscipline("quimica"),
      biologia: byDiscipline("biologia"),
    },
  };
}
