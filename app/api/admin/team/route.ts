import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { identity } from "../../../../lib/supabase";
import { mysqlPool } from "../../../../lib/mysql";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { adminRoleLabels, canGrantRole, hasAdminPermission, normalizeAdminRole, type AdminRole } from "../../../../lib/admin-permissions";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = new Set(Object.keys(adminRoleLabels));
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
type TeamRow = RowDataPacket & { id: string; email: string; name: string; role?: string; admin_role?: string; account_status?: string };

async function actor() {
  const who = await identity();
  const role = normalizeAdminRole((who?.profile as { admin_role?: string } | null)?.admin_role || (who?.profile?.role === "admin" ? "administrator" : "support"));
  return who ? { ...who, adminRole: role } : null;
}

export async function GET() {
  const who = await actor();
  if (!who || !hasAdminPermission(who.adminRole, "team.read")) return jsonError("Acesso à equipe não autorizado", 403);
  try {
    const [members] = await mysqlPool().query<TeamRow[]>("SELECT id,name,email,admin_role,account_status,created_at,updated_at FROM users WHERE role = 'admin' ORDER BY name,email");
    const [invites] = await mysqlPool().query<TeamRow[]>("SELECT email,name,role,status,expires_at,last_sent_at,created_at,accepted_at FROM admin_invites ORDER BY updated_at DESC, created_at DESC");
    return NextResponse.json({ members, invites, roles: adminRoleLabels });
  } catch (error) {
    console.error("admin_team_list_failed", { code: (error as { code?: string }).code || "unknown" });
    return jsonError("O módulo de equipe ainda precisa da migração administrativa no banco.", 503);
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
      await pool.query("INSERT INTO admin_invites (email,name,active,token_hash,expires_at,role,status,invited_by,last_sent_at) VALUES (?,?,1,?,?,?,'pending',?,CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE name=VALUES(name),active=1,token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),role=VALUES(role),status='pending',invited_by=VALUES(invited_by),last_sent_at=CURRENT_TIMESTAMP(3),accepted_at=NULL", [email, name, hash(token), expires, role, who.user.id]);
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM?.trim();
      let delivery = "pending";
      if (apiKey && from) {
        const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://godeveducation.com.br"}/convite?token=${token}`;
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: email, subject: "Convite para a equipe | GoDev Education", html: `<p>Olá, ${name}.</p><p>Você recebeu um convite para acessar a equipe GoDev Education como <b>${adminRoleLabels[role]}</b>.</p><p><a href="${url}">Aceitar convite e criar acesso</a></p><p>O link expira em 7 dias. Nenhuma senha é enviada por e-mail.</p>` }) });
        delivery = response.ok ? "sent" : "failed";
      }
      await pool.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [who.user.id, "team_invite_created", email]);
      return NextResponse.json({ saved: true, delivery });
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
    console.error("admin_team_write_failed", { code: (error as { code?: string }).code || "unknown" });
    return jsonError("Não foi possível concluir a operação. Verifique a migração administrativa.", 503);
  }
}
