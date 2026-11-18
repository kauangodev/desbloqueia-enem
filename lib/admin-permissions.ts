export const adminRoles = ["owner", "administrator", "content_editor", "pedagogical", "support"] as const;
export type AdminRole = (typeof adminRoles)[number];
export type AdminPermission =
  | "overview.read"
  | "students.read"
  | "students.manage"
  | "team.read"
  | "team.manage"
  | "content.read"
  | "content.manage"
  | "assessments.manage"
  | "support.manage"
  | "settings.manage";

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "Proprietário",
  administrator: "Administrador",
  content_editor: "Editor de conteúdo",
  pedagogical: "Equipe pedagógica",
  support: "Suporte",
};

const matrix: Record<AdminRole, readonly AdminPermission[]> = {
  owner: ["overview.read", "students.read", "students.manage", "team.read", "team.manage", "content.read", "content.manage", "assessments.manage", "support.manage", "settings.manage"],
  administrator: ["overview.read", "students.read", "students.manage", "team.read", "team.manage", "content.read", "content.manage", "assessments.manage", "support.manage"],
  content_editor: ["overview.read", "content.read", "content.manage"],
  pedagogical: ["overview.read", "students.read", "content.read", "assessments.manage"],
  support: ["overview.read", "students.read", "support.manage"],
};

/**
 * Interpretação ESTRITA do papel. Só são aceitos os cinco papéis e o mapeamento explícito de contas antigas: valor vazio (conta criada
 * antes de `admin_role`) e "admin" valem Administrador. Qualquer outro texto é desconhecido e **falha fechado** (null).
 */
export function parseAdminRole(value: unknown): AdminRole | null {
  const role = String(value ?? "").trim().toLowerCase();
  if ((adminRoles as readonly string[]).includes(role)) return role as AdminRole;
  if (role === "" || role === "admin") return "administrator";
  return null;
}

/** Para exibição e valores de entrada: papel desconhecido vira o de MENOR privilégio (nunca Administrador). Permissões usam `parseAdminRole`. */
export function normalizeAdminRole(value: unknown): AdminRole {
  return parseAdminRole(value) ?? "support";
}

export function hasAdminPermission(role: unknown, permission: AdminPermission) {
  const parsed = parseAdminRole(role);
  return parsed ? matrix[parsed].includes(permission) : false;
}

export function canGrantRole(actor: unknown, target: unknown) {
  const current = parseAdminRole(actor);
  const requested = parseAdminRole(target);
  if (!current || !requested) return false;
  if (current === "owner") return true;
  return current === "administrator" && requested !== "owner";
}