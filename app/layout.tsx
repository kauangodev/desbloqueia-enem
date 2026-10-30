import type { Metadata } from "next";
import { Suspense } from "react";
import { Caveat, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import "./navigation-finish.css";
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
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const c=localStorage.getItem('godev-theme')||'system';const d=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.themeChoice=c;document.documentElement.dataset.theme=c==='system'?d:c}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.themeChoice='system'}`,
          }}
        />
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}


