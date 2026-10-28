import Image from "next/image";
import Link from "next/link";
export type Material = {
  id: string;
  title: string;
  description: string;
  category: string;
  cover: string;
  pages: number;
  plan: string;
  downloadable?: boolean;
};
export default function Resources({ items }: { items: Material[] }) {
  return items.length ? (
    <div className="resource-grid">
      {items.map((m) => (
        <Link className="resource" href={`/aluno/ler/${m.id}`} key={m.id}>
          <div className="resource-cover">
            <Image
              src={m.cover}
              width={200}
              height={283}
              alt={`Capa: ${m.title}`}
            />
          </div>
          <div className="resource-info">
            <h3>{m.title}</h3>
            <p>{m.description}</p>
            <small>
              {m.category} · {m.pages} páginas
            </small>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <h2>Seu acervo está sendo preparado.</h2>
      <p>
        Os materiais publicados para seu plano aparecerão aqui. Se você já
        comprou e não encontrou seu conteúdo, consulte o atendimento.
      </p>
      <Link className="text-link" href="/aluno/suporte">
        Abrir atendimento
      </Link>
    </div>
  );
}
