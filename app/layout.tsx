import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kit Reta Final ENEM 2026 | Desbloqueia Enem",
  description: "Uma estrutura objetiva para organizar sua revisão final para o ENEM 2026.",
  openGraph: { title: "Kit Reta Final ENEM 2026", description: "Organize sua revisão final com mais clareza.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
