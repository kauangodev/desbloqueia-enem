/**
 * Cartões de revisão espaçada (caixas de Leitner) sobre as fichas de fórmulas.
 * Caixa 0 = nova/errada hoje; cada acerto sobe uma caixa e adia a próxima revisão; errar volta à caixa 0.
 */
export type FlashGrade = "again" | "good" | "easy";
export type FlashState = { box: number; due: string; reviews: number; lapses: number };

export const FLASH_INTERVALS = [0, 1, 3, 7, 14, 30] as const;
export const FLASH_MAX_BOX = FLASH_INTERVALS.length - 1;

const addDays = (iso: string, amount: number) => {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export function nextFlash(current: FlashState | null, grade: FlashGrade, today: string): FlashState {
  const base: FlashState = current ?? { box: 0, due: today, reviews: 0, lapses: 0 };
  const box = grade === "again" ? 0 : Math.min(FLASH_MAX_BOX, base.box + (grade === "easy" ? 2 : 1));
  return { box, due: addDays(today, FLASH_INTERVALS[box] || 0), reviews: base.reviews + 1, lapses: base.lapses + (grade === "again" ? 1 : 0) };
}

/** Cartão sem estado é "novo"; com estado, vence quando a data já chegou. */
export const isDue = (state: FlashState | null | undefined, today: string) => !state || state.due <= today;

export function deck<T extends { id: string }>(cards: T[], states: Record<string, FlashState>, today: string, limit = 20) {
  const due = cards.filter((card) => states[card.id] && isDue(states[card.id], today)).sort((a, b) => states[a.id].due.localeCompare(states[b.id].due) || states[a.id].box - states[b.id].box);
  const fresh = cards.filter((card) => !states[card.id]);
  const queue = [...due, ...fresh].slice(0, limit);
  return { queue, due: due.length, fresh: fresh.length, learned: cards.filter((card) => states[card.id] && states[card.id].box >= 3).length };
}
