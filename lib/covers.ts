/**
 * Capas autorais da biblioteca 3D da hero ("Revisão ENEM").
 * São representações visuais de temas de revisão da plataforma: não são livros físicos nem publicações à venda.
 * Texto composto de forma determinística em SVG (sem imagens externas, sem fontes da web), uma única fonte de verdade
 * para a composição estática (HTML/SVG) e para as texturas WebGL.
 * Os temas foram conferidos com os módulos publicados em `data/operacao/modules*.ts`.
 */
export type CoverDiscipline = "matematica" | "fisica" | "quimica" | "biologia";

export type CoverDef = {
  id: string;
  discipline: CoverDiscipline;
  /** Linhas do título (quebra manual: sem erros de escrita nem de quebra). */
  lines: string[];
  /** Módulos reais que a capa representa (documentação e teste). */
  modules: string[];
  motif: string;
};

export const disciplineStyle: Record<CoverDiscipline, { label: string; from: string; to: string; accent: string; spine: string }> = {
  matematica: { label: "Matemática", from: "#0b5d57", to: "#083a3f", accent: "#7df2c8", spine: "#06302f" },
  fisica: { label: "Física", from: "#24428f", to: "#14264f", accent: "#8ec5ff", spine: "#0e1b3a" },
  quimica: { label: "Química", from: "#8a3b14", to: "#4d2008", accent: "#ffc78a", spine: "#391a07" },
  biologia: { label: "Biologia", from: "#3b6a16", to: "#1f3d0c", accent: "#d3f56a", spine: "#172d09" },
};

export const covers: CoverDef[] = [
  { id: "mat-proporcao", discipline: "matematica", lines: ["Proporção e", "porcentagem"], modules: ["Razão, proporção, regra de três e escalas", "Porcentagem e variações percentuais"], motif: "percent" },
  { id: "mat-graficos", discipline: "matematica", lines: ["Gráficos e", "estatística"], modules: ["Leitura de gráficos e tabelas", "Média, mediana, moda e dispersão"], motif: "bars" },
  { id: "mat-geometria", discipline: "matematica", lines: ["Geometria"], modules: ["Geometria plana, semelhança e trigonometria básica", "Geometria espacial: volumes e áreas de sólidos"], motif: "triangle" },
  { id: "mat-funcoes", discipline: "matematica", lines: ["Funções e", "probabilidade"], modules: ["Funções afim e quadrática", "Probabilidade"], motif: "parabola" },
  { id: "fis-eletricidade", discipline: "fisica", lines: ["Eletricidade", "e circuitos"], modules: ["Eletricidade, circuitos e consumo de energia"], motif: "bolt" },
  { id: "fis-energia", discipline: "fisica", lines: ["Energia e", "potência"], modules: ["Dinâmica, trabalho, energia e potência"], motif: "gauge" },
  { id: "fis-ondas", discipline: "fisica", lines: ["Ondas e", "óptica"], modules: ["Ondas, som e óptica geométrica"], motif: "wave" },
  { id: "fis-calor", discipline: "fisica", lines: ["Calor e", "movimento"], modules: ["Termologia: calor, temperatura e dilatação", "Cinemática: movimento uniforme e uniformemente variado"], motif: "thermo" },
  { id: "qui-estequiometria", discipline: "quimica", lines: ["Estequiometria"], modules: ["Estequiometria"], motif: "scale" },
  { id: "qui-solucoes", discipline: "quimica", lines: ["Soluções e", "concentração"], modules: ["Soluções: concentração e diluição"], motif: "beaker" },
  { id: "qui-organica", discipline: "quimica", lines: ["Química", "orgânica"], modules: ["Química orgânica: funções, cadeias e isomeria"], motif: "hexagon" },
  { id: "qui-energia", discipline: "quimica", lines: ["Termoquímica e", "eletroquímica"], modules: ["Termoquímica: entalpia e energia das reações", "Eletroquímica: pilhas e eletrólise"], motif: "reaction" },
  { id: "bio-ecologia", discipline: "biologia", lines: ["Ecologia"], modules: ["Ecologia: relações, cadeias e teias alimentares"], motif: "leaf" },
  { id: "bio-genetica", discipline: "biologia", lines: ["Genética"], modules: ["Genética e hereditariedade", "Biotecnologia, DNA e genética molecular"], motif: "dna" },
  { id: "bio-citologia", discipline: "biologia", lines: ["Citologia e", "metabolismo"], modules: ["Citologia: células, membrana e organelas", "Bioenergética: fotossíntese e respiração celular"], motif: "cell" },
  { id: "bio-evolucao", discipline: "biologia", lines: ["Evolução", "e saúde"], modules: ["Evolução e seleção natural", "Microbiologia, parasitoses e saúde pública"], motif: "tree" },
];

/** Ordem da fileira: intercala as 4 disciplinas (M, F, Q, B, M, F, Q, B…) para distribuição equilibrada. */
export const interleaved: CoverDef[] = [0, 1, 2, 3].flatMap((n) => (["matematica", "fisica", "quimica", "biologia"] as const).map((d) => covers.filter((c) => c.discipline === d)[n]));

