import Link from "next/link";
import { Footer, Header } from "../components/site";

export const metadata = {
  title: "Página não encontrada | GoDev Education",
  description: "A página solicitada não faz parte do cronograma atual da GoDev Education.",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="conteudo" className="not-found-page container">
        <div className="not-found-illustration" aria-hidden="true">404</div>
        <span className="landing-eyebrow">GoDev Education</span>
        <h1>Esta página saiu do cronograma.</h1>
        <p>O endereço pode ter mudado. Volte ao início ou conheça os planos disponíveis.</p>
        <div className="not-found-actions">
          <Link className="ref-button ref-button-primary" href="/">Voltar ao início</Link>
          <Link className="ref-button ref-button-link" href="/landing#planos">Ver planos</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

