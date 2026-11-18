import "server-only";
import { hasAdminPermission, type AdminPermission } from "../admin-permissions";
import { identity } from "../supabase";

/** Administrador com a permissão pedida (papel desconhecido falha fechado). Devolve a identidade ou null. */
export async function requireAdmin(permission: AdminPermission) {
  const who = await identity();
  if (!who || who.profile?.role !== "admin") return null;
  const role = (who.profile as { admin_role?: string | null }).admin_role ?? (who.user as { admin_role?: string | null }).admin_role;
  return hasAdminPermission(role, permission) ? who : null;
}
