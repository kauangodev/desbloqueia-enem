import { createHash, createHmac, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../../../../lib/mysql";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { requiredSessionSecret } from "../../../../lib/security";
import { sessionClient } from "../../../../lib/supabase";

const scrypt = promisify(nodeScrypt);
type ResetRow = RowDataPacket & { id: string };
async function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const derived = (await scrypt(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
function sessionToken(id: string, role: string, mustChangePassword: boolean) { const iat = Date.now(); const payload = Buffer.from(JSON.stringify({ id, role: role.toLowerCase() === "admin" ? "admin" : "student", must_change_password: mustChangePassword, iat, exp: iat + 7 * 86400000 })).toString("base64url"); return `${payload}.${createHmac("sha256", requiredSessionSecret()).update(payload).digest("base64url")}`; }

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const input = await req.json().catch(() => null);
  const token = typeof input?.token === "string" ? input.token : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const requestedRedirect = typeof input?.redirect === "string" ? input.redirect : "";
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return jsonError("Use uma senha com letras e números.");
  let userId = "";
  if (token) {
    const [rows] = await mysqlPool().query<ResetRow[]>("SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3) LIMIT 1", [createHash("sha256").update(token).digest("hex")]);
    if (!rows[0]) return jsonError("Este link de senha expirou. Solicite outro.", 410);
    userId = rows[0].id;
  } else {
    const db = await sessionClient();
    const { data: current } = db ? await db.auth.getUser() : { data: { user: null } };
    if (!current.user) return jsonError("Sessão de primeiro acesso ausente.", 401);
    let rows: ResetRow[] = [];
    try {
      [rows] = await mysqlPool().query<ResetRow[]>("SELECT id FROM users WHERE id = ? AND must_change_password = TRUE LIMIT 1", [current.user.id]);
    } catch {
      return jsonError("A configuração de primeiro acesso ainda não foi aplicada.", 503);
    }
    if (!rows[0]) return jsonError("Este acesso não exige troca de senha.", 400);
    userId = rows[0].id;
  }
  let result: ResultSetHeader;
  try {
    [result] = await mysqlPool().query<ResultSetHeader>("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(3)), must_change_password = FALSE, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ? AND (reset_token_hash = ? OR (? = '' AND must_change_password = TRUE))", [await hashPassword(password), userId, createHash("sha256").update(token).digest("hex"), token]);
  } catch {
    if (!token) return jsonError("A configuração de primeiro acesso ainda não foi aplicada.", 503);
    [result] = await mysqlPool().query<ResultSetHeader>("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(3)), reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ? AND reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3)", [await hashPassword(password), userId, createHash("sha256").update(token).digest("hex")]);
  }
  if (!result.affectedRows) return jsonError("Este acesso de senha expirou. Solicite outro.", 410);
  const [users] = await mysqlPool().query<RowDataPacket[]>("SELECT role FROM users WHERE id = ? LIMIT 1", [userId]);
  const role = String(users[0]?.role || "").trim().toLowerCase();
  const safeRedirect = /^\/(?:admin|aluno)(?:[/?#]|$)/.test(requestedRedirect) ? requestedRedirect : "";
  const redirect = role === "admin" && safeRedirect ? safeRedirect : role === "admin" ? "/admin" : "/aluno";
  const response = NextResponse.json({ redirect });
  response.cookies.set("godev_session", sessionToken(userId, role, false), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return response;
}

