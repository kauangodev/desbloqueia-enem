import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { mysqlPool } from "../../../lib/mysql";

const events = new Set(["view", "start", "answer", "next", "back", "complete", "abandon", "skip", "plans"]);

async function ensureTable() {
  await mysqlPool().query(`CREATE TABLE IF NOT EXISTS quiz_events (
    event_id VARCHAR(80) PRIMARY KEY,
    event_name VARCHAR(24) NOT NULL,
    question_index TINYINT UNSIGNED NULL,
    session_hash CHAR(64) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX quiz_events_event_idx (event_name, created_at),
    INDEX quiz_events_question_idx (question_index, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { event?: string; eventId?: string; questionIndex?: number; sessionHash?: string; metadata?: Record<string, string> };
    const event = String(body.event || "").trim().toLowerCase();
    if (!events.has(event)) return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
    const eventId = String(body.eventId || randomUUID()).slice(0, 80);
    const questionIndex = Number.isInteger(body.questionIndex) && Number(body.questionIndex) >= 0 && Number(body.questionIndex) < 8 ? Number(body.questionIndex) : null;
    const sessionHash = typeof body.sessionHash === "string" && /^[a-f0-9]{64}$/.test(body.sessionHash) ? body.sessionHash : null;
    const metadata = body.metadata && typeof body.metadata === "object" ? JSON.stringify(Object.fromEntries(Object.entries(body.metadata).slice(0, 6).map(([key, value]) => [key.slice(0, 32), String(value).slice(0, 80)]))) : null;
    await ensureTable();
    await mysqlPool().query("INSERT IGNORE INTO quiz_events (event_id,event_name,question_index,session_hash,metadata) VALUES (?,?,?,?,?)", [eventId, event, questionIndex, sessionHash, metadata]);
    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never block the public landing page.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}

