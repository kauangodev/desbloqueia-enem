import type { Question } from "./question-bank";

const letters = ["A", "B", "C", "D", "E"] as const;
const contexts = [
  "uma escola pública", "uma biblioteca comunitária", "uma cooperativa local", "um laboratório didático",
  "um projeto de mobilidade", "uma campanha de saúde", "um coletivo cultural", "uma pesquisa de campo",
  "uma feira de ciências", "um conselho de bairro", "uma iniciativa de reciclagem", "um grupo de estudantes",
];

function rotate<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

function makeQuestion(
  id: string,
  activity: "exercicios" | "simulado-1" | "simulado-2",
  collectionId: string,
  number: number,
  area: string,
  topic: string,
  difficulty: Question["difficulty"],
  statement: string,
  options: string[],
  correct: string,
  explanation: string,
  nextStep: string,
  seed: number,
): Question {
  const ordered = rotate(options, seed % options.length);
  const answerIndex = ordered.indexOf(correct);
  return {
    id,
    batchId: Math.ceil(Number(id.replace("aut-", "")) / 100),
    activity,
    collectionId,
    number,
    area,
    topic,
    difficulty,
    statement,
    options: ordered.map((text, index) => ({ id: letters[index], text })),
    answer: letters[answerIndex],
    explanation,
    nextStep,
    sourceLabel: "Autoral · matriz ENEM · lote gerado para revisão",
    origin: "desbloqueio_enem_autoral",
    version: 1,
    reviewStatus: "revisao_inicial",
  };
}

