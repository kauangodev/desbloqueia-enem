import "server-only";
import { cookies } from "next/headers";
import { createHmac, createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { mysqlConfigured, mysqlPool } from "./mysql";

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = "godev_session";
const RESET_TTL_MS = 30 * 60 * 1000;
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();
type UserRow = { id: string; email: string; name: string; role: "student" | "admin"; password_hash?: string | null };
type QueryResult = { data: any; error: any; count?: number | null };

function authSecret() { return process.env.AUTH_SESSION_SECRET || process.env.HOSTINGER_MYSQL_PASSWORD || "temporary-hostinger-session-secret"; }
function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url").toString("utf8"); }
function sign(payload: string) { return createHmac("sha256", authSecret()).update(payload).digest("base64url"); }
function tokenFor(user: UserRow) { const payload = encode(JSON.stringify({ id: user.id, exp: Date.now() + 7 * 86400000 })); return `${payload}.${sign(payload)}`; }
function userFromToken(token: string | undefined): { id: string } | null {
  if (!token) return null; const [payload, signature] = token.split("."); if (!payload || !signature) return null;
  const expected = sign(payload); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const data = JSON.parse(decode(payload)) as { id: string; exp: number }; return data.exp > Date.now() ? { id: data.id } : null; } catch { return null; }
}
async function passwordHash(password: string) { const salt = randomBytes(16).toString("hex"); const derived = (await scrypt(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
async function passwordMatches(password: string, stored: string | null | undefined) {
  if (!stored?.startsWith("scrypt$")) return false; const [, salt, hex] = stored.split("$"); const derived = (await scrypt(password, salt, 64)) as Buffer; const expected = Buffer.from(hex, "hex"); return expected.length === derived.length && timingSafeEqual(expected, derived);
}

const tableAliases: Record<string, string> = { profiles: "users" };
const tableNames = new Set(["users", "profiles", "admin_invites", "products", "offers", "orders", "payment_events", "entitlements", "materials", "reading_progress", "study_progress", "support_settings", "audit_logs", "storage_files", "assessment_attempts", "essay_submissions", "account_access_fingerprints", "support_tickets", "email_deliveries"]);
function tableName(table: string) { if (!tableNames.has(table)) throw new Error("Tabela não permitida"); return tableAliases[table] || table; }
function columnName(column: string) { if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) throw new Error("Coluna inválida"); return column === "date" ? "date_value" : column; }
function normalizeRow(row: any) { if (row && Object.prototype.hasOwnProperty.call(row, "date_value")) { row.date = row.date_value; delete row.date_value; } return row; }
function denormalizeValues(values: Record<string, any>) { const result = { ...values }; if (Object.prototype.hasOwnProperty.call(result, "date")) { result.date_value = result.date; delete result.date; } if (!result.id && ["study_progress", "email_deliveries", "essay_submissions", "support_tickets", "assessment_attempts"].includes(String(result.__table))) result.id = randomBytes(16).toString("hex"); delete result.__table; return result; }
function quoteColumns(columns?: string) { if (!columns || columns.trim() === "*") return "*"; return columns.split(",").map((column) => `\`${columnName(column.trim())}\``).join(","); }

class QueryBuilder implements PromiseLike<QueryResult> {
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private values: Record<string, any>[] = []; private filters: Array<[string, any]> = []; private columns = "*"; private orderBy: [string, "ASC" | "DESC"] | null = null; private limitValue: number | null = null; private singleMode: "single" | "maybe" | null = null; private conflict: string | null = null;
  constructor(private readonly table: string) {}
  select(columns = "*", _options?: any) { this.mode = "select"; this.columns = columns; return this; }
  insert(values: Record<string, any> | Record<string, any>[]) { this.mode = "insert"; this.values = (Array.isArray(values) ? values : [values]).map((v) => denormalizeValues({ ...v, __table: this.table })); return this; }
  update(values: Record<string, any>) { this.mode = "update"; this.values = [denormalizeValues({ ...values, __table: this.table })]; return this; }
  delete() { this.mode = "delete"; return this; }
  upsert(values: Record<string, any> | Record<string, any>[], options?: { onConflict?: string }) { this.mode = "insert"; this.conflict = options?.onConflict || null; this.values = (Array.isArray(values) ? values : [values]).map((v) => denormalizeValues({ ...v, __table: this.table })); return this; }
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
        const [rows] = await pool.query<any[]>(`SELECT ${quoteColumns(this.columns)} FROM \`${table}\`${where}${order}${limit}`, this.filters.map(([, value]) => value)); const data = rows.map(normalizeRow);
        if (this.singleMode && data.length !== 1) return { data: this.singleMode === "maybe" ? null : null, error: this.singleMode === "maybe" ? null : { message: "expected one row" } }; return { data: this.singleMode ? data[0] : data, error: null, count: data.length };
      }
      if (this.mode === "delete") { const where = this.filters.length ? ` WHERE ${this.filters.map(([column]) => `\`${column}\` = ?`).join(" AND ")}` : ""; await pool.query(`DELETE FROM \`${table}\`${where}`, this.filters.map(([, value]) => value)); return { data: null, error: null }; }
      if (this.mode === "update") { const values = this.values[0] || {}; const entries = Object.entries(values); const where = this.filters.length ? ` WHERE ${this.filters.map(([column]) => `\`${column}\` = ?`).join(" AND ")}` : ""; await pool.query(`UPDATE \`${table}\` SET ${entries.map(([key]) => `\`${columnName(key)}\` = ?`).join(", ")}${where}`, [...entries.map(([, value]) => value), ...this.filters.map(([, value]) => value)]); return { data: null, error: null }; }
      for (const values of this.values) { const entries = Object.entries(values); const keys = entries.map(([key]) => columnName(key)); let sql = `INSERT INTO \`${table}\` (${keys.map((key) => `\`${key}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`; if (this.conflict) { const conflictColumns = this.conflict.split(",").map(columnName); const updates = entries.filter(([key]) => !conflictColumns.includes(columnName(key))).map(([key]) => `\`${columnName(key)}\` = VALUES(\`${columnName(key)}\`)`); if (updates.length) sql += ` ON DUPLICATE KEY UPDATE ${updates.join(", ")}`; } await pool.query(sql, entries.map(([, value]) => typeof value === "object" && value !== null ? JSON.stringify(value) : value)); }
      return { data: null, error: null };
    } catch (error) { return { data: null, error }; }
  }
}

