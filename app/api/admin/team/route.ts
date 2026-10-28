import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { identity } from "../../../../lib/supabase";
import { mysqlPool } from "../../../../lib/mysql";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { adminRoleLabels, canGrantRole, hasAdminPermission, normalizeAdminRole, type AdminRole } from "../../../../lib/admin-permissions";
import { sendResendEmail } from "../../../../lib/transactional-email";
import { appUrl } from "../../../../lib/config";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = new Set(Object.keys(adminRoleLabels));
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
type TeamRow = RowDataPacket & { id: string; email: string; name: string; role?: string; admin_role?: string; account_status?: string; status?: string; active?: number; expires_at?: string | null; delivery_status?: string; delivery_attempts?: number; last_attempt_at?: string | null; last_error_kind?: string | null; last_attempt_id?: string | null; provider_message_id?: string | null; last_sent_at?: string | null };

async function actor() {
  const who = await identity();
  const role = normalizeAdminRole((who?.profile as { admin_role?: string } | null)?.admin_role || (who?.profile?.role === "admin" ? "administrator" : "support"));
  return who ? { ...who, adminRole: role } : null;
}

async function deliverInvite(pool: Pool, email: string, name: string, role: AdminRole, token: string, idempotencyKey: string) {
  const from = process.env.EMAIL_FROM?.trim() || "";
  const url = `${appUrl}/convite?token=${encodeURIComponent(token)}`;
  const result = await sendResendEmail({
    from,
    to: email,
    subject: "Convite para a equipe | GoDev Education",
    html: `<p>Olá, ${name}.</p><p>Você recebeu um convite para acessar a equipe GoDev Education como <b>${adminRoleLabels[role]}</b>.</p><p><a href="${url}">Aceitar convite e criar acesso</a></p><p>O link expira em 7 dias. Nenhuma senha é enviada por e-mail.</p>`,
    idempotencyKey,
  });
  if (result.ok) {
    await pool.query("UPDATE admin_invites SET delivery_status='accepted',delivery_attempts=delivery_attempts+1,last_attempt_at=CURRENT_TIMESTAMP(3),last_sent_at=CURRENT_TIMESTAMP(3),last_error_kind=NULL,last_attempt_id=?,provider_message_id=? WHERE email=?", [result.attemptId, result.providerId, email]);
    return { delivery: "sent", attemptId: result.attemptId };
  }
  await pool.query("UPDATE admin_invites SET delivery_status=?,delivery_attempts=delivery_attempts+1,last_attempt_at=CURRENT_TIMESTAMP(3),last_sent_at=CURRENT_TIMESTAMP(3),last_error_kind=?,last_attempt_id=?,provider_message_id=NULL WHERE email=?", [result.kind, result.kind, result.attemptId, email]);
  return { delivery: "failed", attemptId: result.attemptId };
}

