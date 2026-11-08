import type { Difficulty, Discipline, Origin, Question } from "../../lib/operacao/types";
import { placeAnswer } from "./qbuild";
import { questionsMat2 } from "./questions-mat2";
import { questionsMat3 } from "./questions-mat3";
import { questionsNat2 } from "./questions-nat2";
import { questionsS1 } from "./questions-s1";
import { questionsS2 } from "./questions-s2";
import { questionsS3 } from "./questions-s3";
import { questionsS4 } from "./questions-s4";

/**
 * Banco de questões — Operação 2º Domingo.
 *
 * OFICIAIS: reconstruídas a partir do texto extraído dos PDFs oficiais do Inep (cadernos azul e gabaritos de 2016 e 2017).
 * Só entram itens cujo enunciado e alternativas estão íntegros no texto, sem dependência de figura, e cuja resolução própria
 * chega ao gabarito oficial. Itens com figura, alternativas incompletas ou duvidosas ficaram de fora.
 * Conferência: texto extraído do PDF (sem conferência visual de página) + gabarito do PDF de gabaritos + cálculo independente.
 *
 * AUTORAIS: elaboradas pela GoDev Education no estilo Enem; cada item foi resolvido e as contas conferidas.
 * Revisão por professor da disciplina: pendente.
 */
const reviewedAt = "2026-11-08";
const inep = (year: number) => `https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/${year}`;

type Letter = "A" | "B" | "C" | "D" | "E";
type Draft = {
  id: string; d: Discipline; topic: string; module?: string; origin: Origin; diff: Difficulty; min: number;
  statement: string; options: [string, string, string, string, string]; answer: Letter; resolution: string;
  why?: Partial<Record<Letter, string>>; misconception: string;
  official?: { year: number; number: number };
};

const build = (x: Draft): Question => {
  const placed = x.official ? null : placeAnswer(x.id, [...x.options], x.answer, x.why || {});
  return buildRaw(x, placed);
};
const buildRaw = (x: Draft, placed: ReturnType<typeof placeAnswer> | null): Question => ({
  id: x.id,
  discipline: x.d,
  topic: x.topic,
  moduleId: x.module ?? "",
  origin: x.origin,
  official: x.official ? { year: x.official.year, day: 2, caderno: "azul", number: x.official.number, sourceUrl: inep(x.official.year) } : undefined,
  statement: x.statement,
  options: placed ? placed.options : x.options.map((text, i) => ({ id: "ABCDE"[i] as Letter, text })),
  answer: placed ? placed.answer : x.answer,
  resolution: x.resolution,
  distractors: placed ? placed.distractors : x.why || {},
  misconception: x.misconception,
  minutes: x.min,
  difficulty: x.diff,
  status: "publicado",
  reviewedAt,
  source: x.official
    ? { label: `Inep — Enem ${x.official.year}, caderno azul, questão ${x.official.number}`, url: inep(x.official.year), reuse: "Prova pública do Inep reproduzida com fins educacionais e atribuição. Resolução e comentários são autorais da GoDev Education." }
    : { label: "Autoria GoDev Education", reuse: "Conteúdo autoral." },
});

const O = (year: number, number: number, d: Discipline, topic: string, module: string | undefined, diff: Difficulty, min: number, rest: Omit<Draft, "id" | "d" | "topic" | "module" | "origin" | "diff" | "min" | "official">): Question =>
  build({ id: `enem-${year}-${String(number).padStart(3, "0")}`, d, topic, module, origin: "oficial", diff, min, official: { year, number }, ...rest });
const A = (id: string, d: Discipline, topic: string, module: string, diff: Difficulty, min: number, rest: Omit<Draft, "id" | "d" | "topic" | "module" | "origin" | "diff" | "min" | "official">): Question =>
  build({ id, d, topic, module, origin: "autoral", diff, min, ...rest });

