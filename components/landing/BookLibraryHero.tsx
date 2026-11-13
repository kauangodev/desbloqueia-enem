import { bookSequence } from "../../lib/hero-books";

/**
 * Biblioteca da hero com as capas reais dos materiais. Animação 100% CSS (transform/opacity, composta na GPU):
 * as capas entram em sequência e flutuam suavemente. Sem WebGL e sem JavaScript extra, então rola e responde fluido
 * em qualquer celular; com movimento reduzido ela fica parada. Elemento decorativo, fora da árvore de acessibilidade.
 */
const books = bookSequence(5); // frente → fundo: Matemática, Física, Química, Biologia, Matemática

export default function BookLibraryHero() {
  return (
    <div className="hl" data-mode="static">
      <div className="hl-stage" aria-hidden="true">
        <div className="hl-glow" />
        <div className="hl-static">
          {books.map((book, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={index} className="hl-book" style={{ ["--i" as string]: index } as React.CSSProperties} src={book.cover320} srcSet={`${book.cover320} 320w, ${book.cover640} 640w`} sizes="(min-width: 900px) 230px, 40vw" alt="" width={640} height={960} loading="eager" fetchPriority="low" decoding="async" draggable={false} />
          ))}
        </div>
      </div>
      <p className="hl-caption">Materiais da GoDev para revisar Matemática e Natureza.</p>
    </div>
  );
}
