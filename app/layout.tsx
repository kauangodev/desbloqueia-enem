import type { Metadata } from "next";
import "./globals.css";
import { appUrl } from "../lib/config";
import Analytics from "../components/analytics";

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
    images: ["/covers/kit.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