const official: Question[] = [
  // ---------- MATEMÁTICA (oficiais) ----------
  O(2016, 145, "matematica", "Porcentagem", "mat-porcentagem", "dificil", 4, {
    statement: "A Lei n.º 8.213/91 (art. 93) obriga empresas com 100 ou mais empregados a preencher de 2% a 5% dos cargos com beneficiários reabilitados ou pessoas com deficiência habilitadas, na seguinte proporção: até 200 empregados, 2%; de 201 a 500, 3%; de 501 a 1 000, 4%; de 1 001 em diante, 5%.\n\nUma empresa possui 1 200 funcionários, dos quais 10 são reabilitados ou com deficiência, habilitados. Para se adequar à lei, ela contratará apenas empregados com esse perfil. O número mínimo de empregados reabilitados ou com deficiência, habilitados, que deverá ser contratado é",
    options: ["74", "70", "64", "60", "53"], answer: "E",
    resolution: "Com mais de 1 001 empregados, a cota é de 5% **do total**, e o total aumenta a cada contratação. Seja $x$ o número de contratados (todos com o perfil): o total passa a ser $1\\,200+x$ e o número de empregados do perfil, $10+x$.\n\n$$10+x \\ge 0{,}05\\,(1\\,200+x) \\Rightarrow 10+x \\ge 60+0{,}05x \\Rightarrow 0{,}95x \\ge 50 \\Rightarrow x \\ge 52{,}6$$\n\nComo $x$ é inteiro, o mínimo é $53$.",
    why: { D: "60 seria o número total de empregados do perfil (5% de 1 200), sem descontar os 10 que já existem e sem considerar que o total cresce.", C: "64 resulta de aplicar a cota ao total já aumentado de forma incorreta." },
    misconception: "Esquecer que a contratação também aumenta o total de empregados e, portanto, o valor da cota.",
  }),
  O(2016, 146, "matematica", "Porcentagem", "mat-porcentagem", "media", 3, {
    statement: "Uma pessoa comercializa picolés. No segundo dia de certo evento, ela comprou 4 caixas de picolés, pagando R$ 16,00 a caixa com 20 picolés, para revendê-los no evento. No dia anterior, havia comprado a mesma quantidade de picolés, pagando a mesma quantia, e obtido um lucro de R$ 40,00 (obtido exclusivamente pela diferença entre o valor de venda e o de compra) com a venda de todos os picolés. Pesquisando o perfil do público, ela avalia que será possível obter um lucro 20% maior do que o do primeiro dia. Para atingir seu objetivo, supondo que todos os picolés sejam vendidos no segundo dia, o valor de venda de cada picolé deve ser",
    options: ["R$ 0,96.", "R$ 1,00.", "R$ 1,40.", "R$ 1,50.", "R$ 1,56."], answer: "C",
    resolution: "Custo: $4\\cdot16=R\\$\\,64$ por 80 picolés. Lucro desejado: $40\\cdot1{,}2=R\\$\\,48$. Receita necessária: $64+48=R\\$\\,112$.\n\nPreço por picolé: $\\frac{112}{80}=R\\$\\,1{,}40$.",
    why: { B: "R$ 1,00 daria receita de R$ 80 e lucro de R$ 16.", A: "R$ 0,96 corresponde ao custo (R$ 64) mais 20% de lucro sobre o custo, e não sobre o lucro anterior." },
    misconception: "Aplicar os 20% sobre o custo ou sobre a receita, em vez de aplicar sobre o lucro do dia anterior.",
  }),
  O(2016, 154, "matematica", "Razão e proporção", "mat-razao-proporcao", "facil", 2, {
    statement: "Cinco marcas de pão integral apresentam as seguintes concentrações de fibras (massa de fibra por massa de pão):\n\n- Marca A: 2 g de fibras a cada 50 g de pão;\n- Marca B: 5 g de fibras a cada 40 g de pão;\n- Marca C: 5 g de fibras a cada 100 g de pão;\n- Marca D: 6 g de fibras a cada 90 g de pão;\n- Marca E: 7 g de fibras a cada 70 g de pão.\n\nRecomenda-se a ingestão do pão que possui a maior concentração de fibras. A marca a ser escolhida é",
    options: ["A.", "B.", "C.", "D.", "E."], answer: "B",
    resolution: "Concentração é a razão entre massa de fibra e massa de pão:\n\n- A: $2/50=0{,}040$;\n- B: $5/40=0{,}125$;\n- C: $5/100=0{,}050$;\n- D: $6/90\\approx0{,}067$;\n- E: $7/70=0{,}100$.\n\nA maior razão é a da marca **B**.",
    why: { E: "A marca E tem a maior quantidade de fibra (7 g), mas em uma porção maior de pão: a razão é menor.", C: "Também tem 5 g de fibra, porém em 100 g de pão." },
    misconception: "Comparar apenas a massa de fibra, sem dividir pela massa de pão (comparar razões, não numeradores).",
  }),
  O(2016, 156, "matematica", "Razão e proporção", "mat-razao-proporcao", "media", 4, {
    statement: "Para garantir a segurança de um grande evento que terá início às 4 h da tarde, um organizador precisa monitorar a quantidade de pessoas presentes em cada instante. Para cada 2 000 pessoas se faz necessária a presença de um policial. Além disso, estima-se uma densidade de quatro pessoas por metro quadrado de área de terreno ocupado. Às 10 h da manhã, o organizador verifica que a área de terreno já ocupada equivale a um quadrado com lados medindo 500 m. Porém, nas horas seguintes, espera-se que o público aumente a uma taxa de 120 000 pessoas por hora até o início do evento, quando não será mais permitida a entrada de público. Quantos policiais serão necessários no início do evento para garantir a segurança?",
    options: ["360", "485", "560", "740", "860"], answer: "E",
    resolution: "Às 10 h: área $=500\\cdot500=250\\,000\\ \\text{m}^2$; pessoas $=4\\cdot250\\,000=1\\,000\\,000$.\n\nDas 10 h às 16 h são $6$ horas: $6\\cdot120\\,000=720\\,000$ pessoas a mais, totalizando $1\\,720\\,000$.\n\nPoliciais: $\\frac{1\\,720\\,000}{2\\,000}=860$.",
    why: { D: "740 corresponde a usar apenas 5 horas de crescimento: o evento começa às 16 h, seis horas depois das 10 h.", C: "560 considera apenas 1 000 000 pessoas mais 120 000 (uma hora)." },
    misconception: "Contar mal o intervalo de tempo (das 10 h às 16 h são 6 horas) ou esquecer a população já presente às 10 h.",
  }),
  O(2016, 160, "matematica", "Variações sucessivas e logaritmos", "mat-porcentagem", "dificil", 6, {
    statement: "Uma liga metálica sai do forno a uma temperatura de 3 000 °C e diminui 1% de sua temperatura a cada 30 minutos. Use 0,477 como aproximação para $\\log_{10}3$ e 1,041 como aproximação para $\\log_{10}11$. O tempo decorrido, em hora, até que a liga atinja 30 °C é mais próximo de",
    options: ["22.", "50.", "100.", "200.", "400."], answer: "D",
    resolution: "A cada 30 min a temperatura é multiplicada por $0{,}99$. Após $n$ períodos: $3\\,000\\cdot0{,}99^n=30$, ou seja, $0{,}99^n=0{,}01$.\n\nAplicando $\\log$: $n\\log0{,}99=-2$. Como $0{,}99=\\frac{99}{100}=\\frac{9\\cdot11}{100}$:\n\n$$\\log0{,}99=2\\cdot0{,}477+1{,}041-2=-0{,}005$$\n\nLogo $n=\\frac{-2}{-0{,}005}=400$ períodos de 30 min, isto é, $200$ horas.",
    why: { E: "400 é o número de períodos de 30 min; o enunciado pede o tempo em horas (metade disso).", A: "Resulta de uma variação de 1% sobre o valor inicial a cada passo (decaimento linear), e não sobre o valor atual." },
    misconception: "Tratar a queda de 1% como subtração constante (linear), em vez de multiplicação sucessiva por 0,99.",
  }),
  O(2016, 165, "matematica", "Progressões aritméticas", "mat-funcoes", "dificil", 5, {
    statement: "Sob a orientação de um mestre de obras, João e Pedro trabalharam na reforma de um edifício. João efetuou reparos na parte hidráulica nos andares 1, 3, 5, 7 e assim sucessivamente, de dois em dois andares. Pedro trabalhou na parte elétrica nos andares 1, 4, 7, 10 e assim sucessivamente, de três em três andares. Coincidentemente, terminaram seus trabalhos no último andar. Na conclusão da reforma, o mestre de obras informou, em seu relatório, o número de andares do edifício. Sabe-se que, ao longo da execução da obra, em exatamente 20 andares foram realizados reparos nas partes hidráulica e elétrica por João e Pedro. Qual é o número de andares desse edifício?",
    options: ["40", "60", "100", "115", "120"], answer: "D",
    resolution: "João trabalha nos andares $1+2k$ e Pedro nos andares $1+3j$. Os dois coincidem nos andares $1+6m$ (mínimo múltiplo comum de 2 e 3, partindo do andar 1): $1, 7, 13, 19,\\ldots$\n\nExatamente 20 coincidências: $m=0,1,\\ldots,19$, e o último é $1+6\\cdot19=115$. Como ambos terminam no último andar, ele é o 115.",
    why: { E: "120 não está na sequência 1 + 6m (1, 7, 13, …): João não pararia nele.", B: "60 não é da forma 1 + 6m." },
    misconception: "Procurar o mínimo múltiplo comum sem considerar que as duas sequências começam no andar 1 (o primeiro andar comum é 1, não 6).",
  }),
  O(2017, 137, "matematica", "Matemática financeira", "mat-porcentagem", "dificil", 6, {
    statement: "Para realizar a viagem dos sonhos, uma pessoa precisava fazer um empréstimo no valor de R$ 5 000,00. Para pagar as prestações, dispõe de, no máximo, R$ 400,00 mensais. Para esse valor de empréstimo, o valor da prestação $P$ é calculado em função do número de prestações $n$ segundo a fórmula\n\n$$P=\\frac{5\\,000\\times1{,}013^{\\,n}\\times0{,}013}{1{,}013^{\\,n}-1}$$\n\nSe necessário, utilize 0,005 como aproximação para $\\log1{,}013$; 2,602 como aproximação para $\\log400$; 2,525 como aproximação para $\\log335$. De acordo com a fórmula dada, o menor número de parcelas cujos valores não comprometem o limite definido pela pessoa é",
    options: ["12", "14", "15", "16", "17"], answer: "D",
    resolution: "Queremos $P\\le400$. Seja $x=1{,}013^n$. Como $5\\,000\\cdot0{,}013=65$:\n\n$$\\frac{65x}{x-1}\\le400\\Rightarrow 65x\\le400x-400\\Rightarrow 335x\\ge400\\Rightarrow x\\ge\\frac{400}{335}$$\n\nAplicando $\\log$: $n\\log1{,}013\\ge\\log400-\\log335=2{,}602-2{,}525=0{,}077$. Então $n\\ge\\frac{0{,}077}{0{,}005}=15{,}4$.\n\nO menor inteiro é $n=16$.",
    why: { C: "15 é o inteiro anterior a 15,4: com 15 parcelas, a prestação ainda ultrapassa R$ 400.", E: "17 também serve, mas não é o menor número." },
    misconception: "Arredondar 15,4 para baixo: como a condição é 'n ≥ 15,4', o menor inteiro que atende é 16.",
  }),
  O(2017, 145, "matematica", "Estatística", "mat-estatistica", "media", 4, {
    statement: "Um instituto de pesquisas eleitorais recebe uma encomenda na qual a margem de erro deverá ser de, no máximo, 2 pontos percentuais (0,02). O instituto tem 5 pesquisas recentes, P1 a P5, sobre o tema objeto da encomenda, e irá usar a que tiver o erro menor que o pedido. Os dados sobre as pesquisas são os seguintes:\n\n- P1: $\\sigma=0{,}5$, $N=1\\,764$, $\\sqrt{N}=42$;\n- P2: $\\sigma=0{,}4$, $N=784$, $\\sqrt{N}=28$;\n- P3: $\\sigma=0{,}3$, $N=576$, $\\sqrt{N}=24$;\n- P4: $\\sigma=0{,}2$, $N=441$, $\\sqrt{N}=21$;\n- P5: $\\sigma=0{,}1$, $N=64$, $\\sqrt{N}=8$.\n\nO erro $e$ pode ser expresso por $|e|<1{,}96\\,\\dfrac{\\sigma}{\\sqrt{N}}$, em que $\\sigma$ é um parâmetro e $N$ é o número de pessoas entrevistadas pela pesquisa. Qual pesquisa deverá ser utilizada?",
    options: ["P1", "P2", "P3", "P4", "P5"], answer: "D",
    resolution: "Calcule $1{,}96\\,\\sigma/\\sqrt{N}$ para cada pesquisa:\n\n- P1: $1{,}96\\cdot0{,}5/42\\approx0{,}0233$;\n- P2: $1{,}96\\cdot0{,}4/28=0{,}0280$;\n- P3: $1{,}96\\cdot0{,}3/24=0{,}0245$;\n- P4: $1{,}96\\cdot0{,}2/21\\approx0{,}0187$;\n- P5: $1{,}96\\cdot0{,}1/8=0{,}0245$.\n\nSó P4 tem erro menor que $0{,}02$.",
    why: { A: "P1 tem a maior amostra, mas também o maior σ: o erro depende da razão σ/√N.", E: "P5 tem o menor σ, mas a amostra é pequena (N = 64)." },
    misconception: "Escolher pelo maior N (ou pelo menor σ) isoladamente, em vez de comparar a razão σ/√N.",
  }),
  // ---------- NATUREZA (oficiais) ----------
  O(2017, 92, "biologia", "Microbiologia e saúde", undefined, "facil", 2, {
    statement: "Os medicamentos são rotineiramente utilizados pelo ser humano com o intuito de diminuir ou, por muitas vezes, curar possíveis transtornos de saúde. Os antibióticos são grupos de fármacos inseridos no tratamento de doenças causadas por bactérias. Na terapêutica das doenças mencionadas, alguns desses fármacos atuam",
    options: ["ativando o sistema imunológico do hospedeiro.", "interferindo na cascata bioquímica da inflamação.", "removendo as toxinas sintetizadas pelas bactérias.", "combatendo as células hospedeiras das bactérias.", "danificando estruturas específicas da célula bacteriana."], answer: "E",
    resolution: "Antibióticos têm **toxicidade seletiva**: agem em estruturas e processos próprios das bactérias (parede celular, ribossomos bacterianos, síntese de DNA), poupando as células do hospedeiro. Por isso a alternativa correta é a que fala em danificar estruturas específicas da célula bacteriana.",
    why: { A: "Quem ativa o sistema imunológico são, por exemplo, as vacinas — não os antibióticos.", D: "Combater as células do hospedeiro seria tóxico para o paciente; o antibiótico mira a bactéria." },
    misconception: "Achar que antibióticos 'fortalecem a defesa' do corpo, quando atuam diretamente sobre a bactéria.",
  }),
  O(2017, 96, "biologia", "Ciclos biogeoquímicos", undefined, "media", 3, {
    statement: "Uma grande virada na moderna história da agricultura ocorreu depois da Segunda Guerra Mundial. Após a guerra, os governos haviam se deparado com um enorme excedente de nitrato de amônio, ingrediente usado na fabricação de explosivos. A partir daí as fábricas de munição foram adaptadas para começar a produzir fertilizantes tendo como componente principal os nitratos.\n\nNo ciclo natural do nitrogênio, o equivalente ao principal componente desses fertilizantes industriais é produzido na etapa de",
    options: ["nitratação.", "nitrosação.", "amonificação.", "desnitrificação.", "fixação biológica do $\\text{N}_2$."], answer: "A",
    resolution: "O componente principal desses fertilizantes é o **nitrato** ($\\text{NO}_3^-$). No ciclo do nitrogênio: a **fixação** converte $\\text{N}_2$ em amônia; a **amonificação** libera amônia na decomposição; a **nitrosação** transforma amônia em nitrito ($\\text{NO}_2^-$); a **nitratação** transforma nitrito em **nitrato**; e a **desnitrificação** devolve $\\text{N}_2$ à atmosfera.",
    why: { B: "A nitrosação produz nitrito, não nitrato.", E: "A fixação biológica produz amônia a partir do N₂ atmosférico." },
    misconception: "Confundir as etapas da nitrificação (nitrosação → nitrito; nitratação → nitrato).",
  }),
  O(2017, 97, "quimica", "Estrutura atômica e emissão de luz", undefined, "media", 3, {
    statement: "Um fato corriqueiro ao se cozinhar arroz é o derramamento de parte da água de cozimento sobre a chama azul do fogo, mudando-a para uma chama amarela. Essa mudança de cor pode suscitar interpretações diversas, relacionadas às substâncias presentes na água de cozimento. Além do sal de cozinha (NaCl), nela se encontram carboidratos, proteínas e sais minerais. Cientificamente, sabe-se que essa mudança de cor da chama ocorre pela",
    options: ["reação do gás de cozinha com o sal, volatilizando gás cloro.", "emissão de fótons pelo sódio, excitado por causa da chama.", "produção de derivado amarelo, pela reação com o carboidrato.", "reação do gás de cozinha com a água, formando gás hidrogênio.", "excitação das moléculas de proteínas, com formação de luz amarela."], answer: "B",
    resolution: "Este é o princípio do **teste de chama**: ao receber energia, elétrons do sódio passam a níveis mais energéticos (**estado excitado**) e, ao retornarem, **emitem fótons** de comprimento de onda característico — no caso do sódio, amarelo-alaranjado. Não há uma nova substância colorida: há emissão de luz pelo átomo excitado.",
    why: { A: "O gás de cozinha não reage com o sal para liberar cloro nessas condições.", C: "Não se forma um 'derivado amarelo': a cor vem da emissão atômica." },
    misconception: "Atribuir a cor da chama a uma reação química que forma um produto colorido, e não à transição eletrônica do átomo.",
  }),
  O(2017, 100, "biologia", "Fisiologia humana e saúde", undefined, "facil", 2, {
    statement: "Pesquisadores criaram um tipo de plaqueta artificial, feita com um polímero gelatinoso coberto de anticorpos, que promete agilizar o processo de coagulação quando injetada no corpo. Se houver sangramento, esses anticorpos fazem com que a plaqueta mude sua forma e se transforme em uma espécie de rede que gruda nas lesões dos vasos sanguíneos e da pele. Qual a doença cujos pacientes teriam melhora de seu estado de saúde com o uso desse material?",
    options: ["Filariose.", "Hemofilia.", "Aterosclerose.", "Doença de Chagas.", "Síndrome da imunodeficiência adquirida."], answer: "B",
    resolution: "O material atua na **coagulação**. A doença associada a falhas na coagulação sanguínea é a **hemofilia** (deficiência de fatores de coagulação). Filariose e doença de Chagas são parasitoses; aterosclerose é o acúmulo de placas nas artérias; a aids é uma imunodeficiência.",
    why: { C: "Na aterosclerose o problema é obstrução por placas, não falta de coagulação.", E: "A aids afeta o sistema imunológico, não a coagulação." },
    misconception: "Relacionar 'sangue' a qualquer doença vascular ou infecciosa, sem identificar a função afetada (coagulação).",
  }),
  O(2017, 109, "biologia", "Ecologia e impactos ambientais", "bio-ecologia", "facil", 2, {
    statement: "O fenômeno da piracema (subida do rio) é um importante mecanismo que influencia a reprodução de algumas espécies de peixes, pois induz o processo que estimula a queima de gordura e ativa mecanismos hormonais complexos, preparando-os para a reprodução. Intervenções antrópicas nos ambientes aquáticos, como a construção de barragens, interferem na reprodução desses animais. Essa intervenção antrópica prejudica a piracema porque reduz o(a)",
    options: ["percurso da migração.", "longevidade dos indivíduos.", "disponibilidade de alimentos.", "período de migração da espécie.", "número de espécies de peixes no local."], answer: "A",
    resolution: "A piracema depende de os peixes **percorrerem uma distância** rio acima, o que dispara as respostas fisiológicas de reprodução. A barragem **interrompe** ou encurta esse percurso e, sem ele, o estímulo não ocorre. As demais alternativas não estão ligadas ao mecanismo descrito no texto.",
    why: { D: "O período (época do ano) não é alterado pela barragem; o que muda é o trajeto disponível.", E: "O número de espécies é consequência, não a causa descrita no texto." },
    misconception: "Responder com consequências gerais de uma barragem em vez de relacionar com o mecanismo fisiológico citado no enunciado.",
  }),
  O(2017, 111, "biologia", "Ecologia: bioacumulação", "bio-ecologia", "facil", 2, {
    statement: "Os botos-cinza (*Sotalia guianensis*), mamíferos da família dos golfinhos, são excelentes indicadores da poluição das áreas em que vivem, pois passam toda a sua vida — cerca de 30 anos — na mesma região. Além disso, a espécie acumula mais contaminantes em seu organismo, como o mercúrio, do que outros animais da sua cadeia alimentar. Os botos-cinza acumulam maior concentração dessas substâncias porque",
    options: ["são animais herbívoros.", "são animais detritívoros.", "são animais de grande porte.", "digerem o alimento lentamente.", "estão no topo da cadeia alimentar."], answer: "E",
    resolution: "Substâncias não degradáveis, como o mercúrio, se acumulam nos tecidos e **aumentam de concentração a cada nível trófico** (magnificação trófica). Quem está no **topo da cadeia** ingere presas que já acumularam as substâncias de vários níveis — por isso concentra mais.",
    why: { A: "Herbívoros estão na base da cadeia e acumulam menos.", C: "O porte, por si só, não explica a concentração: o que importa é a posição trófica." },
    misconception: "Explicar a bioacumulação pelo tamanho do animal ou pela digestão, e não pela posição na cadeia alimentar.",
  }),
  O(2017, 115, "quimica", "Matéria, misturas e separação", undefined, "facil", 2, {
    statement: "As centrífugas são equipamentos utilizados em laboratórios, clínicas e indústrias. Seu funcionamento faz uso da aceleração centrífuga obtida pela rotação de um recipiente e que serve para a separação de sólidos em suspensão em líquidos ou de líquidos misturados entre si. Nesse aparelho, a separação das substâncias ocorre em função",
    options: ["das diferentes densidades.", "dos diferentes raios de rotação.", "das diferentes velocidades angulares.", "das diferentes quantidades de cada substância.", "da diferente coesão molecular de cada substância."], answer: "A",
    resolution: "Na centrifugação, a rotação cria uma aceleração que funciona como um \"campo gravitacional\" muito mais intenso. Componentes **mais densos** são lançados para o fundo (periferia) e os **menos densos** permanecem mais próximos do centro. A separação, portanto, se dá pela **diferença de densidade** entre as substâncias.",
    why: { C: "Todos os componentes giram com a mesma velocidade angular no recipiente — não é isso que os separa.", D: "A quantidade de cada substância não determina quem vai para o fundo." },
    misconception: "Atribuir a separação a grandezas do equipamento (raio, velocidade) em vez de à propriedade das substâncias (densidade).",
  }),
  O(2017, 119, "quimica", "Ácidos e bases", undefined, "dificil", 4, {
    statement: "Diversos produtos naturais podem ser obtidos de plantas por processo de extração. O lapachol é da classe das naftoquinonas. Sua estrutura apresenta uma hidroxila enólica ($\\text{p}K_a=6{,}0$) que permite que este composto seja isolado da serragem dos ipês por extração com solução adequada, seguida de filtração simples. Considere que $\\text{p}K_a=-\\log K_a$, em que $K_a$ é a constante ácida da reação de ionização do lapachol. Qual solução deve ser usada para extração do lapachol da serragem do ipê com maior eficiência?",
    options: ["Solução de $\\text{Na}_2\\text{CO}_3$ para formar um sal de lapachol.", "Solução-tampão ácido acético/acetato de sódio (pH = 4,5).", "Solução de NaCl a fim de aumentar a força iônica do meio.", "Solução de $\\text{Na}_2\\text{SO}_4$ para formar um par iônico com lapachol.", "Solução de HCl a fim de extraí-lo por meio de reação ácido-base."], answer: "A",
    resolution: "Com $\\text{p}K_a=6{,}0$, o lapachol é um **ácido fraco**. Para extraí-lo com água, convém **transformá-lo em sal** (forma iônica, solúvel). Isso exige um meio de **pH maior que 6**, que desloque o equilíbrio de ionização no sentido da forma desprotonada. A solução de carbonato de sódio é **básica** (pH > 10) e converte o lapachol em seu sal. Tampão pH 4,5 e HCl mantêm o composto na forma neutra (pouco solúvel em água).",
    why: { B: "Com pH 4,5 (< pKa), predomina a forma neutra do lapachol, que não se dissolve bem.", E: "HCl deixa o meio muito ácido e favorece a forma não ionizada — o oposto do desejado." },
    misconception: "Usar o pKa na direção errada: ácido fraco só vira sal solúvel em pH acima do seu pKa.",
  }),
  O(2017, 120, "quimica", "Propriedades coligativas: osmose", undefined, "media", 3, {
    statement: "Alguns tipos de dessalinizadores usam o processo de osmose reversa para obtenção de água potável a partir da água salgada. Nesse método, utiliza-se um recipiente contendo dois compartimentos separados por uma membrana semipermeável: em um deles coloca-se água salgada e no outro recolhe-se a água potável. A aplicação de pressão mecânica no sistema faz a água fluir de um compartimento para o outro. O movimento das moléculas de água através da membrana é controlado pela pressão osmótica e pela pressão mecânica aplicada. Para que ocorra esse processo é necessário que as resultantes das pressões osmótica e mecânica apresentem",
    options: ["mesmo sentido e mesma intensidade.", "sentidos opostos e mesma intensidade.", "sentidos opostos e maior intensidade da pressão osmótica.", "mesmo sentido e maior intensidade da pressão osmótica.", "sentidos opostos e maior intensidade da pressão mecânica."], answer: "E",
    resolution: "Na osmose natural, a água flui do meio menos concentrado para o mais concentrado (da água potável para a salgada), impulsionada pela pressão osmótica. Na **osmose reversa** queremos o fluxo **inverso**: da água salgada para o compartimento de água potável. Para isso, a pressão mecânica aplicada deve atuar em **sentido oposto** ao da pressão osmótica e ter **maior intensidade**.",
    why: { B: "Com intensidades iguais e sentidos opostos o sistema fica em equilíbrio: não há fluxo.", C: "Com a pressão osmótica maior, o fluxo seguiria o sentido da osmose natural (o oposto do desejado)." },
    misconception: "Esquecer que 'reversa' significa vencer a pressão osmótica: a pressão mecânica precisa superá-la, em sentido contrário.",
  }),
  O(2017, 131, "fisica", "Cinemática", undefined, "dificil", 6, {
    statement: "Um motorista que atende a uma chamada de celular é levado à desatenção, aumentando a possibilidade de acidentes ocorrerem em razão do aumento de seu tempo de reação. Considere dois motoristas, o primeiro atento e o segundo utilizando o celular enquanto dirige. Eles aceleram seus carros inicialmente a 1,00 m/s². Em resposta a uma emergência, freiam com uma desaceleração igual a 5,00 m/s². O motorista atento aciona o freio à velocidade de 14,0 m/s, enquanto o desatento, em situação análoga, leva 1,00 segundo a mais para iniciar a frenagem. Que distância o motorista desatento percorre a mais do que o motorista atento, até a parada total dos carros?",
    options: ["2,90 m", "14,0 m", "14,5 m", "15,0 m", "17,4 m"], answer: "E",
    resolution: "Durante o 1,00 s extra, o desatento **continua acelerando** a 1,00 m/s², partindo de $14{,}0\\ \\text{m/s}$.\n\n- Distância nesse 1 s: $14{,}0\\cdot1+\\tfrac12\\cdot1\\cdot1^2=14{,}5\\ \\text{m}$; velocidade ao frear: $15{,}0\\ \\text{m/s}$.\n- Frenagem do atento: $\\frac{14^2}{2\\cdot5}=19{,}6\\ \\text{m}$. Frenagem do desatento: $\\frac{15^2}{2\\cdot5}=22{,}5\\ \\text{m}$ (diferença: $2{,}9\\ \\text{m}$).\n\nDiferença total: $14{,}5+2{,}9=17{,}4\\ \\text{m}$.",
    why: { C: "14,5 m considera só a distância extra antes de frear e ignora que o desatento chega à frenagem com velocidade maior.", B: "14,0 m desconsidera a aceleração durante o segundo extra." },
    misconception: "Supor velocidade constante durante o tempo de reação, quando o enunciado diz que os carros continuam acelerando.",
  }),
  O(2017, 132, "biologia", "Citologia e membranas: osmose", undefined, "media", 3, {
    statement: "Uma das estratégias para conservação de alimentos é o salgamento, adição de cloreto de sódio (NaCl), historicamente utilizado por tropeiros e vaqueiros sertanejos para conservar carnes de boi, porco e peixe. O que ocorre com as células presentes nos alimentos preservados com essa técnica?",
    options: ["O sal adicionado diminui a concentração de solutos em seu interior.", "O sal adicionado desorganiza e destrói membranas plasmáticas.", "A adição de sal altera as propriedades de membranas plasmáticas.", "Os íons Na⁺ e Cl⁻ provenientes da dissociação do sal entram livremente nelas.", "A grande concentração de sal no meio extracelular provoca a saída de água de dentro delas."], answer: "E",
    resolution: "O sal torna o meio externo **hipertônico** (mais concentrado). Pela **osmose**, a água sai das células em direção ao meio mais concentrado, desidratando-as. Sem água disponível, microrganismos não conseguem se multiplicar — é isso que conserva o alimento.",
    why: { D: "A membrana plasmática é seletivamente permeável: íons não atravessam livremente.", A: "O sal aumenta a concentração externa; não diminui a concentração de solutos interna." },
    misconception: "Imaginar que o sal 'destrói' membranas ou entra nas células, em vez de provocar saída de água por osmose.",
  }),
  O(2017, 133, "fisica", "Indução eletromagnética", "fis-eletricidade", "dificil", 4, {
    statement: "Para demonstrar o processo de transformação de energia mecânica em elétrica, um estudante constrói um pequeno gerador utilizando:\n\n- um fio de cobre de diâmetro $D$ enrolado em espiras circulares de área $A$;\n- dois ímãs que criam no espaço entre eles um campo magnético uniforme de intensidade $B$; e\n- um sistema de engrenagens que lhe permite girar as espiras em torno de um eixo com uma frequência $f$.\n\nAo fazer o gerador funcionar, o estudante obteve uma tensão máxima $V$ e uma corrente de curto-circuito $i$. Para dobrar o valor da tensão máxima $V$ do gerador mantendo constante o valor da corrente de curto-circuito $i$, o estudante deve dobrar o(a)",
    options: ["número de espiras.", "frequência de giro.", "intensidade do campo magnético.", "área das espiras.", "diâmetro do fio."], answer: "A",
    resolution: "A tensão máxima induzida é proporcional a $N\\,B\\,A\\,f$ (número de espiras, campo, área e frequência). Dobrar qualquer um dos quatro dobra $V$. A diferença está na **corrente de curto-circuito** $i=\\frac{V}{R}$, em que $R$ é a resistência do fio:\n\n- Dobrar $B$, $A$ ou $f$ dobra $V$ e **não muda $R$**: a corrente também dobra.\n- Dobrar o número de espiras dobra $V$, mas também **dobra o comprimento do fio** e, portanto, $R$: $i=V/R$ permanece **constante**.\n\nLogo, deve-se dobrar o número de espiras.",
    why: { B: "Dobrar a frequência dobra V, mas R não muda: a corrente de curto também dobra.", E: "O diâmetro altera R (e a corrente), mas não a tensão induzida." },
    misconception: "Esquecer que mais espiras aumentam também a resistência do enrolamento, mantendo a razão V/R.",
  }),
  O(2017, 135, "biologia", "Saúde e biotecnologia", undefined, "facil", 2, {
    statement: "A terapia celular tem sido amplamente divulgada como revolucionária, por permitir a regeneração de tecidos a partir de células novas. Entretanto, a técnica de se introduzirem novas células em um tecido, para o tratamento de enfermidades em indivíduos, já era aplicada rotineiramente em hospitais. A que técnica refere-se o texto?",
    options: ["Vacina.", "Biópsia.", "Hemodiálise.", "Quimioterapia.", "Transfusão de sangue."], answer: "E",
    resolution: "O texto descreve a **introdução de células** em um organismo para tratar uma condição. Uma técnica rotineira que faz exatamente isso é a **transfusão de sangue**, que introduz hemácias (ou outros componentes celulares) no paciente. Vacina introduz antígenos; biópsia retira amostra; hemodiálise filtra o sangue; quimioterapia usa fármacos.",
    why: { A: "A vacina introduz antígenos (não células novas) para estimular a imunidade.", C: "A hemodiálise filtra o sangue, sem introduzir células." },
    misconception: "Associar 'tratamento com células' a técnicas modernas, esquecendo de práticas clássicas como a transfusão.",
  }),
];

