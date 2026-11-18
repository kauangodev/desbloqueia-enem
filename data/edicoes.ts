import type { Edition } from "../lib/edicoes/model";

/**
 * Edições do ENEM (configuração versionada no código; a publicação passa pela revisão do repositório).
 * - 2026: arquivada. Datas das duas aplicações e liberação de provas e gabaritos conforme notícias do Inep.
 * - 2027: ativa, com calendário **a confirmar**: nenhuma data é estimada a partir de 2026.
 * Fonte do cronograma oficial: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma
 */
const CRONOGRAMA = "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma";

export const editions: Edition[] = [
  {
    key: "enem-2026", exam: "enem", year: 2026, label: "ENEM 2026", status: "arquivada", publishedAt: "2026-11-18T12:00:00-03:00",
    note: "Aplicação regular encerrada em 15/11/2026. Cadernos, gabaritos e questões desta edição ficam no acervo histórico.",
    events: [
      { key: "prova-dia-1", kind: "prova-dia-1", label: "1º dia de prova (Linguagens, Humanas e Redação)", date: "2026-11-08", status: "confirmado", audience: "participantes regulares", sourceUrl: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/enem-2026-primeiro-dia-de-provas-ocorre-neste-domingo-8/" },
      { key: "prova-dia-2", kind: "prova-dia-2", label: "2º dia de prova (Matemática e Ciências da Natureza)", date: "2026-11-15", time: "18:30", status: "confirmado", audience: "participantes regulares", sourceUrl: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/enem-2026-segundo-dia-de-prova-chega-ao-fim-neste-domingo-15-1" },
      { key: "gabarito", kind: "gabarito", label: "Provas e gabaritos liberados para consulta", date: "2026-11-18", status: "confirmado", sourceUrl: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enem/enem-2026-inep-libera-para-consulta-gabaritos-e-cadernos-de-questoes-do-exame" },
    ],
  },
  {
    key: "enem-2027", exam: "enem", year: 2027, label: "ENEM 2027", status: "ativa", publishedAt: "2026-11-18T12:00:00-03:00",
    note: "Calendário oficial a confirmar. Esta edição organiza a preparação; direitos de compra já feitos continuam valendo.",
    events: [
      { key: "inscricao", kind: "inscricao", label: "Inscrições", date: null, status: "a-confirmar", sourceUrl: CRONOGRAMA },
      { key: "prova-dia-1", kind: "prova-dia-1", label: "1º dia de prova", date: null, status: "a-confirmar", sourceUrl: CRONOGRAMA },
      { key: "prova-dia-2", kind: "prova-dia-2", label: "2º dia de prova", date: null, status: "a-confirmar", sourceUrl: CRONOGRAMA },
      { key: "gabarito", kind: "gabarito", label: "Gabaritos", date: null, status: "a-confirmar", sourceUrl: CRONOGRAMA },
    ],
  },
];
