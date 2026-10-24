import Link from "next/link";

type ActivityCatalogItem = {
  id: string;
  title: string;
  count: number;
  areas: string[];
  href: string;
  eyebrow: string;
  supportingText: string;
};

const areaTone: Record<string, string> = {
  Linguagens: "catalog-chip-linguagens",
  "Ciências Humanas": "catalog-chip-humanas",
  "Ciências da Natureza": "catalog-chip-natureza",
  Matemática: "catalog-chip-matematica",
};

export default function ActivityCatalog({
  kind,
  items,
}: {
  kind: "exercicios" | "simulados";
  items: ActivityCatalogItem[];
}) {
  const isSimulation = kind === "simulados";
  const totalQuestions = items.reduce((sum, item) => sum + item.count, 0);
  const areas = [...new Set(items.flatMap((item) => item.areas))];

  return (
    <section className="activity-catalog" aria-labelledby="activity-catalog-title">
      <div className="activity-catalog-overview">
        <div>
          <span className="eyebrow">{isSimulation ? "Prática completa" : "Prática guiada"}</span>
          <h2 id="activity-catalog-title">
            {isSimulation ? "Escolha um simulado para começar" : "Escolha uma lista para praticar"}
          </h2>
          <p>
            {isSimulation
              ? "Faça uma sessão com foco e acompanhe sua evolução na área de correções."
              : "Sessões curtas e organizadas por tema para você avançar sem se perder."}
          </p>
        </div>
        <div className="activity-catalog-stats" aria-label="Resumo do conteúdo">
          <div><strong>{items.length}</strong><span>{isSimulation ? "simulados" : "listas"}</span></div>
          <div><strong>{totalQuestions}</strong><span>questões</span></div>
          <div><strong>{areas.length}</strong><span>áreas</span></div>
        </div>
      </div>
      <div className="activity-catalog-toolbar">
        <span className="catalog-toolbar-label">Áreas cobertas</span>
        <div className="catalog-filters" aria-label="Áreas presentes no conteúdo">
          <span className="catalog-filter active">Todas</span>
          {areas.map((area) => <span className="catalog-filter" key={area}>{area}</span>)}
        </div>
      </div>
      {items.length ? (
        <div className="activity-catalog-grid">
          {items.map((item, index) => (
            <article className="activity-card" key={item.id}>
              <div className="activity-card-topline">
                <span className="activity-card-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="activity-card-type">{item.eyebrow}</span>
              </div>
              <div className="activity-card-copy">
                <h3>{item.title}</h3>
                <p>{item.supportingText}</p>
              </div>
              <div className="activity-card-meta">
                <span><b>{item.count}</b> questões</span>
                <span>{isSimulation ? "Sessão completa" : "Prática objetiva"}</span>
              </div>
              <div className="activity-card-areas">
                {item.areas.map((area) => <span className={areaTone[area] || ""} key={area}>{area}</span>)}
              </div>
              <Link className="activity-card-action" href={item.href}>
                {isSimulation ? "Começar simulado" : "Abrir lista"}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state activity-catalog-empty">
          <h3>Conteúdo em preparação</h3>
          <p>Assim que uma nova sessão for liberada, ela aparecerá aqui.</p>
        </div>
      )}
    </section>
  );
}