const authored: Question[] = [
  // ---------- MATEMÁTICA (autorais) ----------
  A("aut-mat-001", "matematica", "Razão e proporção", "mat-razao-proporcao", "facil", 2, {
    statement: "Uma padaria usa 3 xícaras de farinha para fazer 12 pães iguais. Mantida a mesma receita, quantas xícaras de farinha são necessárias para fazer 20 pães?",
    options: ["4", "5", "6", "7", "8"], answer: "B",
    resolution: "Farinha e número de pães são diretamente proporcionais: $\\frac{3}{12}=\\frac{x}{20}\\Rightarrow x=\\frac{3\\cdot20}{12}=5$ xícaras.",
    why: { D: "7 resulta de somar 8 pães a mais ao número de xícaras, sem manter a proporção.", C: "6 é a farinha para 24 pães." },
    misconception: "Somar a diferença de quantidades em vez de manter a razão constante.",
  }),
  A("aut-mat-002", "matematica", "Escalas", "mat-razao-proporcao", "media", 3, {
    statement: "Na planta de uma casa, desenhada na escala 1 : 50, a sala tem 8 cm de comprimento. Qual é o comprimento real da sala?",
    options: ["0,4 m", "4 m", "40 m", "8 m", "5 m"], answer: "B",
    resolution: "Escala 1:50 significa que 1 cm do desenho equivale a 50 cm reais. $8\\cdot50=400\\ \\text{cm}=4\\ \\text{m}$.",
    why: { A: "0,4 m divide por 50 em vez de multiplicar.", C: "40 m resulta de um erro de conversão de unidades (400 cm = 4 m, não 40 m)." },
    misconception: "Dividir pela escala em vez de multiplicar e esquecer de converter centímetros em metros.",
  }),
  A("aut-mat-003", "matematica", "Razão e proporção", "mat-razao-proporcao", "media", 3, {
    statement: "Oito pedreiros, trabalhando no mesmo ritmo, constroem um muro em 15 dias. Com 10 pedreiros no mesmo ritmo, em quantos dias o muro ficaria pronto?",
    options: ["10", "12", "14", "18,75", "20"], answer: "B",
    resolution: "Mais pedreiros, **menos** dias: as grandezas são inversamente proporcionais e o produto é constante: $8\\cdot15=10\\cdot x\\Rightarrow x=12$ dias.",
    why: { D: "18,75 trata a relação como direta ($15\\cdot10/8$).", E: "20 mantém a razão invertida de outra forma, também sem sentido: mais pedreiros não aumentam o prazo." },
    misconception: "Aplicar regra de três direta a uma relação inversa.",
  }),
  A("aut-mat-004", "matematica", "Razão e proporção", "mat-razao-proporcao", "media", 4, {
    statement: "O carro A faz 12 km por litro de combustível e o carro B faz 15 km por litro. Em uma viagem de 450 km, quantos litros o carro A gasta a mais que o carro B?",
    options: ["5,0", "6,5", "7,5", "9,0", "30,0"], answer: "C",
    resolution: "Carro A: $450/12=37{,}5\\ \\text{L}$. Carro B: $450/15=30\\ \\text{L}$. Diferença: $37{,}5-30=7{,}5\\ \\text{L}$.",
    why: { A: "5,0 seria a diferença de consumo com base em km/L (3), ajustada incorretamente.", E: "30 L é apenas o gasto do carro B." },
    misconception: "Comparar os rendimentos (km/L) diretamente em vez de calcular o consumo total de cada carro.",
  }),
  A("aut-mat-005", "matematica", "Porcentagem", "mat-porcentagem", "media", 3, {
    statement: "Uma loja anuncia um desconto de 20% em um produto de R$ 500,00 e, na finalização da compra, oferece mais 10% de desconto sobre o valor já reduzido. Qual é o preço final?",
    options: ["R$ 350,00", "R$ 360,00", "R$ 370,00", "R$ 400,00", "R$ 450,00"], answer: "B",
    resolution: "Fatores: $0{,}80$ e $0{,}90$. $500\\cdot0{,}80\\cdot0{,}90=R\\$\\,360$. O desconto total é de $28\\%$ (e não de 30%).",
    why: { A: "R$ 350 = 30% de desconto sobre R$ 500: somou os percentuais.", D: "R$ 400 aplica apenas o primeiro desconto." },
    misconception: "Somar descontos sucessivos (20% + 10% = 30%) em vez de multiplicar os fatores.",
  }),
  A("aut-mat-006", "matematica", "Porcentagem", "mat-porcentagem", "media", 3, {
    statement: "Após um reajuste de 12%, o salário de Carla passou a ser R$ 2.800,00. Qual era o salário antes do reajuste?",
    options: ["R$ 2.464,00", "R$ 2.500,00", "R$ 2.512,00", "R$ 2.600,00", "R$ 2.688,00"], answer: "B",
    resolution: "O salário atual é $112\\%$ do anterior: $1{,}12\\,S=2\\,800\\Rightarrow S=\\frac{2\\,800}{1{,}12}=2\\,500$.",
    why: { A: "R$ 2.464 = 2.800 menos 12% de 2.800: aplicou o percentual sobre o valor final.", E: "R$ 2.688 = 2.800 menos 4%: erro de cálculo." },
    misconception: "Descontar 12% do valor final, em vez de dividir por 1,12 (o percentual incide sobre o valor inicial).",
  }),
  A("aut-mat-007", "matematica", "Porcentagem", "mat-porcentagem", "media", 3, {
    statement: "A taxa de desemprego de uma cidade subiu de 8% para 10% da população economicamente ativa. Qual foi o aumento relativo (variação percentual) da taxa?",
    options: ["2%", "20%", "25%", "80%", "125%"], answer: "C",
    resolution: "Em pontos percentuais, o aumento foi de $2$ p.p. O aumento **relativo** compara com o valor inicial: $\\frac{10-8}{8}=0{,}25=25\\%$.",
    why: { A: "2 é a variação em pontos percentuais, não em porcentagem relativa.", B: "20% usa o valor final como base (2/10)." },
    misconception: "Confundir pontos percentuais com variação percentual e usar a base errada.",
  }),
  A("aut-mat-008", "matematica", "Matemática financeira", "mat-porcentagem", "media", 3, {
    statement: "Uma pessoa aplicou R$ 1.000,00 a juros compostos de 10% ao mês. Qual será o montante após 2 meses?",
    options: ["R$ 1.100,00", "R$ 1.200,00", "R$ 1.210,00", "R$ 1.220,00", "R$ 1.331,00"], answer: "C",
    resolution: "$M=1\\,000\\cdot1{,}10^2=1\\,000\\cdot1{,}21=R\\$\\,1\\,210$. No 2º mês os juros incidem sobre R$ 1.100 (e não sobre R$ 1.000).",
    why: { B: "R$ 1.200 corresponde a juros simples (10% de R$ 1.000 por mês).", E: "R$ 1.331 é o montante após 3 meses." },
    misconception: "Calcular juros simples quando o enunciado fala em juros compostos.",
  }),
  A("aut-mat-009", "matematica", "Gráficos e tabelas", "mat-graficos-tabelas", "media", 3, {
    statement: "A tabela mostra o número de atendimentos de um posto de saúde.\n\n- Janeiro: 400 atendimentos;\n- Fevereiro: 500 atendimentos;\n- Março: 560 atendimentos.\n\nEntre os meses consecutivos, em qual intervalo houve o maior crescimento **percentual**?",
    options: ["Janeiro → Fevereiro, 25%", "Janeiro → Fevereiro, 100%", "Fevereiro → Março, 12%", "Fevereiro → Março, 60%", "Os dois intervalos tiveram o mesmo crescimento percentual"], answer: "A",
    resolution: "Janeiro → Fevereiro: $\\frac{500-400}{400}=25\\%$. Fevereiro → Março: $\\frac{560-500}{500}=12\\%$. O maior crescimento percentual foi de janeiro para fevereiro, com **25%**, embora o aumento absoluto (100 contra 60) também seja maior aqui.",
    why: { D: "60 é o aumento absoluto, não o percentual.", B: "100 é o aumento absoluto de janeiro para fevereiro." },
    misconception: "Confundir aumento absoluto (diferença) com variação percentual (diferença dividida pelo valor inicial).",
  }),
  A("aut-mat-010", "matematica", "Gráficos e tabelas", "mat-graficos-tabelas", "media", 3, {
    statement: "Em uma pesquisa com 800 moradores de um bairro, 236 afirmaram usar transporte público diariamente. Representando esses dados em um gráfico de setores, qual deve ser, aproximadamente, o ângulo central do setor correspondente a quem usa transporte público?",
    options: ["29,5°", "59°", "85,0°", "106,2°", "118°"], answer: "D",
    resolution: "Participação: $\\frac{236}{800}=0{,}295$. O círculo completo tem $360^\\circ$: $0{,}295\\cdot360^\\circ=106{,}2^\\circ$.",
    why: { A: "29,5 é o percentual, não o ângulo.", E: "118° é o ângulo para 236/720, base errada." },
    misconception: "Confundir o percentual (29,5%) com o ângulo do setor (percentual × 360°).",
  }),
  A("aut-mat-011", "matematica", "Estatística", "mat-estatistica", "facil", 2, {
    statement: "Em uma disciplina, a prova 1 tem peso 2 e a prova 2 tem peso 3. Uma estudante tirou 5,0 na prova 1 e 8,0 na prova 2. Qual é a sua média ponderada?",
    options: ["5,9", "6,5", "6,8", "7,2", "7,5"], answer: "C",
    resolution: "$\\bar{x}=\\frac{5\\cdot2+8\\cdot3}{2+3}=\\frac{10+24}{5}=6{,}8$.",
    why: { B: "6,5 é a média aritmética simples ((5 + 8) / 2).", A: "5,9 inverte os pesos." },
    misconception: "Usar a média aritmética simples quando os valores têm pesos diferentes.",
  }),
  A("aut-mat-012", "matematica", "Estatística", "mat-estatistica", "media", 3, {
    statement: "Os tempos, em minutos, de 6 trajetos de ônibus foram: 25, 40, 30, 20, 35 e 90. Qual é a mediana desses tempos?",
    options: ["30", "32,5", "40", "40,0 (a média)", "90"], answer: "B",
    resolution: "Ordenando: $20,25,30,35,40,90$. Com 6 valores, a mediana é a média dos dois centrais: $\\frac{30+35}{2}=32{,}5$.",
    why: { C: "40 é o 5º valor, não o central.", D: "A média aritmética é $\\frac{240}{6}=40$, puxada para cima pelo valor 90; a mediana resiste a esse extremo." },
    misconception: "Calcular a mediana sem ordenar ou confundi-la com a média.",
  }),
  A("aut-mat-013", "matematica", "Estatística", "mat-estatistica", "dificil", 4, {
    statement: "Dois atletas, A e B, têm a mesma média de tempo em 5 provas: 12 s. Os tempos de A foram 11, 12, 12, 12, 13 e os de B foram 10, 11, 12, 13, 14. Sobre a regularidade dos atletas, é correto afirmar que",
    options: ["B é mais regular, pois seu menor tempo é menor.", "A é mais regular, pois tem menor variância.", "os dois são igualmente regulares, pois têm a mesma média.", "B é mais regular, pois tem maior amplitude.", "não é possível comparar sem conhecer a mediana."], answer: "B",
    resolution: "Desvios de A: $-1,0,0,0,1$ → variância $=\\frac{1+0+0+0+1}{5}=0{,}4$. Desvios de B: $-2,-1,0,1,2$ → variância $=\\frac{4+1+0+1+4}{5}=2$. Menor variância significa dados mais concentrados em torno da média: **A é mais regular**.",
    why: { C: "Médias iguais não implicam a mesma dispersão.", D: "Maior amplitude indica **maior** dispersão, não maior regularidade." },
    misconception: "Achar que médias iguais significam desempenhos igualmente regulares.",
  }),
  A("aut-mat-014", "matematica", "Geometria plana", "mat-geometria-plana", "facil", 3, {
    statement: "Uma escada de 2,5 m de comprimento está apoiada em uma parede vertical, com o pé a 1,5 m da parede. A que altura da parede a escada alcança?",
    options: ["1,0 m", "2,0 m", "2,9 m", "3,0 m", "4,0 m"], answer: "B",
    resolution: "A escada é a hipotenusa: $2{,}5^2=1{,}5^2+h^2\\Rightarrow h^2=6{,}25-2{,}25=4\\Rightarrow h=2{,}0\\ \\text{m}$.",
    why: { C: "2,9 m resulta de somar os quadrados (2,5² + 1,5²) e extrair a raiz, tratando a escada como cateto.", E: "4,0 m soma 2,5 + 1,5." },
    misconception: "Tratar a escada (hipotenusa) como se fosse um cateto na hora de aplicar Pitágoras.",
  }),
  A("aut-mat-015", "matematica", "Geometria plana", "mat-geometria-plana", "media", 3, {
    statement: "Uma estaca de 1,2 m projeta, no mesmo instante, uma sombra de 0,8 m. Uma árvore projeta uma sombra de 6 m. Qual é a altura da árvore?",
    options: ["4,0 m", "5,0 m", "7,2 m", "9,0 m", "10,8 m"], answer: "D",
    resolution: "Triângulos semelhantes: $\\frac{h}{6}=\\frac{1{,}2}{0{,}8}\\Rightarrow h=6\\cdot1{,}5=9\\ \\text{m}$.",
    why: { A: "4,0 m inverte a razão (6 · 0,8 / 1,2).", C: "7,2 m = 6 · 1,2: ignora a divisão pela sombra da estaca." },
    misconception: "Montar a proporção com as razões invertidas (sombra/altura de um lado e altura/sombra do outro).",
  }),
  A("aut-mat-016", "matematica", "Trigonometria básica", "mat-geometria-plana", "media", 3, {
    statement: "Uma rampa de 6 m de comprimento forma um ângulo de 30° com o chão plano. Qual é a altura que a rampa atinge? (Use sen 30° = 1/2.)",
    options: ["2 m", "3 m", "3√3 m", "6 m", "12 m"], answer: "B",
    resolution: "A altura é o cateto oposto ao ângulo de $30^\\circ$: $\\operatorname{sen}30^\\circ=\\frac{h}{6}\\Rightarrow h=6\\cdot\\frac12=3\\ \\text{m}$.",
    why: { C: "3√3 m seria o cateto adjacente (6 · cos 30°).", D: "6 m é a hipotenusa." },
    misconception: "Confundir seno (oposto/hipotenusa) com cosseno (adjacente/hipotenusa).",
  }),
  A("aut-mat-017", "matematica", "Funções", "mat-funcoes", "facil", 3, {
    statement: "Uma locadora cobra R$ 80,00 fixos mais R$ 0,60 por quilômetro rodado. Com R$ 200,00, quantos quilômetros, no máximo, é possível rodar?",
    options: ["120", "150", "200", "280", "333"], answer: "C",
    resolution: "$C(x)=0{,}6x+80$. Impondo $C=200$: $0{,}6x=120\\Rightarrow x=200$ km.",
    why: { A: "120 é o valor restante (200 − 80) sem dividir pela taxa por km.", D: "280 = 200 + 80: somou o valor fixo em vez de subtrair." },
    misconception: "Ignorar o valor fixo ou somá-lo em vez de subtraí-lo antes de dividir pela taxa.",
  }),
  A("aut-mat-018", "matematica", "Funções quadráticas", "mat-funcoes", "media", 4, {
    statement: "O lucro mensal de uma oficina, em milhares de reais, é dado por $L(x)=-2x^2+24x-40$, em que $x$ é o número de serviços (em centenas). Qual é o lucro máximo possível?",
    options: ["R$ 12 mil", "R$ 24 mil", "R$ 32 mil", "R$ 40 mil", "R$ 144 mil"], answer: "C",
    resolution: "Como $a=-2<0$, há valor máximo no vértice: $x_v=-\\frac{24}{2(-2)}=6$. Então $L(6)=-2\\cdot36+24\\cdot6-40=-72+144-40=32$. Lucro máximo: R$ 32 mil.",
    why: { A: "$L(2)=-8+48-40=0$ e $L(4)=-32+96-40=24$; 12 não é o valor máximo, que ocorre em $x=6$.", E: "144 é o valor de $24x$ em $x=6$, sem subtrair os demais termos." },
    misconception: "Responder com o valor de x do vértice (6) ou com um termo da função, em vez de calcular L(x_v).",
  }),
  A("aut-mat-019", "matematica", "Funções afim", "mat-funcoes", "media", 4, {
    statement: "Dois planos de internet: o plano A custa R$ 30,00 fixos mais R$ 2,00 por GB; o plano B custa R$ 10,00 fixos mais R$ 4,00 por GB. A partir de quantos GB consumidos o plano A passa a ser mais barato que o plano B?",
    options: ["Mais de 5 GB", "Mais de 8 GB", "Mais de 10 GB", "Mais de 15 GB", "Nunca"], answer: "C",
    resolution: "Custos: $A(x)=30+2x$ e $B(x)=10+4x$. Igualando: $30+2x=10+4x\\Rightarrow x=10$. Para $x>10$, B cresce mais depressa e **A passa a ser mais barato**.",
    why: { E: "A tem a menor taxa por GB, então em algum ponto ele vence B.", A: "Com 5 GB, A custa R$ 40 e B custa R$ 30: B ainda é mais barato." },
    misconception: "Olhar apenas o valor fixo ou apenas a taxa, em vez de comparar as duas funções.",
  }),
  A("aut-mat-020", "matematica", "Funções quadráticas", "mat-funcoes", "media", 4, {
    statement: "A altura, em metros, de uma bola lançada para cima é dada por $h(t)=-5t^2+20t$, em que $t$ é o tempo em segundos. Quanto tempo a bola permanece no ar até voltar ao solo e qual é a altura máxima atingida?",
    options: ["2 s e 10 m", "2 s e 20 m", "4 s e 20 m", "4 s e 40 m", "5 s e 20 m"], answer: "C",
    resolution: "Raízes: $-5t(t-4)=0\\Rightarrow t=0$ ou $t=4$: a bola fica **4 s** no ar. O vértice está no meio das raízes, $t_v=2$ s, e $h(2)=-5\\cdot4+40=20\\ \\text{m}$.",
    why: { B: "2 s é o instante da altura máxima, não o tempo total de voo.", D: "40 m é o valor de 20t em t = 2 sem subtrair −5t²." },
    misconception: "Confundir o instante da altura máxima (vértice) com o tempo total de permanência no ar (raiz não nula).",
  }),
  // ---------- FÍSICA (autorais) ----------
  A("aut-fis-001", "fisica", "Eletricidade e consumo", "fis-eletricidade", "media", 4, {
    statement: "Uma lâmpada incandescente de 60 W é substituída por uma de LED de 9 W, ambas acesas 5 horas por dia durante 30 dias. Sabendo que o kWh custa R$ 0,80, qual é a economia mensal aproximada?",
    options: ["R$ 3,06", "R$ 4,08", "R$ 6,12", "R$ 7,65", "R$ 12,24"], answer: "C",
    resolution: "Diferença de potência: $60-9=51\\ \\text{W}=0{,}051\\ \\text{kW}$. Tempo: $5\\cdot30=150\\ \\text{h}$. Energia economizada: $0{,}051\\cdot150=7{,}65\\ \\text{kWh}$. Economia: $7{,}65\\cdot0{,}80=R\\$\\,6{,}12$.",
    why: { D: "7,65 é a economia em kWh, ainda não convertida em reais.", A: "3,06 usa apenas 75 horas." },
    misconception: "Esquecer de converter W em kW ou de multiplicar a energia pela tarifa.",
  }),
  A("aut-fis-002", "fisica", "Circuitos elétricos", "fis-eletricidade", "media", 4, {
    statement: "Dois resistores de 12 Ω são ligados **em paralelo** a uma fonte de 24 V. Qual é a corrente total fornecida pela fonte?",
    options: ["1 A", "2 A", "4 A", "6 A", "8 A"], answer: "C",
    resolution: "Em paralelo: $R_{eq}=\\frac{12\\cdot12}{12+12}=6\\ \\Omega$. Pela lei de Ohm: $i=\\frac{U}{R_{eq}}=\\frac{24}{6}=4\\ \\text{A}$ (2 A em cada resistor).",
    why: { B: "2 A é a corrente em **um** dos resistores.", A: "1 A corresponde a ligá-los em série (R = 24 Ω)." },
    misconception: "Somar as resistências em paralelo (como se fosse série) ou esquecer que a corrente total é a soma das correntes dos ramos.",
  }),
  A("aut-fis-003", "fisica", "Potência elétrica", "fis-eletricidade", "facil", 3, {
    statement: "Um ferro de passar de 1 100 W é ligado em uma tomada de 110 V. Qual é a corrente elétrica que percorre o aparelho?",
    options: ["1 A", "10 A", "11 A", "100 A", "121 000 A"], answer: "B",
    resolution: "$P=U\\,i\\Rightarrow i=\\frac{P}{U}=\\frac{1\\,100}{110}=10\\ \\text{A}$.",
    why: { D: "100 A resulta de dividir 11 000 por 110 por engano de zeros.", C: "11 A mistura 1 100 com 100." },
    misconception: "Usar a fórmula da potência com as grandezas trocadas (multiplicar em vez de dividir).",
  }),
  A("aut-fis-004", "fisica", "Energia elétrica", "fis-eletricidade", "media", 4, {
    statement: "Um chuveiro de 4 400 W é usado durante 15 minutos por dia, ao longo de 30 dias. Qual é o consumo mensal de energia, em kWh?",
    options: ["1,1", "6,6", "33", "66", "132"], answer: "C",
    resolution: "Tempo total: $15\\cdot30=450\\ \\text{min}=7{,}5\\ \\text{h}$. Potência: $4{,}4\\ \\text{kW}$. Energia: $4{,}4\\cdot7{,}5=33\\ \\text{kWh}$.",
    why: { D: "66 resulta de usar 15 h em vez de 7,5 h.", A: "1,1 usa 15 minutos como se fosse 0,25 h, sem multiplicar pelos 30 dias." },
    misconception: "Converter mal minutos em horas ou esquecer de multiplicar pelo número de dias.",
  }),
  A("aut-fis-005", "fisica", "Conservação de energia", "fis-energia", "media", 3, {
    statement: "Um skatista parte do repouso do topo de uma rampa sem atrito, a 1,8 m de altura em relação ao solo. Considerando $g=10\\ \\text{m/s}^2$, qual é sua velocidade ao chegar à base?",
    options: ["3 m/s", "6 m/s", "9 m/s", "18 m/s", "36 m/s"], answer: "B",
    resolution: "$mgh=\\tfrac12mv^2\\Rightarrow v=\\sqrt{2gh}=\\sqrt{2\\cdot10\\cdot1{,}8}=\\sqrt{36}=6\\ \\text{m/s}$. A massa se cancela.",
    why: { D: "18 é $g\\cdot h$ (10 · 1,8): faltou o fator 2 e a raiz quadrada.", E: "36 é v², não v." },
    misconception: "Esquecer a raiz quadrada ao isolar v ou achar que a massa do skatista influencia o resultado.",
  }),
  A("aut-fis-006", "fisica", "Trabalho e potência", "fis-energia", "media", 4, {
    statement: "Um guindaste eleva uma carga de 500 kg a 10 m de altura em 20 s, com velocidade constante. Considerando $g=10\\ \\text{m/s}^2$, a potência útil desenvolvida é de",
    options: ["250 W", "1 000 W", "2 500 W", "5 000 W", "50 000 W"], answer: "C",
    resolution: "Trabalho útil: $\\tau=mgh=500\\cdot10\\cdot10=50\\,000\\ \\text{J}$. Potência: $P=\\frac{\\tau}{\\Delta t}=\\frac{50\\,000}{20}=2\\,500\\ \\text{W}$.",
    why: { E: "50 000 é o trabalho em joules; faltou dividir pelo tempo.", B: "1 000 W resulta de usar 50 s em vez de 20 s." },
    misconception: "Confundir trabalho (J) com potência (W): a potência é o trabalho por unidade de tempo.",
  }),
  A("aut-fis-007", "fisica", "Rendimento", "fis-energia", "facil", 2, {
    statement: "Uma usina hidrelétrica recebe da água uma potência de 200 MW e entrega à rede 160 MW. Qual é o seu rendimento?",
    options: ["20%", "40%", "60%", "80%", "125%"], answer: "D",
    resolution: "$\\eta=\\frac{P_{útil}}{P_{total}}=\\frac{160}{200}=0{,}80=80\\%$. Os 40 MW restantes são dissipados (calor, atrito).",
    why: { A: "20% é a fração de energia perdida, não o rendimento.", E: "Rendimento maior que 100% é impossível (violaria a conservação de energia)." },
    misconception: "Inverter a razão (total/útil) ou confundir rendimento com perdas.",
  }),
  A("aut-fis-008", "fisica", "Trabalho e energia cinética", "fis-energia", "media", 4, {
    statement: "Um bloco de 2 kg, inicialmente em repouso sobre uma superfície sem atrito, é puxado por uma força horizontal constante de 16 N ao longo de 4 m. Qual é sua velocidade final?",
    options: ["4 m/s", "6 m/s", "8 m/s", "16 m/s", "64 m/s"], answer: "C",
    resolution: "Trabalho: $\\tau=F\\,d=16\\cdot4=64\\ \\text{J}$. Pelo teorema trabalho-energia: $\\tau=\\tfrac12mv^2\\Rightarrow64=\\tfrac12\\cdot2\\cdot v^2\\Rightarrow v^2=64\\Rightarrow v=8\\ \\text{m/s}$.",
    why: { E: "64 é v² (e também o trabalho em joules).", A: "4 m/s resulta de dividir o trabalho (64 J) por 16 N; a aceleração do bloco é $a=F/m=8\\ \\text{m/s}^2$, que não é a velocidade." },
    misconception: "Igualar o trabalho diretamente à velocidade, sem passar pela energia cinética.",
  }),
  // ---------- QUÍMICA (autorais) ----------
  A("aut-qui-001", "quimica", "Estequiometria", "qui-estequiometria", "media", 4, {
    statement: "Na reação $2\\,\\text{H}_2+\\text{O}_2\\to2\\,\\text{H}_2\\text{O}$, que massa de água é formada na queima completa de 4 g de $\\text{H}_2$? (Massas molares: H₂ = 2 g/mol; H₂O = 18 g/mol.)",
    options: ["18 g", "20 g", "36 g", "72 g", "4 g"], answer: "C",
    resolution: "$n(\\text{H}_2)=\\frac{4}{2}=2\\ \\text{mol}$. Pela equação, 2 mol de $\\text{H}_2$ formam 2 mol de $\\text{H}_2\\text{O}$: $m=2\\cdot18=36\\ \\text{g}$.",
    why: { A: "18 g é a massa de 1 mol de água.", D: "72 g usa o dobro dos mols de água." },
    misconception: "Comparar massas diretamente em vez de converter para mols e usar a proporção dos coeficientes.",
  }),
  A("aut-qui-002", "quimica", "Estequiometria", "qui-estequiometria", "media", 4, {
    statement: "A decomposição térmica do carbonato de cálcio ocorre segundo $\\text{CaCO}_3\\to\\text{CaO}+\\text{CO}_2$. A partir de 200 g de $\\text{CaCO}_3$ (M = 100 g/mol), qual massa de $\\text{CO}_2$ (M = 44 g/mol) é liberada, supondo reação completa?",
    options: ["44 g", "56 g", "88 g", "100 g", "176 g"], answer: "C",
    resolution: "$n(\\text{CaCO}_3)=\\frac{200}{100}=2\\ \\text{mol}$. A proporção é $1:1$, então $n(\\text{CO}_2)=2\\ \\text{mol}$ e $m=2\\cdot44=88\\ \\text{g}$.",
    why: { A: "44 g é a massa para 1 mol de CO₂.", B: "56 g é a massa molar do CaO." },
    misconception: "Ignorar que a quantidade de reagente (2 mol) multiplica a massa molar do produto.",
  }),
  A("aut-qui-003", "quimica", "Reagente limitante", "qui-estequiometria", "dificil", 5, {
    statement: "Na síntese da amônia, $\\text{N}_2+3\\,\\text{H}_2\\to2\\,\\text{NH}_3$, misturam-se 5 mol de $\\text{N}_2$ e 9 mol de $\\text{H}_2$. Qual a quantidade máxima de $\\text{NH}_3$ que pode ser formada?",
    options: ["3 mol", "6 mol", "9 mol", "10 mol", "18 mol"], answer: "B",
    resolution: "Para consumir 9 mol de $\\text{H}_2$ são necessários $9/3=3$ mol de $\\text{N}_2$; há 5 mol, então o $\\text{N}_2$ está em excesso e o **$\\text{H}_2$ é o limitante**. Produto: $9\\cdot\\frac23=6\\ \\text{mol}$ de $\\text{NH}_3$.",
    why: { D: "10 mol resulta de usar o N₂ como limitante (5 · 2), ignorando que o H₂ acaba antes.", C: "9 mol iguala os mols de H₂ aos de NH₃ (proporção 1:1 inexistente)." },
    misconception: "Calcular o produto a partir do reagente em menor quantidade em mols, sem considerar os coeficientes (identificar o limitante exige comparar com a proporção da equação).",
  }),
  A("aut-qui-004", "quimica", "Rendimento", "qui-estequiometria", "facil", 2, {
    statement: "Em um processo industrial, a massa teórica de produto esperada era de 50 g. Foram obtidos, na prática, 40 g. Qual foi o rendimento da reação?",
    options: ["10%", "20%", "40%", "80%", "125%"], answer: "D",
    resolution: "$\\eta=\\frac{m_{real}}{m_{teórica}}\\cdot100\\%=\\frac{40}{50}\\cdot100\\%=80\\%$.",
    why: { B: "20% é a fração que deixou de ser obtida.", E: "125% inverte a razão (teórica/real)." },
    misconception: "Inverter a razão real/teórica.",
  }),
  A("aut-qui-005", "quimica", "Constante de Avogadro", "qui-estequiometria", "media", 3, {
    statement: "Sabendo que a massa molar da água é 18 g/mol e que 1 mol contém $6{,}0\\times10^{23}$ moléculas, quantas moléculas existem em 9 g de água?",
    options: ["$1{,}5\\times10^{23}$", "$3{,}0\\times10^{23}$", "$6{,}0\\times10^{23}$", "$1{,}2\\times10^{24}$", "$5{,}4\\times10^{24}$"], answer: "B",
    resolution: "$n=\\frac{9}{18}=0{,}5\\ \\text{mol}$. Número de moléculas: $0{,}5\\cdot6{,}0\\times10^{23}=3{,}0\\times10^{23}$.",
    why: { C: "$6{,}0\\times10^{23}$ corresponde a 18 g (1 mol).", E: "$5{,}4\\times10^{24}$ multiplica a massa pela constante de Avogadro, sem dividir pela massa molar." },
    misconception: "Multiplicar a massa em gramas pela constante de Avogadro sem passar por mols.",
  }),
  A("aut-qui-006", "quimica", "Estequiometria da combustão", "qui-estequiometria", "dificil", 5, {
    statement: "A combustão completa do etanol é representada por $\\text{C}_2\\text{H}_5\\text{OH}+3\\,\\text{O}_2\\to2\\,\\text{CO}_2+3\\,\\text{H}_2\\text{O}$. Quantos gramas de $\\text{CO}_2$ (M = 44 g/mol) são liberados na queima de 23 g de etanol (M = 46 g/mol)?",
    options: ["22 g", "44 g", "66 g", "88 g", "176 g"], answer: "B",
    resolution: "$n(\\text{etanol})=\\frac{23}{46}=0{,}5\\ \\text{mol}$. A proporção etanol : $\\text{CO}_2$ é $1:2$, logo $n(\\text{CO}_2)=1\\ \\text{mol}$ e $m=44\\ \\text{g}$.",
    why: { A: "22 g usa a proporção 1:1 em vez de 1:2.", D: "88 g corresponde a 2 mol de CO₂, isto é, ao dobro da quantidade correta." },
    misconception: "Esquecer o coeficiente 2 do CO₂ (ou aplicá-lo duas vezes).",
  }),
  // ---------- BIOLOGIA (autorais) ----------
  A("aut-bio-001", "biologia", "Fluxo de energia", "bio-ecologia", "media", 3, {
    statement: "Em uma cadeia alimentar, os produtores fixam 20 000 kJ de energia. Admitindo que apenas 10% da energia é transferida de um nível trófico ao seguinte, quanta energia chega aos consumidores terciários (4º nível trófico)?",
    options: ["2 000 kJ", "200 kJ", "20 kJ", "2 kJ", "0,2 kJ"], answer: "C",
    resolution: "Produtores (1º nível): $20\\,000$; consumidor primário: $2\\,000$; secundário: $200$; **terciário: $20\\ \\text{kJ}$**. São três transferências de 10%.",
    why: { B: "200 kJ é a energia que chega aos consumidores secundários (3º nível).", D: "2 kJ aplicaria quatro transferências (5º nível)." },
    misconception: "Contar o número errado de transferências: do 1º ao 4º nível ocorrem três passagens.",
  }),
  A("aut-bio-002", "biologia", "Relações ecológicas", "bio-ecologia", "facil", 2, {
    statement: "Os líquens são formados pela associação entre fungos e algas. O fungo oferece proteção e retém umidade; a alga realiza fotossíntese e fornece alimento. Nenhum dos dois consegue formar o líquen separadamente. Essa relação ecológica é denominada",
    options: ["parasitismo.", "comensalismo.", "predação.", "mutualismo.", "competição."], answer: "D",
    resolution: "Os dois organismos são **beneficiados** e a associação é **obrigatória**: é o **mutualismo** (+/+). No parasitismo e na predação, um é prejudicado; no comensalismo, um se beneficia e o outro não é afetado; na competição ambos são prejudicados.",
    why: { B: "Comensalismo: um é beneficiado e o outro não é afetado — aqui ambos ganham.", E: "Na competição, ambos disputam o mesmo recurso e perdem." },
    misconception: "Confundir mutualismo (obrigatório) com protocooperação (benéfico, mas facultativo) ou com comensalismo.",
  }),
  A("aut-bio-003", "biologia", "Cadeias e teias alimentares", "bio-ecologia", "media", 3, {
    statement: "Em uma teia alimentar de um campo, coruja e cobra predam ratos, e ratos e gafanhotos se alimentam de grama. Caçadores reduzem drasticamente a população de corujas e cobras. É esperado que, em curto prazo,",
    options: ["a população de ratos diminua e a de grama aumente.", "a população de ratos aumente e a de grama diminua.", "as populações de gafanhotos e ratos fiquem estáveis.", "a população de grama aumente, pois há menos consumidores.", "a população de ratos permaneça igual, pois dependem apenas da grama."], answer: "B",
    resolution: "Sem os predadores, os **ratos** deixam de ser controlados e sua população tende a **aumentar**. Com mais ratos consumindo grama, a **vegetação diminui**. É um efeito em cascata na teia.",
    why: { D: "Com mais ratos (consumidores), a grama sofre maior consumo, não menor.", C: "Retirar predadores desequilibra a teia; a estabilidade não é esperada." },
    misconception: "Analisar apenas um elo (os predadores) sem acompanhar os efeitos sobre os níveis seguintes.",
  }),
  A("aut-bio-004", "biologia", "Bioacumulação", "bio-ecologia", "media", 3, {
    statement: "Um pesticida persistente é lançado em um lago e é absorvido pelo fitoplâncton. Em seguida, o fitoplâncton é consumido por pequenos peixes, que são comidos por peixes maiores, que servem de alimento para uma ave pescadora. Em qual organismo é esperada a **maior concentração** do pesticida?",
    options: ["Fitoplâncton.", "Pequenos peixes.", "Peixes maiores.", "Ave pescadora.", "Todos terão a mesma concentração."], answer: "D",
    resolution: "Substâncias persistentes e não degradáveis se acumulam nos tecidos e **aumentam de concentração a cada nível trófico** (magnificação). A ave, no topo da cadeia, ingere presas já contaminadas e concentra o pesticida.",
    why: { A: "O fitoplâncton é a base da cadeia e tem a menor concentração entre os organismos citados.", E: "A concentração aumenta ao longo da cadeia; não se distribui de forma uniforme." },
    misconception: "Achar que o poluente se dilui ao longo da cadeia, quando ele se concentra nos níveis mais altos.",
  }),
  A("aut-bio-005", "biologia", "Ecologia: relações desarmônicas", "bio-ecologia", "facil", 2, {
    statement: "Duas espécies de aves de um mesmo bosque se alimentam das mesmas sementes e, em épocas de escassez, ambas apresentam queda no número de indivíduos. Essa relação é um exemplo de",
    options: ["mutualismo.", "protocooperação.", "competição interespecífica.", "parasitismo.", "comensalismo."], answer: "C",
    resolution: "Duas **espécies diferentes** disputam o **mesmo recurso limitado**, e ambas são prejudicadas: **competição interespecífica** (−/−).",
    why: { D: "No parasitismo um organismo se beneficia à custa do outro, em uma relação direta.", A: "Mutualismo é benéfico para ambos." },
    misconception: "Confundir competição (disputa por recurso) com predação ou parasitismo (um organismo explora outro).",
  }),
  A("aut-bio-006", "biologia", "Genética: 1ª lei de Mendel", "bio-genetica", "facil", 2, {
    statement: "Em certa planta, o alelo A (flores roxas) é dominante sobre o alelo a (flores brancas). Do cruzamento entre duas plantas heterozigotas (Aa × Aa), qual é a probabilidade de nascer uma planta de flores brancas?",
    options: ["0", "1/4", "1/2", "3/4", "1"], answer: "B",
    resolution: "Aa × Aa → AA, Aa, Aa, aa. Flores brancas exigem o genótipo **aa**, probabilidade $\\frac14$. (Roxas: $\\frac34$.)",
    why: { D: "3/4 é a probabilidade de flores roxas (dominante).", C: "1/2 é a probabilidade de heterozigotos." },
    misconception: "Confundir a probabilidade do fenótipo recessivo (1/4) com a do dominante (3/4).",
  }),
  A("aut-bio-007", "biologia", "Heredogramas", "bio-genetica", "dificil", 4, {
    statement: "Um casal sem manifestação de uma doença genética tem um filho afetado. Sabe-se que a doença é determinada por um alelo recessivo (a) de um gene autossômico. Qual é a probabilidade de uma filha desse casal, **que não apresenta a doença**, ser heterozigota?",
    options: ["1/4", "1/3", "1/2", "2/3", "3/4"], answer: "D",
    resolution: "Como os pais são normais e têm filho afetado (aa), ambos são **Aa**. A prole esperada é $\\frac14$ AA, $\\frac12$ Aa e $\\frac14$ aa. Entre os **normais** (AA ou Aa) restam $\\frac34$ do total: a chance de ser Aa é $\\frac{1/2}{3/4}=\\frac23$.",
    why: { C: "1/2 é a probabilidade de Aa no total da prole, sem restringir aos normais.", E: "3/4 é a probabilidade de a criança ser normal." },
    misconception: "Esquecer de reduzir o espaço amostral: a informação 'não apresenta a doença' exclui o genótipo aa.",
  }),
  A("aut-bio-008", "biologia", "Genética: sistema ABO", "bio-genetica", "media", 3, {
    statement: "Um homem de grupo sanguíneo AB e uma mulher de grupo O (ii) têm um filho. Qual é a probabilidade de a criança ser do grupo AB?",
    options: ["0", "1/4", "1/2", "3/4", "1"], answer: "A",
    resolution: "O pai AB produz gametas $I^A$ ou $I^B$; a mãe ii produz apenas $i$. Filhos possíveis: $I^Ai$ (grupo A) ou $I^Bi$ (grupo B), cada um com 1/2. **Não há filho AB**: probabilidade 0.",
    why: { C: "1/2 é a probabilidade de grupo A (ou de grupo B), não de AB.", B: "1/4 não corresponde a nenhum resultado possível neste cruzamento." },
    misconception: "Achar que os grupos dos pais 'somam' no filho: a mãe ii só transmite o alelo i.",
  }),
  A("aut-bio-009", "biologia", "Herança ligada ao sexo", "bio-genetica", "dificil", 5, {
    statement: "O daltonismo é determinado por um alelo recessivo ligado ao cromossomo X ($X^d$). Uma mulher portadora ($X^DX^d$) tem filhos com um homem de visão normal ($X^DY$). Qual é a probabilidade de o próximo filho ser **um menino daltônico**?",
    options: ["0", "1/8", "1/4", "1/2", "3/4"], answer: "C",
    resolution: "Gametas da mãe: $X^D$ ou $X^d$ (1/2 cada). Do pai: $X^D$ ou $Y$ (1/2 cada). Os quatro resultados são $X^DX^D$, $X^DY$, $X^DX^d$ e $X^dY$, cada um com $\\frac14$. O menino daltônico é $X^dY$: probabilidade $\\frac14$. (Entre os meninos, a chance seria 1/2.)",
    why: { D: "1/2 é a chance de daltonismo entre os meninos, mas a pergunta considera todos os filhos.", A: "Meninos podem ser daltônicos mesmo com pai normal, se a mãe for portadora." },
    misconception: "Confundir a probabilidade condicional (entre os meninos) com a probabilidade entre todos os filhos.",
  }),
];

export const operacaoQuestions: Question[] = [...official, ...authored, ...questionsMat2, ...questionsMat3, ...questionsNat2, ...questionsS1, ...questionsS2, ...questionsS3, ...questionsS4];