function buildQuestion(
  id: string,
  activity: "exercicios" | "simulado-1" | "simulado-2",
  collectionId: string,
  number: number,
  seed: number,
): Question {
  const context = contexts[seed % contexts.length];
  const areaIndex = seed % 4;
  const difficulty = seed % 3 === 0 ? "alta" : "média";
  const prefix = `Em uma situação analisada por ${context},`;

  if (areaIndex === 0) {
    const kind = seed % 6;
    if (kind === 0) return makeQuestion(id, activity, collectionId, number, "Linguagens", "Finalidade textual", difficulty, `${prefix} um texto apresenta dados, fontes e uma conclusão. A finalidade predominante é`, ["informar e sustentar uma análise", "narrar uma aventura", "ensinar uma receita", "descrever uma personagem", "produzir apenas humor"], "informar e sustentar uma análise", "A combinação de dados, fontes e conclusão organiza uma exposição fundamentada.", "Identifique finalidade, público e evidências.", seed);
    if (kind === 1) return makeQuestion(id, activity, collectionId, number, "Linguagens", "Conectivos", difficulty, `${prefix} a frase “a ação foi ampliada, portanto o alcance aumentou” usa “portanto” para indicar`, ["conclusão", "oposição", "causa", "condição", "alternância"], "conclusão", "“Portanto” encaminha a ideia resultante dos argumentos anteriores.", "Revise conectivos conclusivos e suas relações.", seed);
    if (kind === 2) return makeQuestion(id, activity, collectionId, number, "Linguagens", "Variação linguística", difficulty, `${prefix} uma personagem muda do registro informal para o formal conforme o interlocutor. Essa mudança mostra`, ["adequação ao contexto", "erro de comunicação", "ausência de identidade", "uso exclusivo da norma-padrão", "fim da oralidade"], "adequação ao contexto", "Registros variam conforme situação, interlocutor e objetivo comunicativo.", "Relacione variedade e situação de uso.", seed);
    if (kind === 3) return makeQuestion(id, activity, collectionId, number, "Linguagens", "Texto multimodal", difficulty, `${prefix} um infográfico combina cores, ícones e percentuais. Esses elementos servem para`, ["organizar relações entre informações", "eliminar a fonte dos dados", "substituir todo texto verbal", "impedir comparação", "produzir apenas decoração"], "organizar relações entre informações", "A multimodalidade distribui informações entre diferentes modos de representação.", "Leia título, legenda, escala e dados.", seed);
    if (kind === 4) return makeQuestion(id, activity, collectionId, number, "Linguagens", "Argumentação", difficulty, `${prefix} o autor apresenta uma objeção e responde a ela. Esse procedimento tende a`, ["fortalecer a defesa da tese", "eliminar a necessidade de evidências", "mudar o tema sem aviso", "impedir o contraditório", "transformar opinião em lei"], "fortalecer a defesa da tese", "Antecipar e responder a objeções torna a argumentação mais completa.", "Separe tese, objeção e refutação.", seed);
    return makeQuestion(id, activity, collectionId, number, "Linguagens", "Sentido figurado", difficulty, `${prefix} a frase “a informação abriu caminhos” emprega “caminhos” em sentido`, ["figurado", "cartográfico literal", "jurídico", "estatístico", "químico"], "figurado", "A expressão associa informação a possibilidades, sem indicar caminhos físicos.", "Diferencie sentido literal e conotativo.", seed);
  }

  if (areaIndex === 1) {
    const kind = seed % 6;
    if (kind === 0) return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Cidadania", difficulty, `${prefix} moradores acompanham a execução de uma política e questionam seus resultados. Essa prática é exemplo de`, ["controle social", "censura", "hereditariedade", "isolamento político", "privatização automática"], "controle social", "A participação e a fiscalização de políticas públicas caracterizam controle social.", "Relacione transparência, participação e direitos.", seed);
    if (kind === 1) return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Urbanização", difficulty, `${prefix} o aumento de superfícies impermeáveis tende a`, ["elevar o escoamento superficial", "ampliar a infiltração em toda a área", "eliminar ilhas de calor", "aumentar a cobertura vegetal", "reduzir alagamentos automaticamente"], "elevar o escoamento superficial", "Concreto e asfalto reduzem infiltração e aceleram o escoamento da chuva.", "Relacione ocupação do solo, drenagem e risco.", seed);
    if (kind === 2) return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Trabalho", difficulty, `${prefix} a automação substitui tarefas repetitivas e cria demanda por novas habilidades. O processo exemplifica`, ["reorganização da divisão do trabalho", "fim de toda produtividade", "desaparecimento da tecnologia", "retorno obrigatório ao artesanato", "igualdade imediata de renda"], "reorganização da divisão do trabalho", "Mudanças tecnológicas alteram tarefas, qualificações e relações produtivas.", "Compare tecnologia, trabalho e qualificação.", seed);
    if (kind === 3) return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Geografia", difficulty, `${prefix} o mapa utiliza tonalidades para mostrar diferenças entre regiões. A legenda permite`, ["interpretar a convenção visual", "alterar a escala real", "eliminar coordenadas", "definir a renda de cada pessoa", "substituir o título"], "interpretar a convenção visual", "A legenda explica o significado das cores e símbolos cartográficos.", "Leia legenda, escala e distribuição espacial.", seed);
    if (kind === 4) return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Democracia", difficulty, `${prefix} diferentes grupos defendem propostas e disputam decisões públicas. A existência desse conflito indica`, ["pluralidade de interesses", "ausência de política", "fim das instituições", "consenso obrigatório", "neutralidade social"], "pluralidade de interesses", "A democracia envolve divergências, negociação e disputa legítima por decisões.", "Relacione conflito, representação e participação.", seed);
    return makeQuestion(id, activity, collectionId, number, "Ciências Humanas", "Meio ambiente", difficulty, `${prefix} uma comunidade sofre mais com poluição e tem menos acesso à proteção pública. A situação evidencia`, ["desigualdade ambiental", "distribuição uniforme de riscos", "ausência de território", "neutralidade do ambiente", "fim das políticas públicas"], "desigualdade ambiental", "Riscos e proteção podem ser distribuídos de forma desigual entre grupos e territórios.", "Analise vulnerabilidade e justiça ambiental.", seed);
  }

  if (areaIndex === 2) {
    const kind = seed % 6;
    if (kind === 0) return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Ecologia", difficulty, `${prefix} a retirada de um predador provoca aumento de sua presa. O efeito mostra`, ["uma alteração na teia alimentar", "a interrupção da fotossíntese", "a criação de matéria sem energia", "o fim dos produtores", "a ausência de competição"], "uma alteração na teia alimentar", "A remoção de uma espécie modifica relações de predação e pode gerar cascatas ecológicas.", "Analise efeitos entre níveis tróficos.", seed);
    if (kind === 1) return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Química", difficulty, `${prefix} uma solução apresenta pH 2. Em relação a uma solução de pH 6, ela é`, ["mais ácida", "menos ácida", "neutra", "mais básica", "sem íons"], "mais ácida", "Valores menores de pH indicam maior acidez e maior concentração relativa de H+.", "Relacione escala de pH e concentração de íons.", seed);
    if (kind === 2) return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Física", difficulty, `${prefix} um corpo aumenta sua velocidade em linha reta. Sua aceleração média é`, ["positiva no sentido adotado", "necessariamente nula", "igual à massa", "sempre negativa", "independente do tempo"], "positiva no sentido adotado", "Se a velocidade cresce no sentido positivo escolhido, há variação positiva da velocidade.", "Compare velocidade, variação e aceleração.", seed);
    if (kind === 3) return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Saúde", difficulty, `${prefix} a vacinação reduz a circulação de um agente porque`, ["diminui a parcela suscetível", "elimina saneamento", "impede toda mutação", "substitui higiene", "aumenta a transmissão"], "diminui a parcela suscetível", "A imunização reduz o número de pessoas disponíveis para a cadeia de transmissão.", "Diferencie proteção individual e coletiva.", seed);
    if (kind === 4) return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Genética", difficulty, `${prefix} uma característica hereditária aumenta a reprodução em certo ambiente. Pela seleção natural, ela tende a`, ["tornar-se mais frequente", "surgir por vontade do indivíduo", "desaparecer sempre", "impedir variação", "ser igual em qualquer ambiente"], "tornar-se mais frequente", "Variantes hereditárias associadas a maior sucesso reprodutivo podem aumentar de frequência.", "Separe hereditariedade, ambiente e seleção.", seed);
    return makeQuestion(id, activity, collectionId, number, "Ciências da Natureza", "Energia", difficulty, `${prefix} uma lâmpada transforma energia elétrica principalmente em`, ["luz e calor", "massa e som", "água e matéria orgânica", "carga e combustível", "pressão e volume"], "luz e calor", "Parte da energia elétrica vira luz e parte é dissipada como calor.", "Relacione energia de entrada, saída e perdas.", seed);
  }

  const kind = seed % 6;
  if (kind === 0) {
    const base = 100 + (seed % 8) * 25;
    const rate = 10 + (seed % 4) * 5;
    const value = base * rate / 100;
    return makeQuestion(id, activity, collectionId, number, "Matemática", "Porcentagem", difficulty, `${prefix} uma quantia de R$ ${base} sofre variação de ${rate}%. O valor correspondente à variação é`, [`R$ ${value}`, `R$ ${base - value}`, `R$ ${base + value}`, `R$ ${rate * 2}`, `R$ ${base}`], `R$ ${value}`, `${rate}% de ${base} é calculado por ${base}×${rate}/100=${value}.`, "Converta o percentual em fator ou fração.", seed);
  }
  if (kind === 1) {
    const x = 3 + (seed % 8);
    const coefficient = 2 + (seed % 3);
    const constant = 4 + (seed % 6);
    const result = coefficient * x + constant;
    return makeQuestion(id, activity, collectionId, number, "Matemática", "Função afim", difficulty, `${prefix} a função de custo é C(x)=${coefficient}x+${constant}. Para x=${x}, o custo é`, [`${result}`, `${result + coefficient}`, `${result - constant}`, `${coefficient + constant}`, `${x + constant}`], `${result}`, `Substituindo x=${x}, C=${coefficient}×${x}+${constant}=${result}.`, "Identifique termo fixo, coeficiente e variável.", seed);
  }
  if (kind === 2) {
    const base = 4 + (seed % 7);
    const height = 3 + ((seed * 2) % 6);
    const area = base * height;
    return makeQuestion(id, activity, collectionId, number, "Matemática", "Área", difficulty, `${prefix} um paralelogramo tem base ${base} cm e altura ${height} cm. Sua área é`, [`${area} cm²`, `${base + height} cm²`, `${2 * area} cm²`, `${base * 2 + height} cm²`, `${area / 2} cm²`], `${area} cm²`, `A área do paralelogramo é base×altura=${base}×${height}=${area} cm².`, "Use a altura perpendicular à base.", seed);
  }
  if (kind === 3) {
    const total = 6 + (seed % 7);
    const favorable = 2 + (seed % (total - 2));
    const fraction = `${favorable}/${total}`;
    return makeQuestion(id, activity, collectionId, number, "Matemática", "Probabilidade", difficulty, `${prefix} há ${favorable} resultados favoráveis em ${total} possibilidades equiprováveis. A probabilidade é`, [fraction, `${total}/${favorable}`, `1/${total}`, `${favorable + 1}/${total}`, `${favorable}/${total + 1}`], fraction, `A probabilidade é casos favoráveis dividido pelo total: ${favorable}/${total}.`, "Defina o espaço amostral antes de calcular.", seed);
  }
  if (kind === 4) {
    const first = 4 + (seed % 9);
    const second = first + 2 + (seed % 5);
    const third = second + 1 + (seed % 4);
    const average = (first + second + third) / 3;
    return makeQuestion(id, activity, collectionId, number, "Matemática", "Média aritmética", difficulty, `${prefix} os valores observados são ${first}, ${second} e ${third}. A média é`, [`${average}`, `${first}`, `${second}`, `${third}`, `${first + second + third}`], `${average}`, `A média é (${first}+${second}+${third})/3=${average}.`, "Some os valores e divida pela quantidade de observações.", seed);
  }
  const kilograms = 1 + (seed % 9) / 2;
  const grams = kilograms * 1000;
  return makeQuestion(id, activity, collectionId, number, "Matemática", "Conversão de unidades", difficulty, `${prefix} uma massa de ${kilograms} kg corresponde a`, [`${grams} g`, `${grams / 10} g`, `${grams / 100} g`, `${kilograms} g`, `${grams * 10} g`], `${grams} g`, `Como 1 kg=1000 g, ${kilograms} kg=${grams} g.`, "Converta usando a unidade solicitada.", seed);
}

