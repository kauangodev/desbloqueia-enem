import { createHash, createHmac, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { mysqlPool } from "../../../../lib/mysql";
import { jsonError, sameOrigin } from "../../../../lib/http";

const scrypt = promisify(nodeScrypt);
async function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const derived = (await scrypt(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derived.toString("hex")}`; }
function sessionToken(id: string) { const secret = process.env.AUTH_SESSION_SECRET || process.env.HOSTINGER_MYSQL_PASSWORD || "temporary-hostinger-session-secret"; const payload = Buffer.from(JSON.stringify({ id, exp: Date.now() + 7 * 86400000 })).toString("base64url"); return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`; }

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const input = await req.json().catch(() => null);
  const token = typeof input?.token === "string" ? input.token : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return jsonError("Use uma senha com letras e números.");
  const [rows] = await mysqlPool().query<any[]>("SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > CURRENT_TIMESTAMP(3) LIMIT 1", [createHash("sha256").update(token).digest("hex")]);
  if (!rows[0]) return jsonError("Este link de senha expirou. Solicite outro.", 410);
  await mysqlPool().query("UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?", [await hashPassword(password), rows[0].id]);
  const response = NextResponse.json({ redirect: "/aluno" });
  response.cookies.set("godev_session", sessionToken(rows[0].id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return response;
}
