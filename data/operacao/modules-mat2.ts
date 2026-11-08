import type { StudyModule } from "../../lib/operacao/types";

/** Módulos de Matemática (parte 2). Autoria GoDev Education; contas conferidas em 08/11/2026; sem revisão externa de professor. */
const matriz = { label: "Inep — Matrizes de Referência do Enem", url: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem" };
const autoria = { label: "Autoria GoDev Education (texto e exemplos originais)" };
const reviewedAt = "2026-11-08";

export const modulesMat2: StudyModule[] = [
  {
    id: "mat-geometria-espacial", discipline: "matematica", order: 7, title: "Geometria espacial: volumes e áreas de sólidos", minutes: 25,
    objective: "Calcular volume e área de prismas, cilindros, pirâmides, cones e esferas e converter volume em capacidade.",
    prerequisites: ["Áreas de figuras planas", "Unidades de medida"], planDay: 3,
    concept: `**Prismas e cilindros:** volume $=$ área da base $\\times$ altura. **Pirâmides e cones:** volume $=\\frac13\\times$ área da base $\\times$ altura. **Esfera:** $V=\\frac43\\pi r^3$ e área $A=4\\pi r^2$.\n\n**Conversões:** $1\\ \\text{m}^3=1\\,000\\ \\text{L}$ e $1\\ \\text{dm}^3=1\\ \\text{L}$. Ao mudar de unidade de comprimento, o volume muda pelo **cubo** do fator.\n\n**Semelhança:** se as medidas lineares de dois sólidos semelhantes têm razão $k$, as áreas têm razão $k^2$ e os volumes, $k^3$.`,
    situations: "O Enem usa caixas d'água, embalagens, silos, bolas e recipientes: pede volume, capacidade, quantidade de material ou comparação entre embalagens. Atenção às unidades.",
    formulas: [
      { tex: "V_{prisma}=A_b\\cdot h\\qquad V_{cilindro}=\\pi r^2 h", meaning: "Volume de prismas e cilindros.", conditions: "Altura perpendicular à base." },
      { tex: "V_{piramide}=\\tfrac13 A_b h\\qquad V_{cone}=\\tfrac13\\pi r^2 h", meaning: "Pirâmides e cones: um terço do prisma/cilindro de mesma base e altura.", conditions: "" },
      { tex: "V_{esfera}=\\tfrac43\\pi r^3\\qquad A_{esfera}=4\\pi r^2", meaning: "Esfera.", conditions: "r é o raio." },
    ],
    examples: [
      { title: "Capacidade de um reservatório", problem: "Um reservatório cilíndrico tem raio $1\\ \\text{m}$ e altura $2\\ \\text{m}$. Usando $\\pi=3$, qual a capacidade em litros?", solution: "$V=3\\cdot1^2\\cdot2=6\\ \\text{m}^3=6\\,000\\ \\text{L}$." },
      { title: "Pirâmide", problem: "Uma pirâmide de base quadrada com lado $6\\ \\text{m}$ tem altura $5\\ \\text{m}$. Qual o volume?", solution: "$A_b=36$, logo $V=\\frac13\\cdot36\\cdot5=60\\ \\text{m}^3$." },
      { title: "Razão de volumes", problem: "Um modelo reduzido tem medidas lineares $\\frac1{10}$ das do original. Qual a razão entre os volumes?", solution: "$k^3=\\left(\\frac1{10}\\right)^3=\\frac1{1\\,000}$." },
    ],
    commonErrors: ["Esquecer o fator $\\frac13$ em pirâmides e cones.", "Converter m³ em litros multiplicando por 100 (o correto é 1 000).", "Usar o diâmetro no lugar do raio.", "Aplicar a razão de semelhança linear ao volume sem elevar ao cubo."],
    summary: ["Base × altura (prisma/cilindro); um terço disso (pirâmide/cone).", "1 m³ = 1 000 L.", "Linear k → área k² → volume k³."],
    recall: [
      { q: "Quantos litros cabem em $2\\ \\text{m}^3$?", a: "2 000 litros." },
      { q: "Dobrando o raio de uma esfera, o volume fica multiplicado por quanto?", a: "Por 8 ($2^3$)." },
      { q: "Qual a diferença entre o volume de um cone e o de um cilindro de mesma base e altura?", a: "O cone tem um terço do volume do cilindro." },
    ],
    related: ["Geometria espacial"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
  {
    id: "mat-probabilidade", discipline: "matematica", order: 8, title: "Probabilidade", minutes: 25,
    objective: "Calcular probabilidades de eventos simples, complementares, independentes e condicionais.",
    prerequisites: ["Frações", "Porcentagem"], planDay: 4,
    concept: `**Probabilidade** de um evento $=\\frac{\\text{casos favoráveis}}{\\text{casos possíveis}}$, quando os casos são igualmente prováveis.\n\n**Complementar:** $P(\\text{não }A)=1-P(A)$ — útil em "pelo menos um".\n\n**Eventos independentes:** $P(A\\text{ e }B)=P(A)\\cdot P(B)$. Sem reposição, a segunda probabilidade muda (dependência).\n\n**União:** $P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$. **Condicional:** $P(A|B)=\\frac{P(A\\cap B)}{P(B)}$: o espaço amostral passa a ser só $B$.`,
    situations: "Sorteios, dados, moedas, urnas, testes diagnósticos e tabelas de pesquisa. Identifique se há reposição e se a informação restringe o espaço amostral.",
    formulas: [
      { tex: "P(A)=\\frac{n(A)}{n(\\Omega)}", meaning: "Probabilidade clássica.", conditions: "Casos equiprováveis." },
      { tex: "P(A\\cup B)=P(A)+P(B)-P(A\\cap B)", meaning: "Probabilidade da união.", conditions: "" },
      { tex: "P(A|B)=\\frac{P(A\\cap B)}{P(B)}", meaning: "Probabilidade condicional.", conditions: "$P(B)>0$." },
    ],
    examples: [
      { title: "Dois dados", problem: "Lançam-se dois dados honestos. Qual a probabilidade de a soma ser 7?", solution: "Há $36$ resultados; somam 7: $(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)$ — $6$ casos. $P=\\frac6{36}=\\frac16$." },
      { title: "Sem reposição", problem: "Uma urna tem 5 bolas vermelhas e 3 azuis. Retiram-se duas, sem reposição. Qual a probabilidade de ambas serem vermelhas?", solution: "$\\frac58\\cdot\\frac47=\\frac{20}{56}=\\frac5{14}$." },
      { title: "Pelo menos uma", problem: "Em 3 lançamentos de uma moeda, qual a probabilidade de sair pelo menos uma cara?", solution: "Complementar: nenhuma cara $=\\left(\\frac12\\right)^3=\\frac18$. Logo $1-\\frac18=\\frac78$." },
    ],
    commonErrors: ["Somar probabilidades de eventos que se sobrepõem sem subtrair a interseção.", "Ignorar que, sem reposição, o total diminui.", "Em 'pelo menos um', listar casos em vez de usar o complementar.", "Na condicional, manter o espaço amostral original."],
    summary: ["Favoráveis ÷ possíveis.", "'Pelo menos um' → 1 − probabilidade de nenhum.", "'E' independentes multiplica; 'ou' soma (tirando a interseção)."],
    recall: [
      { q: "Qual a probabilidade de sair face par em um dado?", a: "$3/6=1/2$." },
      { q: "Como calcular 'pelo menos um' com eventos independentes?", a: "1 menos o produto das probabilidades de nenhum ocorrer." },
      { q: "O que muda na probabilidade condicional?", a: "O espaço amostral passa a ser apenas o evento dado." },
    ],
    related: ["Probabilidade"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
  {
    id: "mat-combinatoria", discipline: "matematica", order: 9, title: "Análise combinatória", minutes: 25,
    objective: "Contar possibilidades com o princípio multiplicativo, permutações, arranjos e combinações.",
    prerequisites: ["Multiplicação", "Fatorial"], planDay: 4,
    concept: `**Princípio multiplicativo:** se uma escolha tem $m$ formas e outra tem $n$, juntas há $m\\cdot n$.\n\n**Permutação** de $n$ itens distintos: $n!$. Com repetição: $\\frac{n!}{a!\\,b!\\cdots}$.\n\n**Arranjo** (a ordem importa): $A_{n,p}=\\frac{n!}{(n-p)!}$. **Combinação** (a ordem não importa): $C_{n,p}=\\frac{n!}{p!(n-p)!}$.\n\nPergunta-chave: *trocar a ordem dos escolhidos gera outra situação?* Se sim, arranjo; se não, combinação.`,
    situations: "Senhas, placas, comissões, filas, anagramas, montagem de cardápios. Restrições (primeiro dígito não nulo, pessoas juntas) tratam-se primeiro.",
    formulas: [
      { tex: "A_{n,p}=\\frac{n!}{(n-p)!}", meaning: "Arranjos.", conditions: "Ordem importa." },
      { tex: "C_{n,p}=\\frac{n!}{p!\\,(n-p)!}", meaning: "Combinações.", conditions: "Ordem não importa." },
      { tex: "P=\\frac{n!}{a!\\,b!}", meaning: "Permutação com repetição.", conditions: "Itens repetidos a e b vezes." },
    ],
    examples: [
      { title: "Princípio multiplicativo", problem: "Com 3 camisas e 4 calças, quantos conjuntos diferentes?", solution: "$3\\cdot4=12$." },
      { title: "Senha", problem: "Quantas senhas de 4 dígitos distintos existem (0 a 9)?", solution: "$10\\cdot9\\cdot8\\cdot7=5\\,040$." },
      { title: "Comissão", problem: "De um grupo de 6 pessoas, quantas comissões de 3 pessoas?", solution: "$C_{6,3}=\\frac{6\\cdot5\\cdot4}{6}=20$." },
      { title: "Anagramas", problem: "Quantos anagramas tem a palavra ARARA?", solution: "$\\frac{5!}{3!\\,2!}=\\frac{120}{12}=10$." },
    ],
    commonErrors: ["Usar combinação quando a ordem importa (ou o contrário).", "Esquecer a divisão por repetições nos anagramas.", "Não tratar restrições primeiro.", "Contar duas vezes a mesma configuração."],
    summary: ["Etapas independentes multiplicam.", "Ordem importa → arranjo; não importa → combinação.", "Repetições dividem pelo fatorial de cada repetição."],
    recall: [
      { q: "Quanto vale $5!$?", a: "120." },
      { q: "Escolher presidente e vice entre 5 pessoas é arranjo ou combinação?", a: "Arranjo (a ordem muda o cargo): $5\\cdot4=20$." },
      { q: "Escolher 2 representantes (sem cargos) entre 5 pessoas?", a: "Combinação: $C_{5,2}=10$." },
    ],
    related: ["Análise combinatória"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
  {
    id: "mat-pa-pg", discipline: "matematica", order: 10, title: "Progressões aritméticas e geométricas", minutes: 25,
    objective: "Reconhecer PA e PG em situações reais e calcular termos e somas.",
    prerequisites: ["Potências", "Equações do 1º grau"], planDay: 4,
    concept: `**PA:** cada termo é o anterior mais uma razão $r$ constante: $a_n=a_1+(n-1)r$. Soma dos $n$ primeiros: $S_n=\\frac{(a_1+a_n)\\,n}{2}$.\n\n**PG:** cada termo é o anterior vezes uma razão $q$: $a_n=a_1\\,q^{\\,n-1}$. Soma finita: $S_n=a_1\\frac{q^n-1}{q-1}$ ($q\\ne1$). Soma infinita, se $|q|<1$: $S=\\frac{a_1}{1-q}$.\n\nCrescimento **linear** (soma de quantia fixa) é PA; crescimento **percentual** (multiplicação por fator) é PG.`,
    situations: "Economias mensais, degraus, poupança com juros, populações, depreciação, desconto sucessivo.",
    formulas: [
      { tex: "a_n=a_1+(n-1)\\,r", meaning: "Termo geral da PA.", conditions: "" },
      { tex: "S_n=\\frac{(a_1+a_n)\\,n}{2}", meaning: "Soma da PA.", conditions: "" },
      { tex: "a_n=a_1\\,q^{\\,n-1}", meaning: "Termo geral da PG.", conditions: "" },
      { tex: "S_\\infty=\\frac{a_1}{1-q}", meaning: "Soma infinita da PG.", conditions: "$|q|<1$." },
    ],
    examples: [
      { title: "Termo de uma PA", problem: "Na PA $5, 8, 11,\\ldots$, qual o 20º termo?", solution: "$r=3$; $a_{20}=5+19\\cdot3=62$." },
      { title: "Soma de PA", problem: "Qual a soma dos inteiros de 1 a 100?", solution: "$S=\\frac{(1+100)\\cdot100}{2}=5\\,050$." },
      { title: "PG", problem: "Uma cultura de 100 bactérias dobra a cada hora. Quantas há após 6 horas?", solution: "$100\\cdot2^6=6\\,400$." },
      { title: "Soma infinita", problem: "Calcule $8+4+2+1+\\ldots$", solution: "$a_1=8$, $q=\\frac12$: $S=\\frac{8}{1-\\frac12}=16$." },
    ],
    commonErrors: ["Confundir $n$ com o número de intervalos (o expoente é $n-1$).", "Usar PA quando o crescimento é percentual.", "Aplicar soma infinita com $|q|\\ge1$.", "Errar o número de termos de uma lista."],
    summary: ["PA: soma constante; PG: multiplicação constante.", "$S_n$ da PA = média dos extremos × nº de termos.", "Soma infinita só converge se $|q|<1$."],
    recall: [
      { q: "Quantos termos tem a PA $4,7,10,\\ldots,40$?", a: "13 termos: $(40-4)/3+1=13$." },
      { q: "Aumento de 10% ao mês é PA ou PG?", a: "PG, de razão $1{,}1$." },
      { q: "Quanto vale $1+\\frac12+\\frac14+\\ldots$?", a: "2." },
    ],
    related: ["Progressões"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
  {
    id: "mat-grandezas-medidas", discipline: "matematica", order: 11, title: "Grandezas, unidades e razões compostas", minutes: 20,
    objective: "Converter unidades e usar velocidade média, densidade, vazão e notação científica.",
    prerequisites: ["Razão e proporção", "Potências de 10"], planDay: 1,
    concept: `**Velocidade média** $=\\frac{\\text{distância}}{\\text{tempo}}$; para converter, $1\\ \\text{km/h}=\\frac1{3{,}6}\\ \\text{m/s}$. **Densidade** $=\\frac{\\text{massa}}{\\text{volume}}$. **Vazão** $=\\frac{\\text{volume}}{\\text{tempo}}$.\n\n**Conversões úteis:** $1\\ \\text{h}=60\\ \\text{min}=3\\,600\\ \\text{s}$; $1\\ \\text{m}^3=1\\,000\\ \\text{L}$; $1\\ \\text{L}=1\\,000\\ \\text{mL}$; $1\\ \\text{kg}=1\\,000\\ \\text{g}$.\n\n**Notação científica:** $a\\times10^n$ com $1\\le a<10$. Ao multiplicar, soma-se os expoentes; ao dividir, subtrai-se.`,
    situations: "Consumo, tempo de viagem, enchimento de reservatórios, medicamentos (dose por peso), tamanhos microscópicos e astronômicos.",
    formulas: [
      { tex: "v=\\frac{\\Delta s}{\\Delta t}", meaning: "Velocidade média.", conditions: "Distância total dividida pelo tempo total." },
      { tex: "d=\\frac{m}{V}", meaning: "Densidade.", conditions: "" },
      { tex: "Q=\\frac{V}{\\Delta t}", meaning: "Vazão.", conditions: "" },
    ],
    examples: [
      { title: "Conversão", problem: "Converta $90\\ \\text{km/h}$ em m/s.", solution: "$90\\div3{,}6=25\\ \\text{m/s}$." },
      { title: "Vazão", problem: "Uma torneira despeja $0{,}5\\ \\text{L/s}$. Quanto tempo para encher $1\\,200\\ \\text{L}$?", solution: "$\\frac{1\\,200}{0{,}5}=2\\,400\\ \\text{s}=40\\ \\text{min}$." },
      { title: "Velocidade média", problem: "Um carro faz $60\\ \\text{km}$ a $30\\ \\text{km/h}$ e depois $60\\ \\text{km}$ a $60\\ \\text{km/h}$. Qual a velocidade média?", solution: "Tempos: $2\\ \\text{h}$ e $1\\ \\text{h}$. Total $120\\ \\text{km}$ em $3\\ \\text{h}$: $40\\ \\text{km/h}$ (e não a média 45)." },
    ],
    commonErrors: ["Tirar a média simples das velocidades em vez de dividir distância total por tempo total.", "Misturar minutos e horas.", "Converter km/h para m/s multiplicando por 3,6.", "Errar o expoente na notação científica."],
    summary: ["Velocidade média = total ÷ total.", "km/h ÷ 3,6 = m/s.", "Sempre alinhar unidades antes de calcular."],
    recall: [
      { q: "Como converter 72 km/h em m/s?", a: "Divide por 3,6: 20 m/s." },
      { q: "Quantos mL em $2{,}5\\ \\text{L}$?", a: "2 500 mL." },
      { q: "Escreva $0{,}00045$ em notação científica.", a: "$4{,}5\\times10^{-4}$." },
    ],
    related: ["Grandezas e medidas"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
  {
    id: "mat-equacoes-sistemas", discipline: "matematica", order: 12, title: "Equações, sistemas e inequações", minutes: 25,
    objective: "Traduzir problemas em equações do 1º e 2º graus e em sistemas lineares 2×2.",
    prerequisites: ["Álgebra básica"], planDay: 3,
    concept: `**Equação do 1º grau:** isole a incógnita. **Sistema 2×2:** use substituição ou adição. **Equação do 2º grau** $ax^2+bx+c=0$: $\\Delta=b^2-4ac$ e $x=\\frac{-b\\pm\\sqrt\\Delta}{2a}$; soma das raízes $-\\frac ba$, produto $\\frac ca$.\n\n**Inequações:** resolvem-se como equações, mas, ao multiplicar ou dividir por número **negativo**, inverte-se o sinal da desigualdade.\n\nDica: defina as incógnitas por escrito ("seja $x$ o preço do ingresso adulto") antes de montar as equações.`,
    situations: "Preços de produtos, idades, misturas, áreas com dimensões desconhecidas, lucro mínimo, limite de orçamento.",
    formulas: [
      { tex: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}", meaning: "Fórmula de Bhaskara.", conditions: "$\\Delta\\ge0$ para raízes reais." },
      { tex: "x_1+x_2=-\\frac ba\\qquad x_1x_2=\\frac ca", meaning: "Soma e produto das raízes.", conditions: "" },
    ],
    examples: [
      { title: "Sistema", problem: "2 ingressos adultos e 3 infantis custam R$ 70; 1 adulto e 2 infantis custam R$ 40. Quanto custa cada um?", solution: "$2a+3c=70$ e $a+2c=40$. Da segunda, $a=40-2c$. Então $80-4c+3c=70\\Rightarrow c=10$ e $a=20$." },
      { title: "2º grau", problem: "Um terreno retangular tem lados $x$ e $x+4$ e área $45\\ \\text{m}^2$. Quanto mede $x$?", solution: "$x^2+4x-45=0$; $\\Delta=16+180=196$; $x=\\frac{-4+14}{2}=5$ (a raiz negativa é descartada)." },
      { title: "Inequação", problem: "Resolva $-2x+6>0$.", solution: "$-2x>-6\\Rightarrow x<3$ (inverteu o sinal ao dividir por $-2$)." },
    ],
    commonErrors: ["Não inverter a desigualdade ao dividir por número negativo.", "Aceitar raiz negativa para medida.", "Errar o sinal de $-b$ em Bhaskara.", "Montar a equação sem definir as incógnitas."],
    summary: ["Defina incógnitas, monte, resolva, confira no contexto.", "Bhaskara: cuide dos sinais.", "Multiplicar por negativo inverte a desigualdade."],
    recall: [
      { q: "Qual a soma das raízes de $x^2-7x+10=0$?", a: "7 (e o produto é 10; as raízes são 2 e 5)." },
      { q: "Resolva $3x-5=10$.", a: "$x=5$." },
      { q: "O que significa $\\Delta<0$?", a: "Não há raízes reais." },
    ],
    related: ["Equações"], sources: [matriz, autoria], reviewedAt, status: "publicado",
  },
];