export const generatedQuestions: Question[] = [];
let generatedIndex = 301;

// 51 listas novas com 24 exercícios cada: lista-10 até lista-60.
for (let list = 10; list <= 60; list += 1) {
  const collectionId = `lista-${String(list).padStart(2, "0")}`;
  for (let number = 1; number <= 24; number += 1) {
    generatedQuestions.push(buildQuestion(`aut-${generatedIndex++}`, "exercicios", collectionId, number, list * 31 + number));
  }
}

// Completa os dois simulados legados com oito questões e cria os simulados 03–30.
for (const [activity, collectionId] of [["simulado-1", "simulado-1"], ["simulado-2", "simulado-2"]] as const) {
  for (let number = 13; number <= 20; number += 1) {
    generatedQuestions.push(buildQuestion(`aut-${generatedIndex++}`, activity, collectionId, number, generatedIndex));
  }
}
for (let simulation = 3; simulation <= 30; simulation += 1) {
  const activity = simulation % 2 ? "simulado-1" : "simulado-2";
  const collectionId = `simulado-${String(simulation).padStart(2, "0")}`;
  for (let number = 1; number <= 20; number += 1) {
    generatedQuestions.push(buildQuestion(`aut-${generatedIndex++}`, activity, collectionId, number, simulation * 43 + number));
  }
}

