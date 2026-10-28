import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mysqlPool } from "./mysql";
import { studyDate, levelFor, summarizeStudyDays } from "./gamification-rules";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export const GAMIFICATION_RULE_VERSION = "2026-10-27-v2";
const XP_BY_EVENT = { assessment_completed: 25, reading_completed: 10, study_task_completed: 15 } as const;
export type GamificationEventType = keyof typeof XP_BY_EVENT;
export type RewardResult = "awarded" | "duplicate" | "ineligible" | "unavailable";

/** Revalidates completion server-side; a client request never proves eligibility. */
export async function recordGamificationEvent(userId: string, type: GamificationEventType, sourceId: string): Promise<RewardResult> {
  if (!sourceId) return "ineligible";
  try {
    const pool = mysqlPool();
    const checks = {
      assessment_completed: "SELECT collection_id,activity,completed_at FROM assessment_attempts WHERE id=? AND user_id=? AND total>0 LIMIT 1",
      reading_completed: "SELECT p.material_id FROM reading_progress p JOIN materials m ON m.id=p.material_id WHERE p.material_id=? AND p.user_id=? AND p.page>=m.pages AND m.published=TRUE LIMIT 1",
      study_task_completed: "SELECT id FROM study_progress WHERE id=? AND user_id=? AND done=TRUE LIMIT 1",
    };
    const [rows] = await pool.query<RowDataPacket[]>(checks[type], [sourceId, userId]);
    if (!rows[0]) return "ineligible";
    const rewardSource = type === "assessment_completed"
      ? `${rows[0].collection_id || rows[0].activity}:${studyDate(new Date(rows[0].completed_at))}`
      : type === "study_task_completed" ? studyDate(new Date()) : sourceId;
    const key = `${type}:${createHash("sha256").update(rewardSource).digest("hex")}`;
    const [legacy] = await pool.query<RowDataPacket[]>("SELECT id FROM gamification_events WHERE user_id=? AND event_key=? LIMIT 1", [userId, `${type}:${sourceId}`]);
    if (legacy.length) return "duplicate";
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT IGNORE INTO gamification_events (id,user_id,event_key,event_type,source_id,xp,rule_version) VALUES (?,?,?,?,?,?,?)",
      [randomUUID(), userId, key, type, sourceId, XP_BY_EVENT[type], GAMIFICATION_RULE_VERSION],
    );
    return result.affectedRows === 1 ? "awarded" : "duplicate";
  } catch (error) {
    console.error("gamification_event_unavailable", { code: (error as { code?: string }).code || "unknown" });
    return "unavailable";
  }
}

export async function gamificationSummary(userId: string) {
  const today = studyDate(new Date());
  const empty = { available: false, xp: 0, level: 1, nextLevelXp: 100, events: 0, studyDays: 0, activeDays: 0, streak: 0, dailyTarget: 1, weeklyTarget: 5, todayEvents: 0, weekEvents: 0, today, ruleVersion: GAMIFICATION_RULE_VERSION };
  try {
    const pool = mysqlPool();
    const [totals] = await pool.query<RowDataPacket[]>("SELECT COALESCE(SUM(xp),0) xp,COUNT(*) events FROM gamification_events WHERE user_id=?", [userId]);
    const [dates] = await pool.query<RowDataPacket[]>("SELECT DATE_FORMAT(CONVERT_TZ(occurred_at,'+00:00','-03:00'),'%Y-%m-%d') day,COUNT(*) events FROM gamification_events WHERE user_id=? GROUP BY day", [userId]);
    const [goals] = await pool.query<RowDataPacket[]>("SELECT daily_target,weekly_target FROM gamification_goals WHERE user_id=? LIMIT 1", [userId]);
    const xp = Number(totals[0]?.xp || 0);
    const days = summarizeStudyDays(dates.map((row) => String(row.day)), today);
    const weekStart = new Date(`${today}T12:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
    const monday = weekStart.toISOString().slice(0, 10);
    return { ...empty, available: true, xp, ...levelFor(xp), events: Number(totals[0]?.events || 0), ...days, activeDays: days.studyDays, dailyTarget: Number(goals[0]?.daily_target || 1), weeklyTarget: Number(goals[0]?.weekly_target || 5), todayEvents: dates.filter((row) => String(row.day) === today).reduce((sum, row) => sum + Number(row.events), 0), weekEvents: dates.filter((row) => String(row.day) >= monday && String(row.day) <= today).reduce((sum, row) => sum + Number(row.events), 0) };
  } catch (error) {
    console.error("gamification_summary_unavailable", { code: (error as { code?: string }).code || "unknown" });
    return empty;
  }
}
