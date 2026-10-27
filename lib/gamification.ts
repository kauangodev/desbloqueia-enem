import "server-only";
import { randomUUID } from "node:crypto";
import { mysqlPool } from "./mysql";
import type { RowDataPacket } from "mysql2/promise";

export const GAMIFICATION_RULE_VERSION = "2026-10-27";
const XP_BY_EVENT = {
  assessment_completed: 25,
  reading_completed: 10,
  study_task_completed: 15,
} as const;
export type GamificationEventType = keyof typeof XP_BY_EVENT;

function localDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export async function recordGamificationEvent(
  userId: string,
  type: GamificationEventType,
  sourceId: string,
) {
  if (!sourceId) return false;
  try {
    const pool = mysqlPool();
    const eventKey = `${type}:${sourceId}`;
    const [result] = await pool.query(
      `insert ignore into gamification_events
       (id,user_id,event_key,event_type,source_id,xp,rule_version)
       values (?,?,?,?,?,?,?)`,
      [randomUUID(), userId, eventKey, type, sourceId, XP_BY_EVENT[type], GAMIFICATION_RULE_VERSION],
    );
    return Number((result as { affectedRows?: number }).affectedRows || 0) === 1;
  } catch {
    // A migration that has not yet been applied must not break study flows.
    return false;
  }
}

type SummaryRow = RowDataPacket & { xp: number; events: number; studyDays: number };
type GoalRow = RowDataPacket & { daily_target: number; weekly_target: number };

export async function gamificationSummary(userId: string) {
  const empty = { xp: 0, level: 1, nextLevelXp: 100, events: 0, studyDays: 0, activeDays: 0, dailyTarget: 1, weeklyTarget: 5 };
  try {
    const pool = mysqlPool();
    const [rows] = await pool.query<SummaryRow[]>(
      `select coalesce(sum(xp),0) xp, count(*) events,
       count(distinct date(convert_tz(occurred_at,'+00:00','-03:00'))) studyDays
       from gamification_events where user_id = ?`,
      [userId],
    );
    const [goals] = await pool.query<GoalRow[]>(
      "select daily_target, weekly_target from gamification_goals where user_id = ? limit 1",
      [userId],
    );
    const xp = Number(rows[0]?.xp || 0);
    const level = Math.floor(xp / 100) + 1;
    const studyDays = Number(rows[0]?.studyDays || 0);
    return {
      xp,
      level,
      nextLevelXp: level * 100,
      events: Number(rows[0]?.events || 0),
      studyDays,
      activeDays: studyDays,
      dailyTarget: Number(goals[0]?.daily_target || 1),
      weeklyTarget: Number(goals[0]?.weekly_target || 5),
      today: localDate(new Date()),
      ruleVersion: GAMIFICATION_RULE_VERSION,
    };
  } catch {
    return empty;
  }
}

