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

export function normalizeAdminRole(value: unknown): AdminRole {
  const role = String(value || "").trim().toLowerCase() as AdminRole;
  return adminRoles.includes(role) ? role : "administrator";
}

export function hasAdminPermission(role: unknown, permission: AdminPermission) {
  return matrix[normalizeAdminRole(role)].includes(permission);
}

export function canGrantRole(actor: unknown, target: unknown) {
  const current = normalizeAdminRole(actor);
  const requested = normalizeAdminRole(target);
  if (current === "owner") return true;
  return current === "administrator" && requested !== "owner";
}