function userRecord(row: any): UserRow { return { id: row.id, email: row.email, name: row.name || "", role: row.role === "admin" ? "admin" : "student", password_hash: row.password_hash }; }
async function currentUser() { const jar = await cookies(); const tokenUser = userFromToken(jar.get(SESSION_COOKIE)?.value); if (!tokenUser) return null; const [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role,password_hash FROM users WHERE id = ? LIMIT 1", [tokenUser.id]); return rows[0] ? userRecord(rows[0]) : null; }
async function setSession(user: UserRow | null) { const jar = await cookies(); if (!user) { jar.delete(SESSION_COOKIE); return; } try { jar.set(SESSION_COOKIE, tokenFor(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 }); } catch { /* server component */ } }

function createAuth() {
  return {
    async getUser() { const user = await currentUser(); return { data: { user }, error: user ? null : { message: "not_authenticated" } }; },
    async signInWithPassword(input: { email: string; password: string }) { const [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role,password_hash FROM users WHERE email = ? LIMIT 1", [input.email.toLowerCase()]); const user = rows[0] && await passwordMatches(input.password, rows[0].password_hash) ? userRecord(rows[0]) : null; if (!user) return { data: { user: null }, error: { message: "Invalid login credentials", status: 401 } }; await setSession(user); return { data: { user }, error: null }; },
    async signUp(input: { email: string; password: string; options?: { data?: { name?: string } } }) { const [existing] = await mysqlPool().query<any[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [input.email.toLowerCase()]); if (existing.length) return { data: { user: null, session: null }, error: { message: "User already registered", status: 409 } }; const user: UserRow = { id: randomBytes(16).toString("hex"), email: input.email.toLowerCase(), name: input.options?.data?.name || "Aluno", role: "student" }; await mysqlPool().query("INSERT INTO users (id,email,name,password_hash,role,email_verified_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP(3))", [user.id, user.email, user.name, await passwordHash(input.password), user.role]); await setSession(user); return { data: { user, session: { user } }, error: null }; },
    async signOut() { await setSession(null); return { error: null }; },
    async updateUser(input: { password: string }) { const user = await currentUser(); if (!user) return { error: { message: "session expired" } }; await mysqlPool().query("UPDATE users SET password_hash = ? WHERE id = ?", [await passwordHash(input.password), user.id]); return { error: null }; },
    async resetPasswordForEmail(email: string) { const token = randomBytes(32).toString("hex"); const [result] = await mysqlPool().query<any>("UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE email = ?", [createHash("sha256").update(token).digest("hex"), new Date(Date.now() + RESET_TTL_MS), email.toLowerCase()]); if (!result.affectedRows) return { error: null }; const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://godeveducation.com.br"}/auth/callback?token=${token}`; if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: email, subject: "Configure sua senha | GoDev Education", html: `<p>Configure sua senha por este link: <a href="${resetUrl}">${resetUrl}</a></p>` }) }); else console.warn("password_reset_url_generated", { email, resetUrl }); return { error: null }; },
    admin: { async listUsers() { const [rows] = await mysqlPool().query<any[]>("SELECT id,email,name,role FROM users ORDER BY created_at LIMIT 1000"); return { data: { users: rows }, error: null }; }, async createUser(input: { email: string; user_metadata?: { name?: string } }) { const user: UserRow = { id: randomBytes(16).toString("hex"), email: input.email.toLowerCase(), name: input.user_metadata?.name || "Aluno", role: "student" }; try { await mysqlPool().query("INSERT INTO users (id,email,name,role,email_verified_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP(3))", [user.id,user.email,user.name,user.role]); return { data: { user }, error: null }; } catch (error) { return { data: { user: null }, error }; } } },
  };
}

async function rpcHandler(name: string, args: Record<string, any> = {}): Promise<QueryResult> {
  if (name === "take_rate_limit") { const key = String(args.p_key || ""); const now = Date.now(); const current = memoryRateLimits.get(key); if (!current || current.expiresAt <= now) { memoryRateLimits.set(key, { count: 1, expiresAt: now + Number(args.p_seconds || 900) * 1000 }); return { data: true, error: null }; } if (current.count >= Number(args.p_limit || 3)) return { data: false, error: null }; current.count += 1; return { data: true, error: null }; }
  if (name === "record_access_fingerprint") { await new QueryBuilder("account_access_fingerprints").upsert({ user_id: args.p_user_id, fingerprint_hash: args.p_fingerprint_hash, user_agent: String(args.p_user_agent || "").slice(0, 500) }, { onConflict: "user_id,fingerprint_hash" }); return { data: null, error: null }; }
  if (name === "claim_emails") {
    const leaseUntil = new Date(Date.now() + 10 * 60 * 1000);
    const [rows] = await mysqlPool().query<any[]>(
      "SELECT id,order_id,email,attempts FROM email_deliveries WHERE status = 'pending' AND next_attempt <= CURRENT_TIMESTAMP(3) AND (leased_until IS NULL OR leased_until < CURRENT_TIMESTAMP(3)) ORDER BY created_at LIMIT 25",
    );
    for (const row of rows) {
      await mysqlPool().query(
        "UPDATE email_deliveries SET status = 'processing', attempts = attempts + 1, leased_until = ? WHERE id = ? AND status = 'pending' AND (leased_until IS NULL OR leased_until < CURRENT_TIMESTAMP(3))",
        [leaseUntil, row.id],
      );
    }
    return { data: rows.map((row) => ({ ...row, attempts: Number(row.attempts || 0) + 1 })), error: null };
  }
  if (name === "receive_payment") {
    const event = String(args.p_event || ""); const data = args.p_data || {}; const id = String(data.id || data.order_id || randomBytes(16).toString("hex")); const plan = data.offer?.id === "3biievb" ? "essencial" : "premium"; const customer = data.customer || {}; const email = String(customer.email || "").toLowerCase();
    await new QueryBuilder("orders").upsert({ id, email, name: customer.name || "", plan, amount: Number(data.amount || 0), status: data.status === "paid" ? "paid" : "pending" }, { onConflict: "id" });
    await new QueryBuilder("payment_events").upsert({ id: `${id}:${event}`, order_id: id, event, data }, { onConflict: "id" });
    await new QueryBuilder("entitlements").upsert({ order_id: id, email, plan, active: data.status === "paid" }, { onConflict: "order_id" });
    await new QueryBuilder("email_deliveries").upsert({ id: randomBytes(16).toString("hex"), order_id: id, email, status: "pending" }, { onConflict: "order_id" });
    return { data: id, error: null };
  }
  return { data: null, error: { message: `RPC não suportada: ${name}` } };
}
const storageHandler = { from: (_bucket: string) => ({ createSignedUrl: async (path: string) => ({ data: { signedUrl: `/api/storage?path=${encodeURIComponent(path)}` }, error: null }), upload: async () => ({ data: null, error: { message: "Armazenamento local ainda não configurado" } }) }) };

export const authConfigured = () => mysqlConfigured();
export async function sessionClient() { return mysqlConfigured() ? { auth: createAuth(), from: (table: string) => new QueryBuilder(table), rpc: rpcHandler, storage: storageHandler } as any : null; }
export function serviceClient() { if (!mysqlConfigured()) throw new Error("Banco MySQL não configurado"); return { auth: { admin: createAuth().admin }, from: (table: string) => new QueryBuilder(table), rpc: rpcHandler, storage: storageHandler } as any; }
export function publicClient() { return mysqlConfigured() ? { auth: createAuth() } as any : null; }
export async function identity() { const db = await sessionClient(); if (!db) return null; const { data: user } = await db.auth.getUser(); if (!user) return null; const { data: profile } = await db.from("profiles").select("id,name,role").eq("id", user.id).maybeSingle(); return { db, user, profile }; }
export async function canAccess(plan: string) { const who = await identity(); if (!who) return null; if (who.profile?.role === "admin") return who; const { data } = await who.db.from("entitlements").select("plan").eq("user_id", who.user.id).eq("active", true); return data?.some((e: { plan: string }) => e.plan === "premium" || e.plan === plan) ? who : null; }