export const COVER_W = 384;
export const COVER_H = 576;
export const SPINE_W = 96;

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Motivos técnicos discretos (caixa 200×200, traço apenas). */
const motifs: Record<string, string> = {
  percent: '<circle cx="58" cy="58" r="22"/><circle cx="142" cy="142" r="22"/><path d="M152 46 48 154"/>',
  bars: '<path d="M30 170h150M30 170V30"/><rect x="48" y="110" width="22" height="60"/><rect x="86" y="80" width="22" height="90"/><rect x="124" y="52" width="22" height="118"/><path d="M40 96 80 66l40-22 50-18"/>',
  triangle: '<path d="M100 28 30 164h140Z"/><path d="M100 28v136"/><path d="M100 164v-18h18"/><path d="M30 164a34 34 0 0 1 10-24"/>',
  parabola: '<path d="M26 28v146h150"/><path d="M40 52C70 190 130 190 170 52"/><circle cx="62" cy="120" r="6"/><circle cx="105" cy="150" r="6"/><circle cx="150" cy="120" r="6"/>',
  bolt: '<path d="M112 22 52 112h44l-10 66 62-92h-44Z"/>',
  gauge: '<path d="M28 150a72 72 0 0 1 144 0"/><path d="M100 150 142 98"/><circle cx="100" cy="150" r="9"/><path d="M40 150h12M148 150h12M100 78v12"/>',
  wave: '<path d="M16 100c22-70 40-70 60 0s38 70 60 0 30-48 48-24"/><path d="M24 160h152M24 40h40"/>',
  thermo: '<rect x="86" y="24" width="28" height="110" rx="14"/><circle cx="100" cy="152" r="26"/><path d="M100 60v90M130 56h22M130 84h22M130 112h22"/>',
  scale: '<path d="M100 30v128M60 168h80M44 64h112"/><path d="M44 64 22 116h44ZM156 64l-22 52h44Z"/><circle cx="100" cy="30" r="6"/>',
  beaker: '<path d="M72 28h56M80 28v54L36 166h128L120 82V28"/><path d="M58 126h84"/><path d="M86 146h.01M112 148h.01M100 108h.01"/>',
  hexagon: '<path d="M100 28 162 64v72l-62 36-62-36V64Z"/><circle cx="100" cy="100" r="28"/><path d="M162 64l24-14M38 136l-24 14"/>',
  reaction: '<path d="M30 78h120M128 56l24 22-24 22"/><path d="M170 134H50M72 112l-24 22 24 22"/>',
  leaf: '<path d="M100 176C30 146 36 62 100 26c64 36 70 120 0 150Z"/><path d="M100 176V70M100 120 70 96M100 104l30-24"/>',
  dna: '<path d="M64 20c92 44 92 116 0 160"/><path d="M136 20c-92 44-92 116 0 160"/><path d="M82 48h36M70 100h60M82 152h36"/>',
  cell: '<circle cx="100" cy="100" r="74"/><circle cx="86" cy="92" r="26"/><ellipse cx="136" cy="126" rx="16" ry="10"/><ellipse cx="70" cy="140" rx="12" ry="8"/><circle cx="136" cy="68" r="6"/>',
  tree: '<path d="M100 180v-70M100 110 54 70M100 110l46-40M54 70 34 34M54 70l22-36M146 70l-22-36M146 70l22-36"/><circle cx="34" cy="34" r="5"/><circle cx="76" cy="34" r="5"/><circle cx="124" cy="34" r="5"/><circle cx="168" cy="34" r="5"/>',
};

const FONT = "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function coverSvg(cover: CoverDef): string {
  const s = disciplineStyle[cover.discipline];
  const titleY = 196;
  const title = cover.lines.map((line, i) => `<text x="36" y="${titleY + i * 54}" font-size="46" font-weight="800" fill="#fff" letter-spacing="-1">${esc(line)}</text>`).join("");
  const motifTop = 292 + Math.max(0, cover.lines.length - 1) * 18;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}" width="${COVER_W}" height="${COVER_H}" font-family="${FONT}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.from}"/><stop offset="1" stop-color="${s.to}"/></linearGradient></defs>` +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="url(#g)"/>` +
    `<rect x="14" y="14" width="${COVER_W - 28}" height="${COVER_H - 28}" rx="6" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>` +
    `<text x="36" y="66" font-size="26" font-weight="800" fill="#fff" fill-opacity=".92">GoDev</text>` +
    `<rect x="${COVER_W - 176}" y="40" width="140" height="34" rx="17" fill="none" stroke="${s.accent}" stroke-width="2"/>` +
    `<text x="${COVER_W - 106}" y="63" font-size="15" font-weight="700" fill="${s.accent}" text-anchor="middle" letter-spacing="1">REVISÃO ENEM</text>` +
    `<text x="36" y="136" font-size="20" font-weight="700" fill="${s.accent}" letter-spacing="3">${esc(s.label.toUpperCase())}</text>` +
    title +
    `<g transform="translate(92 ${motifTop})" fill="none" stroke="${s.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9">${motifs[cover.motif] ?? ""}</g>` +
    `<path d="M36 ${COVER_H - 64}h${COVER_W - 72}" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>` +
    `<text x="36" y="${COVER_H - 34}" font-size="16" font-weight="600" fill="#fff" fill-opacity=".72">Reta final · 2º dia</text>` +
    `</svg>`
  );
}

export function spineSvg(cover: CoverDef): string {
  const s = disciplineStyle[cover.discipline];
  const label = cover.lines.join(" ");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPINE_W} ${COVER_H}" width="${SPINE_W}" height="${COVER_H}" font-family="${FONT}">` +
    `<rect width="${SPINE_W}" height="${COVER_H}" fill="${s.spine}"/>` +
    `<rect x="0" y="0" width="10" height="${COVER_H}" fill="${s.accent}" fill-opacity=".85"/>` +
    `<rect x="${SPINE_W - 4}" width="4" height="${COVER_H}" fill="#000" fill-opacity=".25"/>` +
    `<text transform="translate(58 ${COVER_H - 40}) rotate(-90)" font-size="30" font-weight="800" fill="#fff" letter-spacing="-.5">${esc(label)}</text>` +
    `<text x="48" y="44" font-size="15" font-weight="800" fill="${s.accent}" text-anchor="middle">GoDev</text>` +
    `</svg>`
  );
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
