export function studyDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function levelFor(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  const level = Math.floor(safe / 100) + 1;
  return { level, nextLevelXp: level * 100 };
}

export function summarizeStudyDays(days: string[], today: string) {
  const unique = [...new Set(days)].sort();
  const date = new Date(`${today}T12:00:00Z`);
  const recent = new Set(unique);
  let streak = 0;
  if (!recent.has(today)) date.setUTCDate(date.getUTCDate() - 1);
  while (recent.has(date.toISOString().slice(0, 10))) {
    streak++;
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return { studyDays: unique.length, streak };
}

