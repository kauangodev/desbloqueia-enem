import type { Metadata } from "next";
import { Caveat, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { appUrl } from "../lib/config";
import Analytics from "../components/analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-inter-tight",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Desbloqueia ENEM 2026 | GoDev Education",
  description:
    "Sua reta final do ENEM, organizada em um só lugar. Materiais, revisão e prática por GoDev Education.",
  openGraph: {
    title: "Desbloqueia ENEM 2026 | GoDev Education",
    description: "Sua reta final, organizada em um só lugar.",
    type: "website",
    locale: "pt_BR",
    siteName: "GoDev Education",
    images: ["/covers/enem-2026/16-redacao.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${interTight.variable} ${caveat.variable}`}>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
