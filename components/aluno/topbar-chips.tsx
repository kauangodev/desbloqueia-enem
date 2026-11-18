import Link from "next/link";
import type { Momentum } from "../../lib/operacao/momentum";
import { Icon } from "../icons";

/** Indicadores fixos da barra superior: meta do dia, sequência e nível/XP. Só leitura, vindos de ações registradas. */
export default function TopbarChips({ data, dailyGoal }: { data: Momentum; dailyGoal: number }) {
  const done = Math.min(data.answersToday, dailyGoal);
  const pct = Math.round((done / dailyGoal) * 100);
  return (
    <div className="as-chips" aria-label="Seu ritmo de hoje">
      <Link href="/aluno/missoes" className="as-chip as-chip-goal" title="Meta do dia">
        <span className="as-chip-label">Meta do dia</span>
        <span className="as-chip-bar" role="progressbar" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={done} aria-label="Questões da meta de hoje"><i style={{ width: `${pct}%` }} /></span>
        <b>{done}/{dailyGoal}</b>
      </Link>
      <Link href="/aluno/ofensiva" className={`as-chip${data.streak > 0 ? " is-hot" : ""}`} title="Dias seguidos de estudo">
        <Icon name="flame" size={16} aria-hidden="true" /> <b>{data.streak}</b><span className="op-sr"> {data.streak === 1 ? "dia seguido" : "dias seguidos"}</span>
      </Link>
      <Link href="/aluno/dashboard" className="as-chip" title={`${data.xp} XP no total`}>
        <Icon name="zap" size={16} aria-hidden="true" /> <b>Nv {data.level}</b><span className="op-sr"> · {data.xp} XP</span>
      </Link>
    </div>
  );
}
