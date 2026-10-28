import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../../../../../lib/mysql";
import { hashUserPassword } from "../../../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../../../lib/http";
import { normalizeAdminRole } from "../../../../../lib/admin-permissions";

type Invite = RowDataPacket & { email: string; name: string; role: string; status: string };
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const input = await req.json().catch(() => null) as { token?: string; password?: string; name?: string } | null;
  const token = String(input?.token || "");
  const password = String(input?.password || "");
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return jsonError("Use um convite válido e uma senha com letras e números.");
  const pool = mysqlPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [invites] = await connection.query<Invite[]>("SELECT email,name,role,status FROM admin_invites WHERE token_hash=? AND active=1 AND status='pending' AND expires_at>CURRENT_TIMESTAMP(3) LIMIT 1 FOR UPDATE", [createHash("sha256").update(token).digest("hex")]);
    const invite = invites[0];
    if (!invite) { await connection.rollback(); return jsonError("Este convite expirou, foi revogado ou já foi utilizado.", 410); }
    const [users] = await connection.query<(RowDataPacket & { id: string; role: string })[]>("SELECT id,role FROM users WHERE email=? LIMIT 1 FOR UPDATE", [invite.email]);
    const id = users[0]?.id || randomUUID();
    const passwordHash = await hashUserPassword(password);
    if (users[0]?.role === "admin") { await connection.rollback(); return jsonError("Este e-mail já pertence à equipe.", 409); }
    if (users[0]) await connection.query("UPDATE users SET name=?,password_hash=?,role='admin',admin_role=?,account_status='active',email_verified_at=CURRENT_TIMESTAMP(3),updated_at=CURRENT_TIMESTAMP(3) WHERE id=?", [String(input?.name || invite.name).trim().slice(0, 160), passwordHash, normalizeAdminRole(invite.role), id]);
    else await connection.query("INSERT INTO users (id,email,name,password_hash,role,admin_role,account_status,email_verified_at) VALUES (?,?,?,?,'admin',?,'active',CURRENT_TIMESTAMP(3))", [id, invite.email, String(input?.name || invite.name).trim().slice(0, 160), passwordHash, normalizeAdminRole(invite.role)]);
    await connection.query("UPDATE admin_invites SET active=0,status='accepted',accepted_at=CURRENT_TIMESTAMP(3),token_hash=NULL WHERE email=?", [invite.email]);
    await connection.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [id, "team_invite_accepted", invite.email]);
    await connection.commit();
    return NextResponse.json({ accepted: true, email: invite.email });
  } catch (error) { await connection.rollback(); console.error("admin_team_accept_failed", { code: (error as { code?: string }).code || "unknown" }); return jsonError("Não foi possível aceitar o convite.", 503); }
  finally { connection.release(); }
}
