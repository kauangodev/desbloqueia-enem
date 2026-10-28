import "server-only";
/* Dynamic row/value shapes are intentional in this compatibility adapter. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createHmac, createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { mysqlConfigured, mysqlPool } from "./mysql";
import { normalizeMysqlRow, mysqlWriteValue, mysqlPrimaryKeys } from "./mysql-values";
import { requiredSessionSecret } from "./security";
import { configuredCaktoOffer, nextMysqlOrderStatus } from "./payment";

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = "godev_session";
const RESET_TTL_MS = 30 * 60 * 1000;
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();
type UserRow = { id: string; email: string; name: string; role: "student" | "admin"; password_hash?: string | null; must_change_password?: boolean; admin_role?: string; account_status?: string };
type QueryResult = { data: any; error: any; count?: number | null };

function authSecret() { return requiredSessionSecret(); }
function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url").toString("utf8"); }
function sign(payload: string) { return createHmac("sha256", authSecret()).update(payload).digest("base64url"); }
function tokenFor(user: UserRow) { const iat = Date.now(); const payload = encode(JSON.stringify({ id: user.id, role: user.role, must_change_password: Boolean(user.must_change_password), iat, exp: iat + 7 * 86400000 })); return `${payload}.${sign(payload)}`; }
function userFromToken(token: string | undefined): { id: string; iat: number } | null {
  if (!token) return null; const [payload, signature] = token.split("."); if (!payload || !signature) return null;
  const expected = sign(payload); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const data = JSON.parse(decode(payload)) as { id: string; iat: number; exp: number }; return data.exp > Date.now() && Number.isFinite(data.iat) ? { id: data.id, iat: data.iat } : null; } catch { return null; }
}
async function mustChangePassword(id: string) {
  try {
    const [rows] = await mysqlPool().query<any[]>("SELECT must_change_password FROM users WHERE id = ? LIMIT 1", [id]);
    return Boolean(rows[0]?.must_change_password);
  } catch {
    return false;
  }
}
async function passwordHash(password: string) { const salt = randomBytes(16).toString("hex"); const derived = (await scrypt(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
export async function hashUserPassword(password: string) { return passwordHash(password); }
async function passwordMatches(password: string, stored: string | null | undefined) {
  if (!stored?.startsWith("scrypt$")) return false; const [, salt, hex] = stored.split("$"); const derived = (await scrypt(password, salt, 64)) as Buffer; const expected = Buffer.from(hex, "hex"); return expected.length === derived.length && timingSafeEqual(expected, derived);
}

async function issueResetEmail(email: string) {
  const token = randomBytes(32).toString("hex");
  const [result] = await mysqlPool().query<any>("UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE email = ?", [createHash("sha256").update(token).digest("hex"), new Date(Date.now() + RESET_TTL_MS), email.toLowerCase()]);
  if (!result.affectedRows) return null;
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.EMAIL_FROM?.trim();
  const from = configuredFrom && !/@(?:gmail|googlemail|outlook|hotmail|yahoo)\./i.test(configuredFrom)
    ? configuredFrom
    : "GoDev Education <noreply@godeveducation.com.br>";
  if (!apiKey || !from) {
    console.error("password_reset_email_config_missing", { apiKey: Boolean(apiKey), from: Boolean(from) });
    await mysqlPool().query("UPDATE users SET reset_token_hash = NULL, reset_token_expires_at = NULL WHERE email = ?", [email.toLowerCase()]);
    return { message: "Entrega de e-mail indisponível" };
  }
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://godeveducation.com.br"}/auth/callback?token=${token}`;
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: email, subject: "Configure sua senha | GoDev Education", html: `<p>Configure sua senha por este link: <a href="${resetUrl}">${resetUrl}</a></p>` }) });
    if (!response.ok) {
      console.error("password_reset_email_rejected", { status: response.status });
      throw new Error("email_delivery_failed");
    }
  } catch {
    await mysqlPool().query("UPDATE users SET reset_token_hash = NULL, reset_token_expires_at = NULL WHERE email = ?", [email.toLowerCase()]);
    return { message: "Não foi possível enviar o e-mail" };
  }
  return null;
}

const tableAliases: Record<string, string> = { profiles: "users" };
const tableNames = new Set(["users", "profiles", "admin_invites", "products", "offers", "orders", "payment_events", "entitlements", "materials", "reading_progress", "study_progress", "support_settings", "audit_logs", "storage_files", "assessment_attempts", "essay_submissions", "account_access_fingerprints", "support_tickets", "email_deliveries", "gamification_events", "gamification_goals"]);
function tableName(table: string) { if (!tableNames.has(table)) throw new Error("Tabela não permitida"); return tableAliases[table] || table; }
function columnName(column: string) { if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) throw new Error("Coluna inválida"); return column === "date" ? "date_value" : column; }
function normalizeRow(row: any) { return normalizeMysqlRow(row); }
function denormalizeValues(values: Record<string, any>) { const result = { ...values }; if (Object.prototype.hasOwnProperty.call(result, "date")) { result.date_value = result.date; delete result.date; } if (!result.id && ["study_progress", "email_deliveries", "essay_submissions", "support_tickets", "assessment_attempts"].includes(String(result.__table))) result.id = randomUUID(); delete result.__table; return result; }
function quoteColumns(columns?: string) { if (!columns || columns.trim() === "*") return "*"; return columns.split(",").map((column) => `\`${columnName(column.trim())}\``).join(","); }

class QueryBuilder implements PromiseLike<QueryResult> {
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private values: Record<string, any>[] = []; private filters: Array<[string, any]> = []; private columns = "*"; private orderBy: [string, "ASC" | "DESC"] | null = null; private limitValue: number | null = null; private singleMode: "single" | "maybe" | null = null; private conflict: string | null = null;
  private returningColumns: string | null = null; private countOnly = false;
  constructor(private readonly table: string) {}
  select(columns = "*", options?: any) { if (this.mode === "insert" || this.mode === "update") this.returningColumns = columns; else { this.mode = "select"; this.columns = columns; this.countOnly = options?.head === true && options?.count === "exact"; } return this; }
  insert(values: Record<string, any> | Record<string, any>[]) { this.mode = "insert"; this.values = (Array.isArray(values) ? values : [values]).map((v) => denormalizeValues({ ...v, __table: this.table })); return this; }
  update(values: Record<string, any>) { this.mode = "update"; this.values = [denormalizeValues({ ...values, __table: this.table })]; return this; }
  delete() { this.mode = "delete"; return this; }
  upsert(values: Record<string, any> | Record<string, any>[], options?: { onConflict?: string }) { this.mode = "insert"; this.conflict = options?.onConflict || mysqlPrimaryKeys[this.table] || "id"; this.values = (Array.isArray(values) ? values : [values]).map((v) => denormalizeValues({ ...v, __table: this.table })); return this; }
  eq(column: string, value: any) { this.filters.push([columnName(column), value]); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.orderBy = [columnName(column), options?.ascending === false ? "DESC" : "ASC"]; return this; }
  limit(value: number) { this.limitValue = value; return this; }
  single() { this.singleMode = "single"; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }
  then<TResult1 = QueryResult, TResult2 = never>(onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.run().then(onfulfilled, onrejected); }
  private async run(): Promise<QueryResult> {
    try {
      const table = tableName(this.table); const pool = mysqlPool();
      if (this.mode === "select") {
        const where = this.filters.length ? ` WHERE ${this.filters.map(([column]) => `\`${column}\` = ?`).join(" AND ")}` : ""; const order = this.orderBy ? ` ORDER BY \`${this.orderBy[0]}\` ${this.orderBy[1]}` : ""; const limit = this.limitValue == null ? "" : ` LIMIT ${Math.max(0, Math.floor(this.limitValue))}`;
        if (this.countOnly) { const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) AS count FROM \`${table}\`${where}`, this.filters.map(([, value]) => value)); return { data: null, error: null, count: Number(countRows[0]?.count || 0) }; }
        const [rows] = await pool.query<any[]>(`SELECT ${quoteColumns(this.columns)} FROM \`${table}\`${where}${order}${limit}`, this.filters.map(([, value]) => value)); const data = rows.map(normalizeRow);
        if (this.singleMode && data.length !== 1) return { data: this.singleMode === "maybe" ? null : null, error: this.singleMode === "maybe" ? null : { message: "expected one row" } }; return { data: this.singleMode ? data[0] : data, error: null, count: data.length };
      }
      if (this.mode === "delete") { const where = this.filters.length ? ` WHERE ${this.filters.map(([column]) => `\`${column}\` = ?`).join(" AND ")}` : ""; await pool.query(`DELETE FROM \`${table}\`${where}`, this.filters.map(([, value]) => value)); return { data: null, error: null }; }
      if (this.mode === "update") { const values = this.values[0] || {}; const entries = Object.entries(values); const where = this.filters.length ? ` WHERE ${this.filters.map(([column]) => `\`${column}\` = ?`).join(" AND ")}` : ""; const filterValues = this.filters.map(([, value]) => value); await pool.query(`UPDATE \`${table}\` SET ${entries.map(([key]) => `\`${columnName(key)}\` = ?`).join(", ")}${where}`, [...entries.map(([key, value]) => mysqlWriteValue(key, value)), ...filterValues]); if (this.returningColumns) { const [rows] = await pool.query<any[]>(`SELECT ${quoteColumns(this.returningColumns)} FROM \`${table}\`${where} LIMIT 1`, filterValues); const data = rows.map(normalizeRow); if (this.singleMode && data.length !== 1) return { data: this.singleMode === "maybe" ? null : null, error: this.singleMode === "maybe" ? null : { message: "expected one row" } }; return { data: this.singleMode ? data[0] : data, error: null, count: data.length }; } return { data: null, error: null }; }
      const returned: any[] = [];
      for (const values of this.values) { const entries = Object.entries(values); const keys = entries.map(([key]) => columnName(key)); let sql = `INSERT INTO \`${table}\` (${keys.map((key) => `\`${key}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`; if (this.conflict) { const conflictColumns = this.conflict.split(",").map(columnName); const updates = entries.filter(([key]) => !conflictColumns.includes(columnName(key))).map(([key]) => `\`${columnName(key)}\` = VALUES(\`${columnName(key)}\`)`); if (updates.length) sql += ` ON DUPLICATE KEY UPDATE ${updates.join(", ")}`; } await pool.query(sql, entries.map(([key, value]) => mysqlWriteValue(key, value))); if (this.returningColumns && values.id) { const [rows] = await pool.query<any[]>(`SELECT ${quoteColumns(this.returningColumns)} FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`, [values.id]); returned.push(...rows.map(normalizeRow)); } }
      if (this.returningColumns) { if (this.singleMode && returned.length !== 1) return { data: this.singleMode === "maybe" ? null : null, error: this.singleMode === "maybe" ? null : { message: "expected one row" } }; return { data: this.singleMode ? returned[0] : returned, error: null, count: returned.length }; }
      return { data: null, error: null };
    } catch (error) { return { data: null, error }; }
  }
}

function normalizedRole(value: unknown): "student" | "admin" { return String(value || "").trim().toLowerCase() === "admin" ? "admin" : "student"; }
function userRecord(row: any): UserRow { return { id: row.id, email: row.email, name: row.name || "", role: normalizedRole(row.role), password_hash: row.password_hash, admin_role: row.admin_role || (normalizedRole(row.role) === "admin" ? "administrator" : undefined), account_status: row.account_status || "active" }; }
async function currentUser() {
  const jar = await cookies(); const tokenUser = userFromToken(jar.get(SESSION_COOKIE)?.value); if (!tokenUser) return null;
  let rows: any[] = [];
  try { [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role,password_hash,email_verified_at,updated_at,admin_role,account_status FROM users WHERE id = ? LIMIT 1", [tokenUser.id]); }
  catch { [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role,password_hash,email_verified_at,updated_at FROM users WHERE id = ? LIMIT 1", [tokenUser.id]); }
  const row = rows[0]; if (!row || !row.email_verified_at || row.account_status === "suspended" || (row.updated_at && new Date(row.updated_at).getTime() > tokenUser.iat)) return null; return { ...userRecord(row), must_change_password: await mustChangePassword(row.id) };
}
async function setSession(user: UserRow | null) { const jar = await cookies(); if (!user) { jar.delete(SESSION_COOKIE); return true; } try { jar.set(SESSION_COOKIE, tokenFor(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 }); return true; } catch { return false; } }

function createAuth() {
  return {
    async getUser() { const user = await currentUser(); return { data: { user }, error: user ? null : { message: "not_authenticated" } }; },
    async signInWithPassword(input: { email: string; password: string }) { const [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role,password_hash,email_verified_at FROM users WHERE email = ? LIMIT 1", [input.email.toLowerCase()]); const user = rows[0]?.email_verified_at && await passwordMatches(input.password, rows[0].password_hash) ? { ...userRecord(rows[0]), must_change_password: await mustChangePassword(rows[0].id) } : null; if (!user) return { data: { user: null }, error: { message: "Invalid login credentials", status: 401 } }; if (!await setSession(user)) return { data: { user: null }, error: { message: "Não foi possível iniciar a sessão", status: 503 } }; return { data: { user }, error: null }; },
    async signUp(input: { email: string; password: string; options?: { data?: { name?: string } } }) { const [existing] = await mysqlPool().query<any[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [input.email.toLowerCase()]); if (existing.length) return { data: { user: null, session: null }, error: { message: "User already registered", status: 409 } }; const user: UserRow = { id: randomUUID(), email: input.email.toLowerCase(), name: input.options?.data?.name || "Aluno", role: "student" }; await mysqlPool().query("INSERT INTO users (id,email,name,password_hash,role,email_verified_at) VALUES (?,?,?,?,?,NULL)", [user.id, user.email, user.name, await passwordHash(input.password), user.role]); const resetError = await issueResetEmail(user.email); if (resetError) { await mysqlPool().query("DELETE FROM users WHERE id = ?", [user.id]); return { data: { user: null, session: null }, error: resetError }; } return { data: { user, session: null }, error: null }; },
    async signOut() { await setSession(null); return { error: null }; },
    async updateUser(input: { password: string }) { const user = await currentUser(); if (!user) return { error: { message: "session expired" } }; await mysqlPool().query("UPDATE users SET password_hash = ? WHERE id = ?", [await passwordHash(input.password), user.id]); try { await mysqlPool().query("UPDATE users SET must_change_password = FALSE WHERE id = ?", [user.id]); } catch { /* migration ainda não aplicada */ } return { error: null }; },
    async resetPasswordForEmail(email: string) { return { error: await issueResetEmail(email) }; },
    admin: { async listUsers() { const [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role FROM users ORDER BY created_at LIMIT 1000"); return { data: { users: rows }, error: null }; }, async createUser(input: { email: string; user_metadata?: { name?: string } }) { const user: UserRow = { id: randomUUID(), email: input.email.toLowerCase(), name: input.user_metadata?.name || "Aluno", role: "student" }; try { await mysqlPool().query("INSERT INTO users (id,email,name,role,email_verified_at) VALUES (?,?,?,?,NULL)", [user.id,user.email,user.name,user.role]); return { data: { user }, error: null }; } catch (error) { return { data: { user: null }, error }; } } },
  };
}

async function rpcHandler(name: string, args: Record<string, any> = {}): Promise<QueryResult> {
  if (name === "take_rate_limit") { const key = String(args.p_key || ""); const now = Date.now(); const current = memoryRateLimits.get(key); if (!current || current.expiresAt <= now) { memoryRateLimits.set(key, { count: 1, expiresAt: now + Number(args.p_seconds || 900) * 1000 }); return { data: true, error: null }; } if (current.count >= Number(args.p_limit || 3)) return { data: false, error: null }; current.count += 1; return { data: true, error: null }; }
  if (name === "clear_rate_limit") { memoryRateLimits.delete(String(args.p_key || "")); return { data: true, error: null }; }
  if (name === "record_access_fingerprint") { await new QueryBuilder("account_access_fingerprints").upsert({ user_id: args.p_user_id, fingerprint_hash: args.p_fingerprint_hash, user_agent: String(args.p_user_agent || "").slice(0, 500) }, { onConflict: "user_id,fingerprint_hash" }); return { data: null, error: null }; }
  if (name === "claim_emails") {
    const leaseUntil = new Date(Date.now() + 10 * 60 * 1000);
    const [rows] = await mysqlPool().query<any[]>(
      "SELECT id,order_id,email,attempts FROM email_deliveries WHERE status IN ('pending','failed') AND next_attempt <= CURRENT_TIMESTAMP(3) AND (leased_until IS NULL OR leased_until < CURRENT_TIMESTAMP(3)) ORDER BY created_at LIMIT 25",
    );
    const claimed: any[] = [];
    for (const row of rows) {
      const [result] = await mysqlPool().query<any>(
        "UPDATE email_deliveries SET status = 'processing', attempts = attempts + 1, leased_until = ? WHERE id = ? AND status IN ('pending','failed') AND (leased_until IS NULL OR leased_until < CURRENT_TIMESTAMP(3))",
        [leaseUntil, row.id],
      );
      if (result.affectedRows === 1) claimed.push({ ...row, attempts: Number(row.attempts || 0) + 1 });
    }
    return { data: claimed, error: null };
  }
  if (name === "receive_payment") {
    if (args.p_event === "healthcheck") return { data: true, error: null };
    const event = String(args.p_event || ""); const data = args.p_data || {}; const id = String(data.id || data.order_id || randomBytes(16).toString("hex")); const matched = configuredCaktoOffer(data.product?.id, data.offer?.id); if (!matched) return { data: null, error: { message: "Oferta Cakto não configurada" } }; const plan = matched[0]; const customer = data.customer || {}; const email = String(customer.email || "").trim().toLowerCase();
    const [offerRows] = await mysqlPool().query<any[]>("SELECT plan FROM offers WHERE plan = ? AND cakto_product_id = ? AND cakto_offer_id = ? AND enabled = TRUE LIMIT 1", [plan, matched[1].productId, matched[1].offerId]);
    const connection = await mysqlPool().getConnection();
    try {
      await connection.beginTransaction();
      const [existingRows] = await connection.query<any[]>("SELECT status,email FROM orders WHERE id = ? FOR UPDATE", [id]);
      const currentStatus = existingRows[0]?.status as string | undefined;
      if (existingRows[0] && String(existingRows[0].email || "").trim().toLowerCase() !== email) { await connection.rollback(); return { data: null, error: { message: "E-mail não corresponde ao pedido" } }; }
      const historicalEvent = ["refund", "refund_requested", "chargeback", "dispute_defense_requested", "purchase_email_failed", "subscription_renewal_refused", "subscription_paused", "subscription_late", "subscription_canceled"].includes(event);
      if (!offerRows[0] && (!historicalEvent || !existingRows[0])) return { data: null, error: { message: "Oferta Cakto não está ativa ou pedido histórico não existe" } };
      const [users] = await connection.query<any[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
      const userId = users[0]?.id || null;
      const [eventResult] = await connection.query<any>("INSERT IGNORE INTO payment_events (id,order_id,event,data) VALUES (?,?,?,?)", [`${id}:${event}`, id, event, JSON.stringify(data)]);
      if (eventResult.affectedRows === 0) { await connection.commit(); return { data: id, error: null }; }
      const status = nextMysqlOrderStatus(currentStatus, event, data.status);
      const amount = Number(data.amount ?? data.baseAmount ?? 0);
      await connection.query("INSERT INTO orders (id,email,name,plan,amount,status) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE email=VALUES(email),name=VALUES(name),plan=VALUES(plan),amount=VALUES(amount),status=VALUES(status)", [id, email, String(customer.name || ""), plan, amount, status]);
      await connection.query("INSERT INTO entitlements (order_id,user_id,email,plan,active) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE user_id=COALESCE(VALUES(user_id),entitlements.user_id),email=VALUES(email),plan=VALUES(plan),active=VALUES(active)", [id, userId, email, plan, status === "paid"]);
      await connection.query("INSERT INTO email_deliveries (id,order_id,email,status) VALUES (?,?,?,'pending') ON DUPLICATE KEY UPDATE email=VALUES(email)", [randomUUID(), id, email]);
      await connection.commit();
      return { data: id, error: null };
    } catch (error) {
      await connection.rollback();
      return { data: null, error };
    } finally { connection.release(); }
  }
  return { data: null, error: { message: `RPC não suportada: ${name}` } };
}
const storageRoot = () => join(process.cwd(), "private", "materials");
const storageFile = (path: string) => join(storageRoot(), basename(path));
const storageHandler = { from: (bucket: string) => { void bucket; return {
  createSignedUrl: async (path: string) => ({ data: { signedUrl: `/api/storage?path=${encodeURIComponent(path)}` }, error: null }),
  download: async (path: string) => { try { const file = await readFile(storageFile(path)); return { data: new Blob([file], { type: "application/pdf" }), error: null }; } catch { return { data: null, error: { message: "Arquivo não encontrado" } }; } },
  createSignedUploadUrl: async (path: string) => { await mkdir(storageRoot(), { recursive: true }); return { data: { path, token: sign(`upload:${path}`), signedUrl: `/api/storage?path=${encodeURIComponent(path)}&token=${encodeURIComponent(sign(`upload:${path}`))}&upload=1` }, error: null }; },
  upload: async (path: string, body: Buffer | Uint8Array) => { try { await mkdir(storageRoot(), { recursive: true }); await writeFile(storageFile(path), body); return { data: { path }, error: null }; } catch (error) { return { data: null, error }; } },
}; } };

export const authConfigured = () => mysqlConfigured();
export async function sessionClient() { return mysqlConfigured() ? { auth: createAuth(), from: (table: string) => new QueryBuilder(table), rpc: rpcHandler, storage: storageHandler } as any : null; }
export function serviceClient() { if (!mysqlConfigured()) throw new Error("Banco MySQL não configurado"); return { auth: { admin: createAuth().admin }, from: (table: string) => new QueryBuilder(table), rpc: rpcHandler, storage: storageHandler } as any; }
export function publicClient() { return mysqlConfigured() ? { auth: createAuth() } as any : null; }
export async function identity() {
  const db = await sessionClient();
  if (!db) return null;
  const { data, error } = await db.auth.getUser();
  const user = data?.user;
  if (error || !user) return null;
  const { data: profile, error: profileError } = await db.from("profiles").select("id,name,role").eq("id", user.id).maybeSingle();
  if (profileError) {
    console.error("auth_profile_lookup_failed", { code: profileError.code || profileError.errno || "unknown" });
    return null;
  }
  return { db, user, profile: profile ? { ...profile, role: normalizedRole(profile.role), admin_role: user.admin_role, account_status: user.account_status } : profile };
}
export async function canAccess(plan: string) { const who = await identity(); if (!who) return null; if (who.profile?.role === "admin") return who; const { data } = await who.db.from("entitlements").select("plan").eq("user_id", who.user.id).eq("active", true); return data?.some((e: { plan: string }) => e.plan === "premium" || e.plan === plan) ? who : null; }

