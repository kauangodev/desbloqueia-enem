export type EssayTheme = {
  id: string;
  title: string;
  category: "Educação" | "Tecnologia" | "Meio ambiente" | "Cidadania" | "Ciência";
  summary: string;
  angles: string[];
  sourceLabel: string;
  sourceUrl: string;
  updatedAt: string;
  featured?: boolean;
};

/**
 * Repertório autoral de apoio. Os textos são sínteses editoriais curtas;
 * a fonte oficial deve ser consultada antes de usar dados específicos.
 */
export const essayThemes: EssayTheme[] = [
  {
    id: "seguranca-saude-escolas",
    title: "Segurança e saúde no ambiente escolar",
    category: "Educação",
    summary: "A escola também é um espaço de prevenção. Iniciativas de segurança e saúde escolar estimulam diagnóstico de riscos, participação da comunidade e ações educativas contínuas.",
    angles: ["prevenção e corresponsabilidade", "infraestrutura e políticas públicas", "participação estudantil"],
    sourceLabel: "Iniciativa Segurança e Saúde nas Escolas",
    sourceUrl: "https://segurancaesaudenasescolas.trabalho.gov.br/pt/noticias/iniciativa-sse-lanca-4a-edicao-da-campanha-nacional-de-incentivo-a-criacao-das-cipas-escolares-75",
    updatedAt: "outubro de 2026",
    featured: true,
  },
  {
    id: "eventos-climaticos-extremos",
    title: "Eventos climáticos extremos e adaptação",
    category: "Meio ambiente",
    summary: "Chuvas intensas, secas, ondas de calor e outros extremos afetam territórios de forma desigual. O debate envolve prevenção, planejamento urbano, alertas e proteção das populações vulneráveis.",
    angles: ["justiça climática", "defesa civil e planejamento", "infraestrutura resiliente"],
    sourceLabel: "Cemaden — Estado do clima no Brasil",
    sourceUrl: "https://www.gov.br/cemaden/pt-br/assuntos/monitoramento/estado-do-clima-extremos-de-clima-e-desastres-no-brasil/estado-do-clima-extremos-de-clima-e-desastres-no-brasil-02-2026/",
    updatedAt: "fevereiro de 2026",
    featured: true,
  },
  {
    id: "gestao-riscos-climaticos",
    title: "Gestão de riscos climáticos e segurança alimentar",
    category: "Meio ambiente",
    summary: "A variabilidade climática interfere na produção de alimentos, na água e na renda de comunidades. Medidas de monitoramento, pesquisa, financiamento e assistência técnica ajudam a reduzir vulnerabilidades.",
    angles: ["adaptação e mitigação", "segurança alimentar", "políticas de prevenção"],
    sourceLabel: "Mapa e Embrapa — riscos agroclimáticos",
    sourceUrl: "https://www.gov.br/agricultura/pt-br/assuntos/noticias/em-ano-de-el-nino-mapa-recebe-da-embrapa-163-medidas-para-gestao-de-riscos-climaticos-no-campo/",
    updatedAt: "setembro de 2026",
  },
  {
    id: "ia-pensamento-critico",
    title: "Inteligência artificial e pensamento crítico na educação",
    category: "Tecnologia",
    summary: "O uso educacional da inteligência artificial pode ampliar oportunidades, mas exige mediação pedagógica, transparência, proteção de dados e formação para avaliar informações com responsabilidade.",
    angles: ["equidade de acesso", "autoria e ética", "formação de professores"],
    sourceLabel: "UNESCO — tecnologia e pensamento crítico",
    sourceUrl: "https://www.unesco.org/en/articles/unesco-ict-prize-awards-dynamic-projects-promoting-creativity-and-critical-thinking-finland-and",
    updatedAt: "setembro de 2026",
    featured: true,
  },
  {
    id: "internet-educacao",
    title: "Acesso à internet como condição de aprendizagem",
    category: "Tecnologia",
    summary: "Conectar estudantes não é apenas oferecer um dispositivo: envolve rede estável, acessibilidade, suporte, formação e políticas que reduzam diferenças entre territórios e grupos sociais.",
    angles: ["desigualdade regional", "infraestrutura pública", "letramento digital"],
    sourceLabel: "FNDE — internet na educação básica",
    sourceUrl: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2026",
    updatedAt: "agosto de 2026",
  },
  {
    id: "protecao-violencia-escolar",
    title: "Proteção de crianças e adolescentes no espaço escolar",
    category: "Cidadania",
    summary: "Enfrentar a violência contra crianças e adolescentes depende de protocolos claros, escuta qualificada, sigilo e articulação entre escola, família e rede de proteção.",
    angles: ["rede intersetorial", "prevenção e acolhimento", "direitos da infância"],
    sourceLabel: "Ministério da Igualdade Racial — Escola que Protege",
    sourceUrl: "https://www.gov.br/igualdaderacial/pt-br/assuntos/programas-e-projetos/observatorio-de-monitoramento-e-avaliacao/politicas-intergovernamentais/educacao/perguntas-e-respostas/programa-escola-que-protege/",
    updatedAt: "outubro de 2026",
    featured: true,
  },
  {
    id: "desinformacao-cientifica",
    title: "Desinformação científica e responsabilidade coletiva",
    category: "Ciência",
    summary: "A circulação de conteúdos sem verificação dificulta decisões individuais e políticas públicas. A resposta passa por educação midiática, comunicação acessível e consulta a fontes confiáveis.",
    angles: ["letramento midiático", "confiança na ciência", "responsabilidade das plataformas"],
    sourceLabel: "Tema editorial Desbloqueia ENEM",
    sourceUrl: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/comunicacao-em-saude",
    updatedAt: "outubro de 2026",
  },
  {
    id: "permanencia-escolar",
    title: "Caminhos para a permanência de jovens na escola",
    category: "Educação",
    summary: "Permanecer na escola depende de aprendizagem significativa, acolhimento, segurança, transporte, renda e perspectiva de futuro. O tema permite relacionar fatores individuais a políticas públicas.",
    angles: ["busca ativa", "desigualdades sociais", "projeto de vida"],
    sourceLabel: "Tema editorial Desbloqueia ENEM",
    sourceUrl: "https://www.gov.br/mec/pt-br/assuntos/educacao-basica",
    updatedAt: "outubro de 2026",
  },
  {
    id: "saude-mental-estudantes",
    title: "Saúde mental e pressão por desempenho",
    category: "Ciência",
    summary: "A preparação para provas pode ser atravessada por ansiedade, isolamento e cobrança. A escola e as redes de cuidado podem promover prevenção, escuta e encaminhamento sem estigmatizar o estudante.",
    angles: ["prevenção", "acolhimento", "responsabilidade institucional"],
    sourceLabel: "Tema editorial Desbloqueia ENEM",
    sourceUrl: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental",
    updatedAt: "outubro de 2026",
  },
  {
    id: "cultura-participacao-jovem",
    title: "Cultura e participação social da juventude",
    category: "Cidadania",
    summary: "A participação juvenil se fortalece quando escolas e espaços públicos reconhecem diferentes repertórios culturais e criam canais reais de escuta e decisão.",
    angles: ["democracia participativa", "acesso à cultura", "representatividade"],
    sourceLabel: "Tema editorial Desbloqueia ENEM",
    sourceUrl: "https://www.gov.br/cultura/pt-br/assuntos",
    updatedAt: "outubro de 2026",
  },
];

export const featuredEssayThemes = essayThemes.filter((theme) => theme.featured);

