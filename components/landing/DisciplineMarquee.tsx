const disciplines = [
  "Linguagens",
  "Ciências Humanas",
  "Ciências da Natureza",
  "Matemática",
  "Redação",
];

export function DisciplineMarquee() {
  return (
    <section className="discipline-strip" aria-label="Áreas de estudo">
      <ul className="sr-only">
        {disciplines.map((discipline) => (
          <li key={discipline}>{discipline}</li>
        ))}
      </ul>
      <div className="discipline-marquee" aria-hidden="true">
        <div className="discipline-track" data-discipline-track>
          {[0, 1].map((group) => (
            <div className="discipline-group" key={group}>
              {disciplines.map((discipline) => (
                <span key={`${group}-${discipline}`}>
                  {discipline}
                  <i />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
