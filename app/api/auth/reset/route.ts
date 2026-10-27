import { createHash, createHmac, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../../../../lib/mysql";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { requiredSessionSecret } from "../../../../lib/security";

const scrypt = promisify(nodeScrypt);
type ResetRow = RowDataPacket & { id: string };
async function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const derived = (await scrypt(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
function sessionToken(id: string) { const iat = Date.now(); const payload = Buffer.from(JSON.stringify({ id, iat, exp: iat + 7 * 86400000 })).toString("base64url"); return `${payload}.${createHmac("sha256", requiredSessionSecret()).update(payload).digest("base64url")}`; }

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const input = await req.json().catch(() => null);
  const token = typeof input?.token === "string" ? input.token : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return jsonError("Use uma senha com letras e números.");
  const [rows] = await mysqlPool().query<ResetRow[]>("SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3) LIMIT 1", [createHash("sha256").update(token).digest("hex")]);
  if (!rows[0]) return jsonError("Este link de senha expirou. Solicite outro.", 410);
  const [result] = await mysqlPool().query<ResultSetHeader>("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(3)), reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ? AND reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3)", [await hashPassword(password), rows[0].id, createHash("sha256").update(token).digest("hex")]);
  if (!result.affectedRows) return jsonError("Este link de senha expirou. Solicite outro.", 410);
  const response = NextResponse.json({ redirect: "/aluno" });
  response.cookies.set("godev_session", sessionToken(rows[0].id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return response;
}
