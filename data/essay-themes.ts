export type EssayTheme = {
  id: string;
  title: string;
  category: "Educação" | "Tecnologia" | "Meio ambiente" | "Cidadania" | "Ciência";
  summary: string;
  context: string;
  keyPoints: string[];
  intervention: string;
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
    context: "O debate desloca a segurança escolar de uma resposta apenas policial para uma política permanente de prevenção, cuidado e participação. Isso permite discutir como a escola pode identificar riscos, acolher estudantes e articular a rede pública antes que a violência se agrave.",
    keyPoints: ["prevenção e cultura de cuidado", "protocolos claros para situações de risco", "participação de estudantes, famílias e profissionais"],
    intervention: "Uma proposta consistente pode combinar formação continuada, protocolos de acolhimento, canais seguros de escuta e articulação entre escola, saúde e assistência social.",
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
    context: "Eventos extremos não produzem o mesmo impacto para todos: moradia, renda, mobilidade e acesso a serviços definem a capacidade de prevenção e recuperação. Na redação, é possível relacionar emergência climática, desigualdade territorial e responsabilidade do poder público.",
    keyPoints: ["alertas e preparação comunitária", "infraestrutura urbana resiliente", "proteção prioritária a populações vulneráveis"],
    intervention: "A intervenção pode prever mapeamento de áreas de risco, sistemas de alerta acessíveis, obras de adaptação e educação para prevenção coordenadas por municípios e defesas civis.",
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
    context: "A segurança alimentar depende de condições ambientais e de políticas capazes de reduzir perdas e proteger produtores. O repertório permite tratar clima, tecnologia, agricultura familiar, planejamento e desigualdade sem reduzir o problema à responsabilidade individual do consumidor.",
    keyPoints: ["previsibilidade para o planejamento agrícola", "apoio técnico e financeiro aos produtores", "preservação de água e solo"],
    intervention: "É possível defender monitoramento agroclimático, assistência técnica regionalizada, crédito para adaptação e incentivo a práticas que conservem água, solo e biodiversidade.",
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
    context: "A inteligência artificial pode apoiar personalização e acessibilidade, mas também pode reproduzir vieses, ampliar desigualdades e enfraquecer a autoria quando usada sem orientação. O ponto central é construir uso crítico, transparente e adequado à finalidade pedagógica.",
    keyPoints: ["equidade de acesso e infraestrutura", "proteção de dados e transparência", "mediação docente e autoria do estudante"],
    intervention: "Uma proposta pode incluir formação docente, protocolos de uso responsável, avaliação de vieses e acesso público a ferramentas e conectividade, sob acompanhamento das redes de ensino.",
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
    context: "A conectividade tornou-se condição de participação educacional, mas o acesso é desigual em qualidade, preço, velocidade e domínio de uso. A discussão deve considerar a combinação entre infraestrutura, letramento digital e políticas de inclusão.",
    keyPoints: ["qualidade e continuidade da conexão", "acessibilidade e suporte técnico", "letramento digital para uso autônomo"],
    intervention: "A intervenção pode articular expansão de redes, pontos públicos de acesso, dispositivos acessíveis, formação digital e indicadores de qualidade acompanhados pelo poder público.",
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
    context: "A escola ocupa posição estratégica para perceber sinais de violência, mas não deve agir de forma isolada ou improvisada. O foco argumentativo pode ser a articulação entre prevenção, escuta sem culpabilização e encaminhamento responsável aos serviços competentes.",
    keyPoints: ["escuta protegida e sem exposição", "fluxos de encaminhamento", "integração entre educação, saúde e assistência"],
    intervention: "Uma proposta adequada reúne capacitação profissional, fluxos de denúncia e encaminhamento, ações de prevenção e acompanhamento da rede de proteção, preservando o sigilo da vítima.",
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
    context: "A desinformação não é apenas um problema de opinião: ela pode afetar escolhas de saúde, confiança institucional e respostas coletivas. O repertório permite discutir como informação confiável, linguagem acessível e responsabilidade das plataformas ajudam a reduzir danos.",
    keyPoints: ["verificação de autoria e evidências", "educação midiática desde a escola", "comunicação pública clara e acessível"],
    intervention: "A solução pode combinar alfabetização midiática, comunicação pública baseada em evidências, transparência de plataformas e canais de checagem acessíveis à população.",
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
    context: "A evasão escolar costuma ser resultado de obstáculos acumulados, e não de uma única decisão individual. Uma argumentação forte conecta permanência, desigualdade, trabalho, deslocamento, acolhimento e sentido atribuído à escola.",
    keyPoints: ["busca ativa e acompanhamento de trajetórias", "apoio material e transporte", "currículo conectado ao projeto de vida"],
    intervention: "A proposta pode reunir busca ativa, auxílio permanência, transporte, apoio psicossocial e práticas pedagógicas que aproximem o currículo das realidades juvenis.",
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
    context: "A saúde mental no contexto escolar exige prevenção e cuidado contínuos, sem transformar sofrimento em fraqueza pessoal. O tema permite discutir pressão por desempenho, redes de apoio, acesso a profissionais e responsabilidade institucional.",
    keyPoints: ["prevenção e escuta qualificada", "redução do estigma", "encaminhamento para a rede de cuidado"],
    intervention: "Uma intervenção pode incluir espaços de escuta, formação de educadores, campanhas anties tigma e protocolos de encaminhamento para a rede de saúde, com proteção de dados.",
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
    context: "Participar da vida pública envolve mais do que estar presente: requer acesso, representação e possibilidade de influenciar decisões. Cultura, escola e território podem funcionar como portas de entrada para uma cidadania ativa.",
    keyPoints: ["acesso democrático à cultura", "representação de diferentes juventudes", "canais permanentes de participação"],
    intervention: "A proposta pode criar editais e espaços culturais acessíveis, grêmios fortalecidos e consultas juvenis com retorno público sobre as decisões tomadas.",
    angles: ["democracia participativa", "acesso à cultura", "representatividade"],
    sourceLabel: "Tema editorial Desbloqueia ENEM",
    sourceUrl: "https://www.gov.br/cultura/pt-br/assuntos",
    updatedAt: "outubro de 2026",
  },
];

export const featuredEssayThemes = essayThemes.filter((theme) => theme.featured);

