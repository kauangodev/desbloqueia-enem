import type { ReactNode } from "react";

/**
 * Ilustrações vetoriais da landing (SVG inline): nítidas em qualquer densidade de tela, sem arquivo de imagem, sem requisição extra e
 * sem texto embutido. Cores vêm dos tokens (--v2-*), então valem nos dois temas.
 */
const Frame = ({ children, label }: { children: ReactNode; label?: string }) => (
  <svg viewBox="0 0 320 180" width="320" height="180" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" preserveAspectRatio="xMidYMid slice">{children}</svg>
);

export function ArtMath() {
  return (
    <Frame>
      <rect width="320" height="180" fill="var(--art-bg-a)" />
      <g stroke="var(--art-line)" strokeWidth="1" opacity=".55">{[40, 80, 120, 160, 200, 240, 280].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="180" />)}{[30, 60, 90, 120, 150].map((y) => <line key={y} x1="0" y1={y} x2="320" y2={y} />)}</g>
      <path d="M20 150 C90 150 110 30 170 30 S250 120 300 40" fill="none" stroke="var(--art-ink)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="170" cy="30" r="9" fill="var(--art-accent)" stroke="var(--art-ink)" strokeWidth="3" />
      <g fill="none" stroke="var(--art-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".9"><path d="M48 60h30M63 45v30" /><path d="M244 130h34" /><path d="M244 150h34" /></g>
    </Frame>
  );
}

export function ArtScience() {
  const hex = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, i) => `${cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6)},${cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)}`).join(" ");
  return (
    <Frame>
      <rect width="320" height="180" fill="var(--art-bg-b)" />
      <g fill="none" stroke="var(--art-ink)" strokeWidth="4" strokeLinejoin="round"><polygon points={hex(120, 92, 44)} /><polygon points={hex(197, 92, 44)} /><path d="M120 48V22M197 136v26" /></g>
      <g fill="var(--art-accent)" stroke="var(--art-ink)" strokeWidth="4"><circle cx="120" cy="18" r="10" /><circle cx="197" cy="166" r="10" /><circle cx="163" cy="92" r="9" /></g>
      <g fill="none" stroke="var(--art-line)" strokeWidth="3" strokeLinecap="round" opacity=".7"><path d="M250 30c20 22-20 40 0 62s-20 40 0 62" /><path d="M276 30c-20 22 20 40 0 62s20 40 0 62" /></g>
    </Frame>
  );
}

export function ArtReview() {
  return (
    <Frame>
      <rect width="320" height="180" fill="var(--art-bg-c)" />
      <g fill="var(--art-card)" stroke="var(--art-ink)" strokeWidth="4"><rect x="60" y="30" width="200" height="124" rx="14" /></g>
      <path d="M60 64h200" stroke="var(--art-ink)" strokeWidth="4" />
      <g stroke="var(--art-ink)" strokeWidth="5" strokeLinecap="round"><path d="M104 20v22M216 20v22" /></g>
      {[0, 1, 2, 3, 4].map((c) => [0, 1].map((r) => (
        <circle key={`${c}${r}`} cx={96 + c * 32} cy={92 + r * 34} r="9" fill={(c + r) % 3 === 0 ? "var(--art-accent)" : "none"} stroke="var(--art-ink)" strokeWidth="3" />
      )))}
      <path d="M92 92l5 5 9-10" fill="none" stroke="var(--art-ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

const TILES: Record<string, ReactNode> = {
  trilha: <path d="M10 52c14-16 14-30 28-30s14 24 28 22 12-14 24-24M12 14h10v10H12zM76 52h10v10H76z" />,
  resolucao: <path d="M12 16h64v38H36L18 66V54h-6zM26 30h36M26 42h24" />,
  erros: <path d="M16 60V28M40 60V12M64 60V40M12 66h60" />,
  revisao: <path d="M72 30A28 28 0 1 0 66 56M72 12v18H54M44 26v20l12 8" />,
};
export function ArtTile({ kind }: { kind: keyof typeof TILES }) {
  return (
    <svg viewBox="0 0 96 80" width="96" height="80" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{TILES[kind]}</svg>
  );
}
