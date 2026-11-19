import { THEME_BOOT_SCRIPT } from "../lib/theme";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import "./ui-finish.css";
import "./reference-redesign.css";
import "./reformulation.css";
import "./final-ui.css";
import "./master-fix.css";
import "./godev-release.css";
import "./modern-interface.css";
import "./tokens.css";
import "./godev-theme.css";
import "./godev-layout.css";
import "./godev-shell.css";
import "./godev-study.css";
import "./godev-carousel.css";
import "./godev-hero.css";
import "./godev-operacao.css";
import "./godev-refine.css";
import "./godev-campaign.css";
import "./godev-books.css";
import "./godev-explorer.css";
import "./public-theme.css";
import "./brand-v2.css";
import "./portal-v2.css";
import "./admin-v2.css";
import { appUrl } from "../lib/config";
import Analytics from "../components/analytics";
import ThemeSync from "../components/theme-sync";

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--godev-font-body",
  fallback: ["system-ui", "sans-serif"],
});

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--godev-font-display",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Desbloqueia ENEM 2027 | GoDev Education",
  description:
    "Sua preparação para o ENEM 2027, passo a passo: trilha, questões e revisão em um só lugar. GoDev Education.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Desbloqueia ENEM 2027 | GoDev Education",
    description: "Sua preparação para o ENEM 2027, passo a passo.",
    type: "website",
    locale: "pt_BR",
    siteName: "GoDev Education",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "GoDev Education — preparação para o ENEM 2027" }],
  },
  twitter: { card: "summary_large_image", title: "GoDev Education | ENEM 2027", description: "Sua preparação para o ENEM 2027, organizada com método e clareza.", images: ["/og.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="godev-app">
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <ThemeSync />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}





