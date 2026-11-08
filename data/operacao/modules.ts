import type { StudyModule } from "../../lib/operacao/types";

/**
 * Módulos de revisão — Operação 2º Domingo.
 * Autoria própria, alinhada à Matriz de Referência do Enem (Matemática e suas Tecnologias; Ciências da Natureza e suas Tecnologias).
 * Revisão pedagógica: conferência de contas, unidades e consistência interna em 08/11/2026.
 * Ainda NÃO houve revisão externa por professor da disciplina.
 */
const matriz = { label: "Inep — Matrizes de Referência do Enem", url: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem" };
const reviewedAt = "2026-11-08";

export const operacaoModules: StudyModule[] = [
  {
    id: "mat-razao-proporcao",
    discipline: "matematica",
    order: 1,
    title: "Razão, proporção, regra de três e escalas",
    objective: "Montar e resolver relações de proporcionalidade direta e inversa, interpretar escalas e converter situações do cotidiano em equações simples.",
    minutes: 25,
    prerequisites: ["Frações e simplificação", "Operações com decimais"],
    planDay: 1,
    concept: `**Razão** compara duas grandezas por divisão: a razão entre $a$ e $b$ é $\\frac{a}{b}$ (com $b \\neq 0$). Ela pode ter unidade (km/h, g/cm³) ou ser um número puro (comparação entre mesmas unidades).

**Proporção** é a igualdade entre duas razões: $\\frac{a}{b}=\\frac{c}{d}$. A propriedade fundamental é o produto cruzado: $a\\cdot d = b\\cdot c$.

**Grandezas diretamente proporcionais** variam juntas na mesma razão: dobrando uma, a outra dobra. **Inversamente proporcionais** têm produto constante: dobrando uma, a outra cai pela metade. A **regra de três** é só a aplicação da proporção: monte uma tabela com as mesmas grandezas nas mesmas colunas e decida, para cada par, se a relação é direta ou inversa.

**Escala** é a razão entre a medida no desenho e a medida real, na mesma unidade. Uma escala $1:50\\,000$ significa que $1\\ \\text{cm}$ no mapa corresponde a $50\\,000\\ \\text{cm}=500\\ \\text{m}$ no terreno.`,
    situations: "O Enem costuma disfarçar a proporção em receitas, consumo de combustível, plantas e mapas, produtividade de equipes e concentração de misturas. O primeiro passo é identificar **quais grandezas** estão em jogo e **se aumentar uma faz a outra aumentar ou diminuir**.",
    formulas: [
      { tex: "\\frac{a}{b}=\\frac{c}{d}\\iff a\\,d=b\\,c", meaning: "Propriedade fundamental das proporções.", conditions: "$b\\neq 0$ e $d\\neq 0$." },
      { tex: "x\\cdot y = k", meaning: "Grandezas inversamente proporcionais: o produto permanece constante.", conditions: "Vale quando a relação é inversa (ex.: nº de trabalhadores × dias, com ritmo igual)." },
      { tex: "E=\\frac{\\text{medida no desenho}}{\\text{medida real}}", meaning: "Escala.", conditions: "As duas medidas precisam estar na mesma unidade antes da divisão." },
    ],
    examples: [
      {
        title: "Regra de três direta",
        problem: "Um carro percorre $210\\ \\text{km}$ consumindo $15\\ \\text{L}$ de combustível. Mantido o mesmo consumo, quantos litros são necessários para $350\\ \\text{km}$?",
        solution: "Distância e combustível são diretamente proporcionais.\n\n$$\\frac{210}{15}=\\frac{350}{x}$$\n\nProduto cruzado: $210x = 15\\cdot 350 = 5\\,250$, logo $x = 25\\ \\text{L}$.",
      },
      {
        title: "Regra de três inversa",
        problem: "Seis operários concluem uma obra em $12$ dias. Com $9$ operários, no mesmo ritmo, em quantos dias a obra termina?",
        solution: "Mais operários, **menos** dias: a relação é inversa e o produto é constante.\n\n$6\\cdot 12 = 9\\cdot x \\Rightarrow x = \\frac{72}{9} = 8$ dias.",
      },
      {
        title: "Escala",
        problem: "Em um mapa de escala $1:250\\,000$, dois municípios estão a $6\\ \\text{cm}$ um do outro. Qual a distância real em km?",
        solution: "$6\\ \\text{cm}\\times 250\\,000 = 1\\,500\\,000\\ \\text{cm}$. Como $100\\,000\\ \\text{cm}=1\\ \\text{km}$, a distância é $15\\ \\text{km}$.",
      },
    ],
    commonErrors: [
      "Tratar uma relação inversa como direta (conferir: se uma grandeza aumenta, a outra aumenta ou diminui?).",
      "Esquecer de converter unidades antes de aplicar a escala (cm no mapa, km na resposta).",
      "Colocar valores de grandezas diferentes na mesma coluna da tabela da regra de três.",
      "Ao comparar duas razões, ignorar a unidade e concluir que são iguais.",
    ],
    summary: [
      "Razão é divisão entre grandezas; proporção é igualdade de razões.",
      "Direta: razão constante. Inversa: produto constante.",
      "Escala exige a mesma unidade no desenho e na realidade.",
      "Antes de calcular, diga em palavras: 'se uma aumenta, a outra...'.",
    ],
    recall: [
      { q: "Em qual caso o produto das duas grandezas permanece constante?", a: "Quando são inversamente proporcionais." },
      { q: "Uma escala 1:200 significa que 1 cm no desenho corresponde a quantos centímetros reais?", a: "200 cm, ou seja, 2 m." },
      { q: "Quatro máquinas iguais produzem 120 peças em 3 horas. Quantas horas 6 dessas máquinas levam para 120 peças?", a: "2 horas (mais máquinas, menos tempo: 4 · 3 = 6 · x ⇒ x = 2)." },
    ],
    related: ["Razão e proporção", "Escalas"],
    sources: [matriz, { label: "Autoria GoDev Education (texto e exemplos originais)" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "mat-porcentagem",
    discipline: "matematica",
    order: 2,
    title: "Porcentagem e variações percentuais",
    objective: "Calcular percentuais de um valor, aplicar aumentos e descontos sucessivos e comparar variações sem confundir pontos percentuais com porcentagem.",
    minutes: 25,
    prerequisites: ["Frações", "Decimais"],
    planDay: 1,
    concept: `**Porcentagem** é uma razão com denominador $100$: $p\\% = \\frac{p}{100}$. Calcular $p\\%$ de um valor $V$ é multiplicar: $V\\cdot\\frac{p}{100}$.

**Fator de variação.** Um aumento de $p\\%$ multiplica o valor por $1+\\frac{p}{100}$; um desconto de $p\\%$ multiplica por $1-\\frac{p}{100}$. Variações **sucessivas** multiplicam os fatores — elas **não** se somam.

**Variação percentual** entre um valor inicial $V_i$ e um final $V_f$: $\\frac{V_f - V_i}{V_i}\\cdot 100\\%$. A base de comparação é sempre o valor **inicial**.

**Pontos percentuais** medem a diferença entre duas porcentagens. Se uma taxa vai de $10\\%$ para $12\\%$, ela subiu $2$ pontos percentuais, mas houve aumento relativo de $20\\%$.`,
    situations: "Aparece em reajustes, descontos em lojas, rendimento de aplicações, composição de misturas, resultados de pesquisas e gráficos de participação. Identifique sempre **sobre qual valor** o percentual incide.",
    formulas: [
      { tex: "V_f = V_i\\left(1\\pm\\frac{p}{100}\\right)", meaning: "Valor final após aumento (+) ou desconto (−) de p%.", conditions: "Um único reajuste sobre o valor inicial." },
      { tex: "V_f = V_i\\cdot f_1\\cdot f_2\\cdots f_n", meaning: "Variações sucessivas: multiplicação dos fatores.", conditions: "Cada fator é $1\\pm p/100$ aplicado ao valor da etapa anterior." },
      { tex: "\\Delta\\% = \\frac{V_f-V_i}{V_i}\\cdot 100", meaning: "Variação percentual.", conditions: "$V_i\\neq 0$." },
    ],
    examples: [
      {
        title: "Aumento seguido de desconto",
        problem: "Um produto de $R\\$\\,200$ sofre aumento de $20\\%$ e, depois, desconto de $20\\%$. Qual o preço final?",
        solution: "Fatores: $1{,}20$ e $0{,}80$. $200\\cdot 1{,}20\\cdot 0{,}80 = 192$. O preço final é $R\\$\\,192$ — **menor** que o inicial, porque o desconto incide sobre um valor maior.",
      },
      {
        title: "Qual era o valor antes do desconto?",
        problem: "Após um desconto de $15\\%$, uma TV custa $R\\$\\,1\\,700$. Qual era o preço original?",
        solution: "O preço atual é $85\\%$ do original: $0{,}85\\,V = 1\\,700 \\Rightarrow V = 2\\,000$. O preço original era $R\\$\\,2\\,000$.",
      },
    ],
    commonErrors: [
      "Somar percentuais sucessivos (+20% e −20% não dão zero).",
      "Aplicar o percentual sobre o valor errado (final em vez de inicial).",
      "Confundir 'aumentou 2 pontos percentuais' com 'aumentou 2%'.",
      "Ler 'desconto de 15%' e calcular 'preço = 15% do original'.",
    ],
    summary: [
      "p% = p/100; aumento multiplica por 1 + p/100; desconto, por 1 − p/100.",
      "Sucessivos: multiplique os fatores.",
      "A base da variação percentual é o valor inicial.",
      "Pontos percentuais ≠ porcentagem relativa.",
    ],
    recall: [
      { q: "Qual o fator multiplicador de um aumento de 8%?", a: "1,08." },
      { q: "Preço R$ 80 com desconto de 25%. Qual o preço final?", a: "R$ 60 (80 · 0,75)." },
      { q: "Uma taxa passou de 5% para 6%. Qual foi a variação em pontos percentuais e em termos relativos?", a: "1 ponto percentual; aumento relativo de 20% (1/5)." },
    ],
    related: ["Porcentagem"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "mat-graficos-tabelas",
    discipline: "matematica",
    order: 5,
    title: "Leitura de gráficos e tabelas",
    objective: "Extrair informações de gráficos e tabelas, comparar valores, calcular variações e evitar conclusões que os dados não sustentam.",
    minutes: 20,
    prerequisites: ["Porcentagem", "Razão"],
    planDay: 2,
    concept: `Todo gráfico tem uma **pergunta escondida**: o que está sendo medido, em que unidade, em que período e com qual escala. Antes de calcular, leia **título, eixos, legenda, unidade e fonte**.

**Tipos usuais.** *Barras/colunas* comparam categorias; *linhas* mostram evolução no tempo; *setores (pizza)* mostram partes de um todo — a soma é $100\\%$; *dispersão* relaciona duas variáveis; *tabelas de dupla entrada* cruzam duas classificações.

**Cuidados.** (1) Eixo que **não começa no zero** exagera diferenças visuais. (2) **Valor absoluto × percentual:** uma categoria pode ter o maior percentual e o menor número de pessoas. (3) **Correlação não implica causa.** (4) Compare sempre na **mesma base** (mesma unidade e mesmo período).

**Taxa de variação média** entre dois pontos de um gráfico de linhas: $\\frac{\\Delta y}{\\Delta x}$ — a "inclinação" do trecho.`,
    situations: "O Enem usa dados reais de consumo, população, produção e meio ambiente. A resposta costuma exigir uma comparação (maior crescimento, maior razão) ou um cálculo simples sobre valores lidos com atenção.",
    formulas: [
      { tex: "\\text{taxa média}=\\frac{y_2-y_1}{x_2-x_1}", meaning: "Variação média entre dois pontos.", conditions: "Leia as unidades dos dois eixos (ex.: mil toneladas por ano)." },
      { tex: "\\text{parte}=\\frac{\\text{valor da categoria}}{\\text{total}}\\cdot 100\\%", meaning: "Participação percentual de uma categoria.", conditions: "O total deve ser a soma de todas as categorias." },
    ],
    examples: [
      {
        title: "Comparando crescimentos",
        problem: "A produção de uma cooperativa foi $40$ mil kg em 2021 e $52$ mil kg em 2023. Qual foi o crescimento percentual no período?",
        solution: "$\\frac{52-40}{40}\\cdot 100\\% = \\frac{12}{40}\\cdot 100\\% = 30\\%$. A base é o valor de 2021.",
      },
      {
        title: "Participação em tabela",
        problem: "Em uma pesquisa com $800$ pessoas, $236$ usam transporte público. Qual a participação percentual?",
        solution: "$\\frac{236}{800}=0{,}295=29{,}5\\%$.",
      },
    ],
    commonErrors: [
      "Ler o valor no eixo errado ou ignorar o multiplicador do eixo (ex.: 'em milhares').",
      "Comparar percentuais de totais diferentes como se fossem quantidades.",
      "Concluir tendência a partir de apenas dois pontos.",
      "Confundir 'maior valor' com 'maior crescimento'.",
    ],
    summary: [
      "Leia título, eixos, unidade e período antes de calcular.",
      "Percentual ≠ quantidade: confira a base.",
      "Variação percentual usa o valor inicial como base.",
      "Gráfico de setores soma 100%.",
    ],
    recall: [
      { q: "Por que um eixo que não começa em zero pode enganar?", a: "Porque exagera visualmente as diferenças entre as barras." },
      { q: "Se uma categoria tem 40% de um total de 500, qual é o seu valor absoluto?", a: "200." },
      { q: "Um valor passou de 8 para 10. Qual é a variação percentual?", a: "25%: (10 − 8) / 8 = 0,25. A base é o valor inicial." },
    ],
    related: ["Gráficos e tabelas"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "mat-estatistica",
    discipline: "matematica",
    order: 6,
    title: "Média, mediana, moda e dispersão",
    objective: "Calcular e interpretar medidas de tendência central e de dispersão, escolhendo a medida adequada ao contexto.",
    minutes: 25,
    prerequisites: ["Operações com decimais", "Leitura de tabelas"],
    planDay: 2,
    concept: `**Média aritmética:** soma dos valores dividida pela quantidade. É sensível a valores extremos. **Média ponderada:** cada valor tem um peso $p_i$: $\\bar{x}=\\frac{\\sum x_i p_i}{\\sum p_i}$ — usada em notas com pesos e em tabelas de frequência.

**Mediana:** valor central dos dados **ordenados** (em quantidade par, a média dos dois centrais). Resiste a extremos — útil para renda, preços de imóveis. **Moda:** valor mais frequente (pode haver mais de uma, ou nenhuma).

**Dispersão** diz o quanto os dados se espalham. **Amplitude** = maior − menor. **Variância** é a média dos quadrados dos desvios em relação à média, e **desvio padrão** é sua raiz quadrada, na mesma unidade dos dados. Quanto **menor** o desvio padrão, mais **homogêneos** (regulares) são os dados.`,
    situations: "Notas e desempenho de grupos, salários, tempos de atletas, produção ao longo do mês. Comparações entre dois grupos pedem **média e dispersão juntas**: médias iguais não significam regularidade igual.",
    formulas: [
      { tex: "\\bar{x}=\\frac{x_1+x_2+\\cdots+x_n}{n}", meaning: "Média aritmética.", conditions: "Todos os valores com o mesmo peso." },
      { tex: "\\bar{x}=\\frac{\\sum x_i\\,p_i}{\\sum p_i}", meaning: "Média ponderada.", conditions: "Pesos $p_i$ positivos." },
      { tex: "\\sigma^2=\\frac{\\sum (x_i-\\bar{x})^2}{n}", meaning: "Variância (população).", conditions: "O desvio padrão é $\\sigma=\\sqrt{\\sigma^2}$." },
    ],
    examples: [
      {
        title: "Média, mediana e moda",
        problem: "Tempos (em s) de um atleta: $12,\\ 11,\\ 13,\\ 11,\\ 18$. Calcule média, mediana e moda.",
        solution: "Soma $=65$, média $=65/5=13$ s. Ordenando: $11,11,12,13,18$ → mediana $=12$ s. Moda $=11$ s (aparece duas vezes). Note que o valor $18$ puxa a média para cima, mas não a mediana.",
      },
      {
        title: "Quem é mais regular?",
        problem: "Dois alunos têm média $7$. As notas do aluno A foram $6,7,8$ e as do B, $4,7,10$. Quem tem desempenho mais regular?",
        solution: "Desvios de A: $-1,0,1$ → variância $=(1+0+1)/3\\approx 0{,}67$. Desvios de B: $-3,0,3$ → variância $=(9+0+9)/3=6$. O aluno **A** é mais regular (menor dispersão).",
      },
    ],
    commonErrors: [
      "Calcular a mediana sem ordenar os dados.",
      "Esquecer os pesos ao calcular a média de uma tabela de frequências.",
      "Confundir variância (unidade ao quadrado) com desvio padrão.",
      "Concluir que média igual significa dados iguais.",
    ],
    summary: [
      "Média: sensível a extremos; mediana: central e robusta; moda: mais frequente.",
      "Média ponderada usa pesos ou frequências.",
      "Menor desvio padrão = mais regularidade.",
      "Para comparar grupos, olhe tendência central e dispersão.",
    ],
    recall: [
      { q: "Qual medida é menos afetada por um valor muito alto isolado?", a: "A mediana." },
      { q: "Notas 5 (peso 2) e 8 (peso 3). Qual a média ponderada?", a: "(5·2 + 8·3)/5 = 6,8." },
      { q: "Qual a mediana de 3, 9, 4, 10?", a: "Ordenando: 3, 4, 9, 10 → (4 + 9)/2 = 6,5." },
    ],
    related: ["Estatística"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "mat-geometria-plana",
    discipline: "matematica",
    order: 11,
    title: "Geometria plana, semelhança e trigonometria básica",
    objective: "Calcular áreas e perímetros, aplicar semelhança de triângulos e o teorema de Pitágoras e usar as razões trigonométricas no triângulo retângulo.",
    minutes: 30,
    prerequisites: ["Razão e proporção", "Equações do 1º grau"],
    planDay: 3,
    concept: `**Áreas essenciais.** Retângulo $b\\cdot h$; triângulo $\\frac{b\\cdot h}{2}$; trapézio $\\frac{(B+b)\\,h}{2}$; círculo $\\pi r^2$ e comprimento $2\\pi r$. Em figuras compostas, **decomponha** em partes conhecidas e some (ou subtraia).

**Teorema de Pitágoras** (triângulo retângulo): $a^2=b^2+c^2$, em que $a$ é a **hipotenusa** (oposta ao ângulo reto).

**Semelhança de triângulos.** Dois triângulos são semelhantes quando têm os mesmos ângulos; então os lados correspondentes são **proporcionais**. Se a razão de semelhança é $k$, as áreas têm razão $k^2$. É a ferramenta por trás de sombras, mapas, rampas e plantas.

**Trigonometria no triângulo retângulo.** Em relação a um ângulo agudo $\\theta$: $\\operatorname{sen}\\theta=\\frac{\\text{cateto oposto}}{\\text{hipotenusa}}$, $\\cos\\theta=\\frac{\\text{cateto adjacente}}{\\text{hipotenusa}}$, $\\operatorname{tg}\\theta=\\frac{\\text{oposto}}{\\text{adjacente}}$. Valores notáveis: $30^\\circ$ ($\\tfrac12$, $\\tfrac{\\sqrt3}{2}$, $\\tfrac{\\sqrt3}{3}$), $45^\\circ$ ($\\tfrac{\\sqrt2}{2}$, $\\tfrac{\\sqrt2}{2}$, $1$) e $60^\\circ$ ($\\tfrac{\\sqrt3}{2}$, $\\tfrac12$, $\\sqrt3$) para seno, cosseno e tangente.`,
    situations: "Alturas e distâncias inacessíveis (sombra, escada, rampa), terrenos de formatos compostos, plantas e maquetes. Desenhe a figura, marque o que é dado e escolha **uma** relação (Pitágoras, semelhança ou razão trigonométrica).",
    formulas: [
      { tex: "a^2=b^2+c^2", meaning: "Teorema de Pitágoras.", conditions: "Somente em triângulos retângulos; $a$ é a hipotenusa." },
      { tex: "\\frac{\\ell_1}{\\ell_2}=k\\;\\Rightarrow\\;\\frac{A_1}{A_2}=k^2", meaning: "Razão de semelhança e razão de áreas.", conditions: "Figuras semelhantes." },
      { tex: "\\operatorname{tg}\\theta=\\frac{\\text{oposto}}{\\text{adjacente}}", meaning: "Tangente no triângulo retângulo.", conditions: "$\\theta$ agudo; catetos medidos em relação a $\\theta$." },
    ],
    examples: [
      {
        title: "Altura pela sombra (semelhança)",
        problem: "Uma estaca de $1{,}5\\ \\text{m}$ projeta sombra de $2\\ \\text{m}$. No mesmo instante, um poste projeta sombra de $8\\ \\text{m}$. Qual a altura do poste?",
        solution: "Os raios solares formam triângulos semelhantes: $\\frac{h}{8}=\\frac{1{,}5}{2}\\Rightarrow h=\\frac{1{,}5\\cdot 8}{2}=6\\ \\text{m}$.",
      },
      {
        title: "Rampa (trigonometria)",
        problem: "Uma rampa de $10\\ \\text{m}$ de comprimento forma $30^\\circ$ com o chão. Qual a altura que ela alcança?",
        solution: "A altura é o cateto oposto: $\\operatorname{sen}30^\\circ=\\frac{h}{10}\\Rightarrow h=10\\cdot\\frac12=5\\ \\text{m}$.",
      },
    ],
    commonErrors: [
      "Usar Pitágoras em triângulo que não é retângulo.",
      "Trocar cateto oposto e adjacente ao mudar o ângulo de referência.",
      "Comparar lados não correspondentes na semelhança.",
      "Esquecer que a razão de áreas é o quadrado da razão de semelhança.",
    ],
    summary: [
      "Decomponha figuras compostas em áreas conhecidas.",
      "Pitágoras só vale no triângulo retângulo.",
      "Semelhança: lados proporcionais; áreas na razão k².",
      "sen = oposto/hipotenusa; cos = adjacente/hipotenusa; tg = oposto/adjacente.",
    ],
    recall: [
      { q: "Qual a hipotenusa de um triângulo retângulo com catetos 6 e 8?", a: "10 (36 + 64 = 100)." },
      { q: "Se dois polígonos semelhantes têm razão de semelhança 3, qual a razão entre suas áreas?", a: "9." },
      { q: "Quanto vale sen 30°?", a: "1/2." },
    ],
    related: ["Geometria"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "mat-funcoes",
    discipline: "matematica",
    order: 9,
    title: "Funções afim e quadrática",
    objective: "Interpretar, montar e resolver problemas com funções do 1º e do 2º grau, lendo coeficientes, gráficos, raízes e valores máximos ou mínimos.",
    minutes: 30,
    prerequisites: ["Equações do 1º e 2º graus", "Plano cartesiano"],
    planDay: 4,
    concept: `**Função afim:** $f(x)=ax+b$. O gráfico é uma reta; $a$ é a **taxa de variação** (inclinação) e $b$ é o valor em $x=0$ (valor inicial). Se $a>0$, cresce; se $a<0$, decresce. A raiz é $x=-\\frac{b}{a}$. Modela custos fixos + variáveis, tarifas e movimentos uniformes.

**Função quadrática:** $f(x)=ax^2+bx+c$ ($a\\neq0$). O gráfico é uma **parábola**: concavidade para cima se $a>0$ (tem **mínimo**) e para baixo se $a<0$ (tem **máximo**). O vértice está em $x_v=-\\frac{b}{2a}$ e $y_v=-\\frac{\\Delta}{4a}$, com $\\Delta=b^2-4ac$. As raízes (quando existem) são $x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}$: duas se $\\Delta>0$, uma se $\\Delta=0$, nenhuma real se $\\Delta<0$.

**Como interpretar no contexto.** A raiz da afim é o ponto de equilíbrio; o vértice da quadrática é o **valor ótimo** (lucro máximo, altura máxima, custo mínimo).`,
    situations: "Preço de corrida (bandeirada + km), lucro em função da quantidade vendida, altura de um objeto lançado, área máxima com perímetro fixo. Sempre traduza: qual é a variável, qual é o que se quer maximizar/encontrar.",
    formulas: [
      { tex: "f(x)=ax+b,\\quad x_0=-\\frac{b}{a}", meaning: "Função afim e sua raiz.", conditions: "$a\\neq0$." },
      { tex: "x_v=-\\frac{b}{2a},\\qquad y_v=-\\frac{\\Delta}{4a}", meaning: "Vértice da parábola.", conditions: "$\\Delta=b^2-4ac$; máximo se $a<0$, mínimo se $a>0$." },
      { tex: "x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}", meaning: "Fórmula de Bhaskara.", conditions: "Raízes reais apenas se $\\Delta\\ge0$." },
    ],
    examples: [
      {
        title: "Função afim em contexto",
        problem: "Um táxi cobra bandeirada de $R\\$\\,5$ mais $R\\$\\,2{,}50$ por km. Qual a função e quanto custa uma corrida de $12\\ \\text{km}$?",
        solution: "$C(x)=2{,}5x+5$. Para $x=12$: $C=2{,}5\\cdot12+5=35$. A corrida custa $R\\$\\,35$.",
      },
      {
        title: "Valor máximo",
        problem: "O lucro (em milhares de reais) é $L(x)=-x^2+10x-16$, com $x$ em milhares de unidades vendidas. Qual o lucro máximo e para qual $x$?",
        solution: "$a=-1<0$: há máximo. $x_v=-\\frac{10}{2(-1)}=5$. $L(5)=-25+50-16=9$. Lucro máximo de $9$ mil reais com $5$ mil unidades.",
      },
    ],
    commonErrors: [
      "Confundir o coeficiente b com a inclinação (a inclinação é a).",
      "Usar o sinal errado em $x_v=-b/(2a)$.",
      "Dizer que há valor mínimo quando a < 0.",
      "Esquecer de verificar se a raiz faz sentido no contexto (ex.: quantidade negativa).",
    ],
    summary: [
      "Afim: taxa de variação a e valor inicial b.",
      "Quadrática: vértice dá máximo (a<0) ou mínimo (a>0).",
      "Δ decide quantas raízes reais existem.",
      "Interprete raiz e vértice no contexto do problema.",
    ],
    recall: [
      { q: "Em f(x) = 3x − 6, qual a raiz?", a: "x = 2." },
      { q: "Uma parábola com a < 0 tem valor máximo ou mínimo?", a: "Máximo." },
      { q: "Quantas raízes reais tem x² + 2x + 5?", a: "Nenhuma: Δ = 4 − 20 = −16 < 0." },
    ],
    related: ["Funções"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "fis-eletricidade",
    discipline: "fisica",
    order: 5,
    title: "Eletricidade, circuitos e consumo de energia",
    objective: "Relacionar tensão, corrente, resistência e potência; interpretar circuitos simples e calcular consumo e custo de energia elétrica.",
    minutes: 30,
    prerequisites: ["Notação científica", "Proporção"],
    planDay: 2,
    concept: `**Corrente elétrica** $i$ é a quantidade de carga por segundo ($\\text{A}=\\text{C/s}$). **Tensão (ddp)** $U$ é a energia por unidade de carga ($\\text{V}$). **Resistência** $R$ mede a oposição à passagem da corrente ($\\Omega$). Para resistores ôhmicos vale a **1ª lei de Ohm:** $U=R\\,i$.

**Potência elétrica** é a energia transformada por segundo: $P=U\\,i$ (em W). Combinando com Ohm: $P=R\\,i^2=\\frac{U^2}{R}$. O **efeito Joule** transforma energia elétrica em calor no resistor.

**Associações de resistores.** Em **série**, a corrente é a mesma e as resistências somam: $R_{eq}=R_1+R_2$. Em **paralelo**, a tensão é a mesma e $\\frac1{R_{eq}}=\\frac1{R_1}+\\frac1{R_2}$ — a resistência equivalente é **menor** que a menor das resistências.

**Energia e custo.** Energia consumida $E=P\\cdot\\Delta t$. Em contas de luz usa-se o **quilowatt-hora**: potência em kW × tempo em h. $1\\ \\text{kWh}=3{,}6\\times10^{6}\\ \\text{J}$. **Custo** = energia (kWh) × tarifa (R$/kWh).`,
    situations: "Chuveiros, lâmpadas, fusíveis e disjuntores (limite de corrente), aparelhos em stand-by, comparação entre lâmpadas incandescentes e de LED. Cuide de **unidades**: W × h dá Wh; divida por 1000 para kWh.",
    formulas: [
      { tex: "U=R\\,i", meaning: "Lei de Ohm.", conditions: "Resistores ôhmicos (R constante)." },
      { tex: "P=U\\,i=R\\,i^2=\\frac{U^2}{R}", meaning: "Potência elétrica.", conditions: "Potência em W com U em V, i em A, R em Ω." },
      { tex: "E=P\\,\\Delta t", meaning: "Energia consumida.", conditions: "Para kWh: P em kW e Δt em h." },
    ],
    examples: [
      {
        title: "Custo de um chuveiro",
        problem: "Um chuveiro de $5\\,000\\ \\text{W}$ é usado $20$ minutos por dia durante $30$ dias. Com tarifa de $R\\$\\,0{,}90$ por kWh, qual o custo mensal?",
        solution: "Tempo total: $20\\cdot30=600\\ \\text{min}=10\\ \\text{h}$. Energia: $5\\ \\text{kW}\\cdot10\\ \\text{h}=50\\ \\text{kWh}$. Custo: $50\\cdot0{,}90=R\\$\\,45{,}00$.",
      },
      {
        title: "Corrente e fusível",
        problem: "Um forno de $2\\,200\\ \\text{W}$ é ligado em $220\\ \\text{V}$. Qual a corrente? Um fusível de $8\\ \\text{A}$ é adequado?",
        solution: "$i=\\frac{P}{U}=\\frac{2\\,200}{220}=10\\ \\text{A}$. Como $10\\ \\text{A}>8\\ \\text{A}$, o fusível queimaria: não é adequado.",
      },
    ],
    commonErrors: [
      "Misturar W com kW ou minutos com horas ao calcular kWh.",
      "Usar $R_{eq}=R_1+R_2$ em paralelo.",
      "Achar que 'quanto maior a resistência, maior a potência' sem fixar tensão ou corrente.",
      "Esquecer que a mesma tensão nominal mantém a potência indicada apenas se o aparelho for ligado na tensão correta.",
    ],
    summary: [
      "U = R·i; P = U·i.",
      "Série: R soma; paralelo: R equivalente menor que a menor.",
      "Energia = potência × tempo; kWh = kW × h.",
      "Custo = kWh × tarifa.",
    ],
    recall: [
      { q: "Qual a corrente em um resistor de 10 Ω ligado a 20 V?", a: "2 A." },
      { q: "Uma lâmpada de 60 W fica ligada 5 h. Quantos kWh consome?", a: "0,3 kWh." },
      { q: "Dois resistores de 6 Ω em paralelo têm resistência equivalente de quanto?", a: "3 Ω." },
    ],
    related: ["Eletricidade"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "fis-energia",
    discipline: "fisica",
    order: 2,
    title: "Dinâmica, trabalho, energia e potência",
    objective: "Aplicar as leis de Newton em situações simples e usar trabalho, energia mecânica e potência para analisar movimentos e máquinas.",
    minutes: 30,
    prerequisites: ["Proporção", "Unidades do SI"],
    planDay: 4,
    concept: `**2ª lei de Newton:** a força resultante é $F_R=m\\,a$ (N = kg·m/s²). **Peso** $P=m\\,g$ (com $g\\approx10\\ \\text{m/s}^2$ nos problemas do Enem, salvo indicação). **Atrito** opõe-se ao movimento relativo: $F_{at}=\\mu N$.

**Trabalho de uma força constante:** $\\tau=F\\,d\\cos\\theta$ (J). Se a força é paralela ao deslocamento, $\\tau=F\\,d$. **Energia cinética:** $E_c=\\frac12 m v^2$. **Energia potencial gravitacional:** $E_p=m\\,g\\,h$.

**Conservação da energia mecânica:** na ausência de forças dissipativas, $E_c+E_p$ permanece constante. Havendo atrito, parte da energia vira **calor** — a energia total se conserva, mas a mecânica diminui.

**Potência** é a rapidez com que o trabalho é realizado: $P=\\frac{\\tau}{\\Delta t}$ (W). **Rendimento:** $\\eta=\\frac{P_{útil}}{P_{total}}$ — sempre menor que $1$ em máquinas reais.`,
    situations: "Montanha-russa, rampas, elevadores, motores, usinas hidrelétricas (energia potencial da água → cinética → elétrica) e frenagem de veículos. Pergunte: **que energia se transforma em qual?** e **onde há perdas?**",
    formulas: [
      { tex: "F_R=m\\,a", meaning: "Segunda lei de Newton.", conditions: "Massa constante; forças em N, massa em kg." },
      { tex: "E_c=\\tfrac12 m v^2,\\qquad E_p=m g h", meaning: "Energias cinética e potencial gravitacional.", conditions: "$v$ em m/s; $h$ medida a partir de um nível de referência." },
      { tex: "P=\\frac{\\tau}{\\Delta t},\\qquad \\eta=\\frac{P_{\\text{útil}}}{P_{\\text{total}}}", meaning: "Potência e rendimento.", conditions: "Rendimento entre 0 e 1 (ou 0% e 100%)." },
    ],
    examples: [
      {
        title: "Queda sem atrito",
        problem: "Um corpo de $2\\ \\text{kg}$ é solto de $5\\ \\text{m}$ de altura. Desprezando o ar e usando $g=10\\ \\text{m/s}^2$, com que velocidade chega ao solo?",
        solution: "$mgh=\\tfrac12mv^2\\Rightarrow v^2=2gh=2\\cdot10\\cdot5=100\\Rightarrow v=10\\ \\text{m/s}$. A massa se cancela.",
      },
      {
        title: "Potência de um motor",
        problem: "Um motor eleva $200\\ \\text{kg}$ a $6\\ \\text{m}$ em $12\\ \\text{s}$, com rendimento de $80\\%$ ($g=10\\ \\text{m/s}^2$). Qual a potência elétrica consumida?",
        solution: "Trabalho útil: $mgh=200\\cdot10\\cdot6=12\\,000\\ \\text{J}$. Potência útil: $12\\,000/12=1\\,000\\ \\text{W}$. Como $\\eta=0{,}8$, $P_{total}=1\\,000/0{,}8=1\\,250\\ \\text{W}$.",
      },
    ],
    commonErrors: [
      "Usar a massa em gramas ou a velocidade em km/h sem converter para o SI.",
      "Dizer que a energia 'some' com o atrito (ela se transforma em calor).",
      "Confundir trabalho (energia transferida) com potência (taxa).",
      "Esquecer que o peso depende de g, enquanto a massa não.",
    ],
    summary: [
      "F = m·a; P = m·g.",
      "Sem dissipação: Ec + Ep constante.",
      "Potência = trabalho/tempo; rendimento < 1.",
      "Converta tudo para o SI antes de calcular.",
    ],
    recall: [
      { q: "Qual a energia cinética de um corpo de 4 kg a 3 m/s?", a: "18 J (½ · 4 · 9)." },
      { q: "Uma força de 20 N desloca um bloco por 3 m na mesma direção. Qual o trabalho?", a: "60 J." },
      { q: "Se um motor tem rendimento de 75% e potência total de 400 W, qual a potência útil?", a: "300 W." },
    ],
    related: ["Energia"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "qui-estequiometria",
    discipline: "quimica",
    order: 2,
    title: "Estequiometria",
    objective: "Usar a equação química balanceada, o conceito de mol e as massas molares para relacionar quantidades de reagentes e produtos.",
    minutes: 30,
    prerequisites: ["Balanceamento de equações", "Proporção"],
    planDay: 3,
    concept: `A **estequiometria** calcula as quantidades envolvidas em uma reação. Ela se apoia em três ideias: (1) a equação deve estar **balanceada** (conservação dos átomos); (2) os coeficientes indicam a **proporção em mols**; (3) massa, mols e número de partículas se relacionam pela **massa molar** e pela constante de Avogadro.

**Mol e massa molar.** $1\\ \\text{mol}$ contém $6{,}0\\times10^{23}$ entidades. A massa molar $M$ (g/mol) vem da tabela periódica: $n=\\frac{m}{M}$. Exemplo: $M(\\text{H}_2\\text{O})=18\\ \\text{g/mol}$.

**Roteiro de resolução.** 1) Escreva e balanceie a equação. 2) Converta o dado para **mol**. 3) Use a proporção dos coeficientes. 4) Converta o resultado para a unidade pedida (g, L, partículas).

**Reagente limitante e excesso.** Quando as quantidades dos reagentes não estão na proporção da equação, o que **acaba primeiro** é o **limitante**; ele determina quanto produto se forma. **Rendimento** real: $\\frac{\\text{massa obtida}}{\\text{massa teórica}}\\cdot100\\%$.`,
    situations: "Combustão de combustíveis e emissão de CO₂, produção de materiais, neutralização de ácidos, tratamento de água. Atenção a **unidades** e ao enunciado: pede-se massa, volume (gás) ou número de moléculas?",
    formulas: [
      { tex: "n=\\frac{m}{M}", meaning: "Quantidade de matéria (mol).", conditions: "$m$ em g e $M$ em g/mol." },
      { tex: "N=n\\cdot N_A,\\quad N_A=6{,}0\\times10^{23}\\ \\text{mol}^{-1}", meaning: "Número de entidades.", conditions: "Valor aproximado de Avogadro, usual nas provas." },
      { tex: "\\eta=\\frac{m_{\\text{real}}}{m_{\\text{teórica}}}\\cdot100\\%", meaning: "Rendimento da reação.", conditions: "Ambas as massas do mesmo produto." },
    ],
    examples: [
      {
        title: "Massa de produto",
        problem: "Na combustão do metano, $\\text{CH}_4+2\\,\\text{O}_2\\to\\text{CO}_2+2\\,\\text{H}_2\\text{O}$, que massa de $\\text{CO}_2$ se forma a partir de $32\\ \\text{g}$ de $\\text{CH}_4$? ($M(\\text{CH}_4)=16$, $M(\\text{CO}_2)=44\\ \\text{g/mol}$)",
        solution: "$n(\\text{CH}_4)=32/16=2\\ \\text{mol}$. Proporção $1:1$, logo $n(\\text{CO}_2)=2\\ \\text{mol}$ e $m=2\\cdot44=88\\ \\text{g}$.",
      },
      {
        title: "Reagente limitante",
        problem: "$2\\,\\text{H}_2+\\text{O}_2\\to2\\,\\text{H}_2\\text{O}$. Misturam-se $4\\ \\text{mol}$ de $\\text{H}_2$ e $1\\ \\text{mol}$ de $\\text{O}_2$. Qual o limitante e quanta água se forma?",
        solution: "Pela proporção, $1\\ \\text{mol}$ de $\\text{O}_2$ consome $2\\ \\text{mol}$ de $\\text{H}_2$. O $\\text{O}_2$ acaba primeiro: é o **limitante**. Formam-se $2\\ \\text{mol}$ de água ($36\\ \\text{g}$), e sobram $2\\ \\text{mol}$ de $\\text{H}_2$.",
      },
    ],
    commonErrors: [
      "Fazer a conta sem balancear a equação.",
      "Comparar massas em vez de mols ao aplicar os coeficientes.",
      "Usar massa molar errada (ex.: esquecer o índice 2 em O₂).",
      "Ignorar o reagente limitante quando as quantidades de dois reagentes são dadas.",
    ],
    summary: [
      "Balanceie primeiro; coeficientes = proporção em mols.",
      "n = m/M; N = n · N_A.",
      "O limitante determina o produto formado.",
      "Rendimento = real/teórico.",
    ],
    recall: [
      { q: "Quantos mols há em 36 g de água (M = 18 g/mol)?", a: "2 mol." },
      { q: "Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de NH₃ se formam a partir de 6 mol de H₂ (com N₂ em excesso)?", a: "4 mol." },
      { q: "O que é o reagente limitante?", a: "O reagente que se esgota primeiro e limita a quantidade de produto." },
    ],
    related: ["Estequiometria"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "bio-ecologia",
    discipline: "biologia",
    order: 1,
    title: "Ecologia: relações, cadeias e teias alimentares",
    objective: "Interpretar fluxo de energia e matéria em ecossistemas, relações ecológicas, cadeias e teias alimentares e efeitos de perturbações.",
    minutes: 25,
    prerequisites: ["Noções de ecossistema"],
    planDay: 1,
    concept: `**Níveis de organização:** população (mesma espécie, mesmo local) → comunidade (todas as populações) → ecossistema (comunidade + ambiente) → biosfera.

**Fluxo de energia.** A energia entra nos ecossistemas pela **fotossíntese** (produtores) e **flui em um sentido**: produtores → consumidores (primários, secundários…) → decompositores. A cada nível trófico, a maior parte da energia é perdida como calor (respiração e metabolismo); por isso, **em geral, apenas cerca de 10% da energia passa ao nível seguinte**. Isso explica por que as cadeias são curtas e por que a biomassa e a energia costumam diminuir nos níveis mais altos (pirâmides).

**Matéria × energia.** A matéria é **reciclada** (decompositores devolvem nutrientes); a energia **não**: ela se dissipa.

**Teias alimentares** são redes de cadeias interligadas. Quanto mais conexões, maior a estabilidade. A retirada de uma espécie-chave pode provocar **efeitos em cascata**.

**Relações ecológicas.** Harmônicas: mutualismo (+/+, obrigatório), protocooperação (+/+, facultativa), comensalismo (+/0), inquilinismo. Desarmônicas: predação (+/−), parasitismo (+/−), competição (−/−), amensalismo (0/−). **Bioacumulação:** substâncias não degradáveis (metais pesados, alguns pesticidas) acumulam-se nos tecidos e **aumentam de concentração** ao longo da cadeia (magnificação trófica).`,
    situations: "Introdução e remoção de espécies, uso de pesticidas, desmatamento, eutrofização, pirâmides de energia. Pergunte sempre: **quem consome quem?**, **o que acontece com a população se um elo muda?**",
    formulas: [],
    examples: [
      {
        title: "Energia entre níveis tróficos",
        problem: "Em uma cadeia capim → gafanhoto → sapo → cobra, os produtores fixam $10\\,000\\ \\text{kJ}$. Considerando transferência de $10\\%$ entre níveis, quanta energia chega à cobra?",
        solution: "Capim: $10\\,000$; gafanhoto: $1\\,000$; sapo: $100$; cobra: $10\\ \\text{kJ}$. A cada passo multiplica-se por $0{,}1$ (três transferências).",
      },
      {
        title: "Efeito em cascata",
        problem: "Em uma teia, o controle de uma espécie predadora de insetos-praga é removido por caça excessiva. O que se espera para a população de insetos e para a vegetação?",
        solution: "Sem predador, a população de insetos tende a crescer (liberação da predação), aumentando o consumo da vegetação e podendo reduzi-la — efeito em cascata.",
      },
    ],
    commonErrors: [
      "Achar que a energia 'recicla' como a matéria.",
      "Confundir relação de predação com parasitismo.",
      "Dizer que decompositores ocupam apenas o topo da cadeia (atuam em todos os níveis).",
      "Esquecer que a concentração de poluentes aumenta nos níveis mais altos.",
    ],
    summary: [
      "Energia flui em sentido único e se dissipa; matéria circula.",
      "Cerca de 10% da energia passa de um nível ao próximo.",
      "Teias interligam cadeias; retirar um elo afeta os demais.",
      "Poluentes persistentes se concentram no topo da cadeia.",
    ],
    recall: [
      { q: "Qual relação é harmônica e benéfica para os dois organismos e obrigatória?", a: "Mutualismo." },
      { q: "Por que cadeias alimentares têm poucos níveis?", a: "Porque muita energia é perdida como calor a cada nível." },
      { q: "O que é bioacumulação?", a: "Acúmulo de substâncias não eliminadas nos tecidos dos organismos ao longo da vida." },
    ],
    related: ["Ecologia"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
  {
    id: "bio-genetica",
    discipline: "biologia",
    order: 5,
    title: "Genética e hereditariedade",
    objective: "Aplicar a primeira lei de Mendel, interpretar heredogramas e calcular probabilidades de herança de características simples.",
    minutes: 30,
    prerequisites: ["Probabilidade básica", "Noção de gene e cromossomo"],
    planDay: 4,
    concept: `**Conceitos.** **Gene** é um segmento de DNA; **alelos** são variantes do mesmo gene. **Genótipo** é a constituição genética; **fenótipo** é a característica manifestada (resulta do genótipo + ambiente). Um indivíduo é **homozigoto** (alelos iguais, AA ou aa) ou **heterozigoto** (alelos diferentes, Aa).

**Dominância.** O alelo dominante (A) se manifesta mesmo em heterozigose; o recessivo (a) só se manifesta em homozigose. **1ª lei de Mendel (segregação):** cada indivíduo tem dois alelos de cada gene, que se **separam na formação dos gametas**; cada gameta recebe apenas um.

**Cruzamentos.** $\\text{Aa}\\times\\text{Aa}$ gera $\\frac14$ AA, $\\frac12$ Aa e $\\frac14$ aa; fenotipicamente, $\\frac34$ dominante e $\\frac14$ recessivo. Probabilidades de eventos **independentes** se **multiplicam**.

**Heredogramas.** Quadrados = homens; círculos = mulheres; símbolos pintados = afetados. Se **dois pais não afetados têm filho afetado**, a característica é **recessiva** (os pais são heterozigotos). Em heranças ligadas ao X recessivas (ex.: daltonismo), homens são afetados com mais frequência, pois têm um único cromossomo X.

**Outras situações.** Codominância e dominância incompleta (heterozigoto com fenótipo intermediário ou com ambos), e os grupos sanguíneos ABO (alelos $I^A$, $I^B$, $i$) e o fator Rh.`,
    situations: "Heredogramas, cruzamentos de plantas e animais, doenças hereditárias, grupos sanguíneos e probabilidade de um casal ter filhos com determinada característica. Primeiro defina os **genótipos possíveis**, depois calcule.",
    formulas: [],
    examples: [
      {
        title: "Cruzamento monoíbrido",
        problem: "Em ervilhas, semente lisa (R) é dominante sobre rugosa (r). Do cruzamento de duas plantas heterozigotas, qual a probabilidade de uma semente ser rugosa?",
        solution: "Rr × Rr → RR, Rr, Rr, rr. Rugosa é rr: probabilidade $\\frac14=25\\%$.",
      },
      {
        title: "Probabilidade composta",
        problem: "Um casal heterozigoto (Aa × Aa) para uma doença recessiva (aa) planeja ter 2 filhos. Qual a probabilidade de **ambos** serem afetados?",
        solution: "Cada filho tem $\\frac14$ de chance de ser aa. Eventos independentes: $\\frac14\\cdot\\frac14=\\frac1{16}$.",
      },
    ],
    commonErrors: [
      "Achar que dominante significa 'mais comum' ou 'mais forte'.",
      "Somar probabilidades de eventos independentes em vez de multiplicar.",
      "Concluir que 1 filho afetado em 4 'confirma' a razão 3:1 (ela é uma probabilidade, não uma garantia).",
      "Esquecer de determinar primeiro o genótipo dos pais no heredograma.",
    ],
    summary: [
      "Alelos se separam na formação dos gametas.",
      "Aa × Aa → 1/4 AA : 1/2 Aa : 1/4 aa.",
      "Pais iguais com filho diferente indicam característica recessiva.",
      "Eventos independentes: multiplique as probabilidades.",
    ],
    recall: [
      { q: "Qual a proporção fenotípica do cruzamento Aa × Aa com dominância completa?", a: "3 dominante : 1 recessivo." },
      { q: "Qual o genótipo de um indivíduo que manifesta uma característica recessiva?", a: "Homozigoto recessivo (aa)." },
      { q: "Por que o daltonismo é mais frequente em homens?", a: "Porque o gene é recessivo e ligado ao cromossomo X, e eles têm apenas um X." },
    ],
    related: ["Genética"],
    sources: [matriz, { label: "Autoria GoDev Education" }],
    reviewedAt,
    status: "publicado",
  },
];
