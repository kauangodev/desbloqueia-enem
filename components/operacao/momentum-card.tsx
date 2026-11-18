import type { Momentum } from "../../lib/operacao/momentum";

const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "narrow" });

/** Sequência, nível e missões do dia. Só leitura: tudo vem de ações já registradas (ver lib/operacao/momentum.ts). */
export default function MomentumCard({ data }: { data: Momentum }) {
  const levelPct = Math.round((data.levelProgress / data.levelSize) * 100);
  return (
    <section className="op-card op-momentum" aria-labelledby="op-momentum-t">
      <h3 id="op-momentum-t" className="op-sr">Seu ritmo de estudo</h3>
      <div className="op-mom-top">
        <div className="op-mom-streak" aria-label={`Sequência de ${data.streak} ${data.streak === 1 ? "dia" : "dias"} de estudo`}>
          <span className={`op-mom-flame${data.streak > 0 ? " is-on" : ""}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2c.6 3.2-1.5 4.6-3 6.5C7.4 10.5 6 12.4 6 15a6 6 0 0 0 12 0c0-2.4-1.2-4.1-2.4-5.5-.6 1.4-1.5 2.2-2.4 2.5.9-3.4.3-6.8-1.2-10Z" /></svg>
          </span>
          <div><strong>{data.streak}</strong><span>{data.streak === 1 ? "dia seguido" : "dias seguidos"}</span></div>
        </div>
        <div className="op-mom-level">
          <div className="op-mom-level-head"><strong>Nível {data.level}</strong><span>{data.xp} XP no total</span></div>
          <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={data.levelSize} aria-valuenow={data.levelProgress} aria-label={`Progresso para o nível ${data.level + 1}`}><i style={{ width: `${levelPct}%` }} /></span>
          <small className="op-muted">Faltam {data.nextLevelXp - data.xp} XP para o nível {data.level + 1}. XP vale só na 1ª tentativa de cada questão.</small>
        </div>
      </div>
      <ol className="op-mom-week" aria-label="Estudo nos últimos 7 dias">
        {data.week.map((day) => (
          <li key={day.date} className={`${day.studied ? "is-done" : ""}${day.today ? " is-today" : ""}`}>
            <span aria-hidden="true">{weekday.format(new Date(`${day.date}T12:00:00Z`)).toUpperCase()}</span>
            <i aria-hidden="true">{day.studied ? "✓" : ""}</i>
            <span className="op-sr">{day.date.split("-").reverse().join("/")}: {day.studied ? "estudou" : "sem estudo"}{day.today ? " (hoje)" : ""}</span>
          </li>
        ))}
      </ol>
      <div className="op-mom-missions">
        <h4>Missões de hoje <small>{data.missionsDone}/{data.missions.length}</small></h4>
        <ul>
          {data.missions.map((mission) => (
            <li key={mission.id} className={mission.done ? "is-done" : ""}>
              <span className="op-mom-check" aria-hidden="true">{mission.done ? "✓" : ""}</span>
              <div>
                <strong>{mission.title}</strong>
                <small className="op-muted">{mission.done ? "Concluída" : `${mission.progress}/${mission.target} · ${mission.detail}`}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