export async function GET() {
  const who = await actor();
  if (!who || !hasAdminPermission(who.adminRole, "team.read")) return jsonError("Acesso à equipe não autorizado", 403);
  try {
    const [members] = await mysqlPool().query<TeamRow[]>("SELECT id,name,email,admin_role,account_status,created_at,updated_at FROM users WHERE role = 'admin' ORDER BY name,email");
    const [invites] = await mysqlPool().query<TeamRow[]>("SELECT email,name,role,status,expires_at,last_sent_at,delivery_status,delivery_attempts,last_attempt_at,last_error_kind,last_attempt_id,provider_message_id,created_at,accepted_at FROM admin_invites ORDER BY updated_at DESC, created_at DESC");
    return NextResponse.json({ members, invites, roles: adminRoleLabels });
  } catch (error) {
    const errorId = randomBytes(8).toString("hex");
    console.error("admin_team_list_failed", { errorId, code: (error as { code?: string }).code || "unknown" });
    return NextResponse.json({ error: "Não foi possível carregar a equipe agora.", errorId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await actor();
  if (!who || !hasAdminPermission(who.adminRole, "team.manage")) return jsonError("Acesso à equipe não autorizado", 403);
  const input = await req.json().catch(() => null) as { action?: string; email?: string; name?: string; role?: string; userId?: string; status?: string } | null;
  if (!input?.action) return jsonError("Ação inválida");
  const pool = mysqlPool();
  try {
    if (input.action === "invite") {
      const email = String(input.email || "").trim().toLowerCase();
      const name = String(input.name || "").trim().slice(0, 160);
      const role = normalizeAdminRole(input.role) as AdminRole;
      if (!emailPattern.test(email) || email.length > 254 || !name) return jsonError("Informe nome e e-mail válidos.");
      if (!allowedRoles.has(role) || !canGrantRole(who.adminRole, role)) return jsonError("Você não pode conceder essa função.", 403);
      const [existing] = await pool.query<TeamRow[]>("SELECT id,role FROM users WHERE email = ? LIMIT 1", [email]);
      if (existing[0]?.role === "admin") return jsonError("Este e-mail já é membro da equipe.", 409);
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 7 * 86400000);
      await pool.query("INSERT INTO admin_invites (email,name,active,token_hash,expires_at,role,status,invited_by,delivery_status,delivery_attempts,last_error_kind,last_attempt_id,provider_message_id,accepted_at) VALUES (?,?,1,?,?,?,'pending',?,'pending',0,NULL,NULL,NULL,NULL) ON DUPLICATE KEY UPDATE name=VALUES(name),active=1,token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),role=VALUES(role),status='pending',invited_by=VALUES(invited_by),delivery_status='pending',delivery_attempts=0,last_error_kind=NULL,last_attempt_id=NULL,provider_message_id=NULL,accepted_at=NULL", [email, name, hash(token), expires, role, who.user.id]);
      const result = await deliverInvite(pool, email, name, role, token, `invite-${email}-${expires.getTime()}`);
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_invite_created", email]);
      return NextResponse.json({ saved: true, delivery: result.delivery, attemptId: result.attemptId });
    }
    if (input.action === "resend-invite") {
      const email = String(input.email || "").trim().toLowerCase();
      const [rows] = await pool.query<TeamRow[]>("SELECT email,name,role,status,active,last_sent_at FROM admin_invites WHERE email=? LIMIT 1", [email]);
      const invite = rows[0];
      if (!invite || invite.status !== "pending") return jsonError("Convite pendente não encontrado.", 404);
      if (invite.last_sent_at && Date.now() - new Date(invite.last_sent_at).getTime() < 60_000) return jsonError("Aguarde 1 minuto antes de reenviar este convite.", 429);
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 7 * 86400000);
      await pool.query("UPDATE admin_invites SET active=1,token_hash=?,expires_at=?,status='pending',delivery_status='pending',last_error_kind=NULL,last_attempt_id=NULL,provider_message_id=NULL WHERE email=?", [hash(token), expires, email]);
      const result = await deliverInvite(pool, email, String(invite.name || ""), normalizeAdminRole(invite.role) as AdminRole, token, `invite-${email}-${expires.getTime()}`);
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_invite_resent", email]);
      return NextResponse.json({ saved: true, delivery: result.delivery, attemptId: result.attemptId });
    }
    if (input.action === "revoke-invite") {
      const email = String(input.email || "").trim().toLowerCase();
      await pool.query("UPDATE admin_invites SET active=0,status='revoked',token_hash=NULL WHERE email=?", [email]);
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_invite_revoked", email]);
      return NextResponse.json({ saved: true });
    }
    if (input.action === "update-member") {
      const userId = String(input.userId || "");
      const [rows] = await pool.query<TeamRow[]>("SELECT id,email,admin_role,account_status FROM users WHERE id=? AND role='admin' LIMIT 1", [userId]);
      const member = rows[0];
      if (!member) return jsonError("Membro não encontrado", 404);
      const currentRole = normalizeAdminRole(member.admin_role);
      const nextRole = input.role ? normalizeAdminRole(input.role) : currentRole;
      const nextStatus = input.status === "suspended" ? "suspended" : "active";
      if (member.id === who.user.id && (nextRole !== currentRole || nextStatus !== "active")) return jsonError("Você não pode reduzir ou suspender o próprio acesso.", 403);
      if (currentRole === "owner" && (nextRole !== "owner" || nextStatus !== "active")) {
        const [owners] = await pool.query<(RowDataPacket & { total: number })[]>("SELECT COUNT(*) AS total FROM users WHERE role='admin' AND admin_role='owner' AND account_status='active'");
        if (Number(owners[0]?.total || 0) <= 1) return jsonError("Mantenha pelo menos um proprietário ativo.", 409);
        if (who.adminRole !== "owner") return jsonError("Somente o proprietário pode alterar outro proprietário.", 403);
      }
      if (!canGrantRole(who.adminRole, nextRole)) return jsonError("Você não pode conceder essa função.", 403);
      await pool.query("UPDATE users SET admin_role=?,account_status=?,suspended_at=? WHERE id=?", [nextRole, nextStatus, nextStatus === "suspended" ? new Date() : null, userId]);
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_member_updated", `${member.email}:${nextRole}:${nextStatus}`]);
      return NextResponse.json({ saved: true });
    }
    if (input.action === "remove-member") {
      const userId = String(input.userId || "");
      const [rows] = await pool.query<TeamRow[]>("SELECT id,email,admin_role FROM users WHERE id=? AND role='admin' LIMIT 1", [userId]);
      const member = rows[0];
      if (!member) return jsonError("Membro não encontrado", 404);
      if (member.id === who.user.id || normalizeAdminRole(member.admin_role) === "owner") return jsonError("O proprietário não pode ser removido por esta ação.", 403);
      if (who.adminRole !== "owner" && !canGrantRole(who.adminRole, member.admin_role)) return jsonError("Você não pode remover este membro.", 403);
      await pool.query("UPDATE users SET role='student',admin_role='administrator',account_status='active',suspended_at=NULL WHERE id=?", [userId]);
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_member_removed", member.email]);
      return NextResponse.json({ saved: true });
    }
    return jsonError("Ação desconhecida");
  } catch (error) {
    const errorId = randomBytes(8).toString("hex");
    console.error("admin_team_write_failed", { errorId, code: (error as { code?: string }).code || "unknown" });
    return NextResponse.json({ error: "Não foi possível concluir a operação agora.", errorId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
