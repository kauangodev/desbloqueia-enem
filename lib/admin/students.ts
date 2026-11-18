import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../mysql";
import { studyDate } from "../gamification-rules";
import { activityFromRows, frequency, type Frequency } from "./frequency";

/**
 * Leitura do CRM "Alunos e cadastros": parte da tabela `users` (inclui quem nunca comprou), com busca e paginação no servidor.
 * Nunca seleciona hash de senha, tokens ou segredos. Colunas da migração 06 são opcionais: sem elas a lista funciona e mostra "legado".
 */
export type StudentFilter = { q?: string; plan?: string; source?: string; activity?: string; page?: number };
export type StudentRow = {
  id: string; name: string; email: string; createdAt: string; verified: boolean; status: string; source: string;
  tier: "gratis" | "essencial" | "premium"; lastLoginAt: string | null; freq: Frequency;
};

const PAGE = 20;
const KINDS = "('attempt','session','read')";
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
const TIER_SQL = "COALESCE((SELECT MAX(CASE e.plan WHEN 'premium' THEN 2 WHEN 'essencial' THEN 1 ELSE 0 END) FROM entitlements e WHERE e.user_id = u.id AND e.active = TRUE), 0)";

function where(filter: StudentFilter, hasNew: boolean) {
  const parts = ["u.role = 'student'"]; const args: unknown[] = [];
  const q = (filter.q || "").trim().slice(0, 80);
  if (q) { parts.push("(u.email LIKE ? OR u.name LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
  if (filter.plan === "gratis") parts.push(`${TIER_SQL} = 0`);
  if (filter.plan === "essencial") parts.push(`${TIER_SQL} = 1`);
  if (filter.plan === "premium") parts.push(`${TIER_SQL} = 2`);
  if (hasNew && ["email", "google"].includes(filter.source || "")) { parts.push("u.signup_source = ?"); args.push(filter.source); }
  if (filter.source === "legado") parts.push(hasNew ? "u.signup_source IS NULL" : "1=1");
  // Atividade: aproximada pelo `updated_at` do estado de estudo (o cálculo exato de dias ativos é feito por aluno, abaixo).
  if (filter.activity === "7" || filter.activity === "30") { parts.push(`EXISTS (SELECT 1 FROM operacao_state s WHERE s.user_id = u.id AND s.kind IN ${KINDS} AND s.updated_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ${filter.activity === "7" ? 7 : 30} DAY))`); }
  if (filter.activity === "nunca") parts.push(`NOT EXISTS (SELECT 1 FROM operacao_state s WHERE s.user_id = u.id AND s.kind IN ${KINDS})`);
  return { sql: parts.join(" AND "), args };
}

export async function listStudents(filter: StudentFilter): Promise<{ rows: StudentRow[]; total: number; page: number; pageSize: number; migrated: boolean }> {
  const page = Math.max(1, Math.floor(filter.page || 1));
  let migrated = true;
  const run = async (cols: string, hasNew: boolean) => {
    const w = where(filter, hasNew);
    const [count] = await mysqlPool().query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM users u WHERE ${w.sql}`, w.args);
    const [rows] = await mysqlPool().query<RowDataPacket[]>(`SELECT u.id, u.name, u.email, u.created_at, u.email_verified_at, u.account_status, ${cols}, ${TIER_SQL} AS tier FROM users u WHERE ${w.sql} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`, [...w.args, PAGE, (page - 1) * PAGE]);
    return { count: Number(count[0].n), rows };
  };
  let result;
  try { result = await run("u.signup_source, u.last_login_at", true); }
  catch { migrated = false; result = await run("NULL AS signup_source, NULL AS last_login_at", false); }
  const ids = result.rows.map((r) => r.id as string);
  const today = studyDate(new Date());
  const activity = new Map<string, { kind: string; data: unknown }[]>();
  if (ids.length) {
    const [states] = await mysqlPool().query<RowDataPacket[]>(`SELECT user_id, kind, data FROM operacao_state WHERE user_id IN (${ids.map(() => "?").join(",")}) AND kind IN ${KINDS}`, ids);
    for (const s of states) (activity.get(s.user_id) ?? activity.set(s.user_id, []).get(s.user_id)!).push({ kind: s.kind, data: s.data });
  }
  const rows: StudentRow[] = result.rows.map((r) => ({
    id: r.id, name: r.name || "", email: r.email, createdAt: iso(r.created_at) ?? "", verified: Boolean(r.email_verified_at), status: r.account_status || "active",
    source: r.signup_source || "legado", tier: Number(r.tier) === 2 ? "premium" : Number(r.tier) === 1 ? "essencial" : "gratis", lastLoginAt: iso(r.last_login_at),
    freq: frequency(activityFromRows(activity.get(r.id) ?? []), today),
  }));
  return { rows, total: result.count, page, pageSize: PAGE, migrated };
}

export type StudentDetail = StudentRow & { orders: { id: string; tier: string; cents: number; status: string; createdAt: string }[]; entitlements: { orderId: string; plan: string; active: boolean }[]; identities: string[]; byDay: { day: string; active: boolean }[] };

export async function studentDetail(id: string): Promise<StudentDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [u] = await mysqlPool().query<RowDataPacket[]>("SELECT id FROM users WHERE id = ? LIMIT 1", [id]);
  if (!u[0]) return null;
  const one = await listStudentById(id);
  if (!one) return null;
  const [orders] = await mysqlPool().query<RowDataPacket[]>("SELECT id, offer_code, expected_cents, status, created_at FROM pix_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [id]).catch(() => [[] as RowDataPacket[]]);
  const [ents] = await mysqlPool().query<RowDataPacket[]>("SELECT order_id, plan, active FROM entitlements WHERE user_id = ?", [id]);
  const [ids] = await mysqlPool().query<RowDataPacket[]>("SELECT provider FROM auth_identities WHERE user_id = ?", [id]).catch(() => [[] as RowDataPacket[]]);
  const byDay = one.freq.activeDays.slice(-30).map((day) => ({ day, active: true }));
  return {
    ...one,
    orders: orders.map((o) => ({ id: o.id, tier: String(o.offer_code).startsWith("premium") ? "premium" : "essencial", cents: Number(o.expected_cents), status: o.status, createdAt: iso(o.created_at) ?? "" })),
    entitlements: ents.map((e) => ({ orderId: e.order_id, plan: e.plan, active: Boolean(e.active) })),
    identities: ids.map((i) => i.provider), byDay,
  };
}

async function listStudentById(id: string): Promise<StudentRow | null> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>(`SELECT u.id, u.name, u.email, u.created_at, u.email_verified_at, u.account_status, ${TIER_SQL} AS tier FROM users u WHERE u.id = ? LIMIT 1`, [id]);
  const r = rows[0]; if (!r) return null;
  let source: string | null = null; let lastLogin: string | null = null;
  try { const [x] = await mysqlPool().query<RowDataPacket[]>("SELECT signup_source, last_login_at FROM users WHERE id = ?", [id]); source = x[0]?.signup_source ?? null; lastLogin = iso(x[0]?.last_login_at); } catch { /* migração 06 pendente */ }
  const [states] = await mysqlPool().query<RowDataPacket[]>(`SELECT kind, data FROM operacao_state WHERE user_id = ? AND kind IN ${KINDS}`, [id]);
  return { id: r.id, name: r.name || "", email: r.email, createdAt: iso(r.created_at) ?? "", verified: Boolean(r.email_verified_at), status: r.account_status || "active", source: source || "legado", tier: Number(r.tier) === 2 ? "premium" : Number(r.tier) === 1 ? "essencial" : "gratis", lastLoginAt: lastLogin, freq: frequency(activityFromRows(states.map((s) => ({ kind: s.kind, data: s.data }))), studyDate(new Date())) };
}

export type Overview = {
  signups7: number; signups30: number; verified30: number; pending30: number; bySource30: Record<string, number>;
  firstActivity30: number; active7: number; active30: number; upgrades30: number; revenue30Cents: number; toReview: number;
  conversion30: { total: number; paid: number; rate: number | null }; migrated: boolean;
};

export async function overview(): Promise<Overview> {
  const q = async <T extends RowDataPacket>(sql: string): Promise<T[]> => (await mysqlPool().query<T[]>(sql))[0];
  /** Falha de leitura propaga (a tela mostra erro); `optional` só para tabelas da migração 06, que podem não existir ainda. */
  const one = async (sql: string, optional = false) => { try { return Number((await q(sql))[0]?.n ?? 0); } catch (error) { if (optional) return 0; throw error; } };
  const s = "u.role = 'student'";
  const last = (days: number) => `u.created_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ${days} DAY)`;
  const migrated = await one("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'signup_source'") > 0;
  const act = (days: number) => one(`SELECT COUNT(DISTINCT st.user_id) AS n FROM operacao_state st JOIN users u ON u.id = st.user_id WHERE ${s} AND st.kind IN ${KINDS} AND st.updated_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ${days} DAY)`);
  // Consultas independentes: rodam juntas (uma ida ao banco por vez deixaria a aba lenta).
  const [signups7, signups30, verified30, firstActivity30, active7, active30, paidUsers, upgrades30, revenue30Cents, toReview, sources] = await Promise.all([
    one(`SELECT COUNT(*) AS n FROM users u WHERE ${s} AND ${last(7)}`),
    one(`SELECT COUNT(*) AS n FROM users u WHERE ${s} AND ${last(30)}`),
    one(`SELECT COUNT(*) AS n FROM users u WHERE ${s} AND u.email_verified_at IS NOT NULL AND ${last(30)}`),
    one(`SELECT COUNT(DISTINCT st.user_id) AS n FROM operacao_state st JOIN users u ON u.id = st.user_id WHERE ${s} AND st.kind IN ${KINDS} AND ${last(30)}`),
    act(7), act(30),
    one(`SELECT COUNT(DISTINCT o.user_id) AS n FROM pix_orders o JOIN users u ON u.id = o.user_id WHERE o.status = 'pago' AND ${last(30)}`, true),
    one("SELECT COUNT(*) AS n FROM pix_orders WHERE status = 'pago' AND confirmed_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 DAY)", true),
    one("SELECT COALESCE(SUM(expected_cents),0) AS n FROM pix_orders WHERE status = 'pago' AND confirmed_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 DAY)", true),
    one("SELECT COUNT(*) AS n FROM pix_orders WHERE status = 'em_conferencia'", true),
    q(`SELECT COALESCE(${migrated ? "u.signup_source" : "NULL"}, 'legado') AS src, COUNT(*) AS n FROM users u WHERE ${s} AND ${last(30)} GROUP BY src`),
  ]);
  const bySource: Record<string, number> = {};
  for (const r of sources) bySource[r.src] = Number(r.n);
  return {
    signups7, signups30, verified30, pending30: signups30 - verified30, bySource30: bySource, firstActivity30, active7, active30, upgrades30, revenue30Cents, toReview,
    conversion30: { total: verified30, paid: paidUsers, rate: verified30 ? Math.round((paidUsers / verified30) * 1000) / 10 : null }, migrated,
  };
}