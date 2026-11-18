import assert from "node:assert/strict";
import test from "node:test";
import { canGrantRole, hasAdminPermission, normalizeAdminRole, parseAdminRole } from "../lib/admin-permissions";

test("papéis conhecidos e contas antigas (vazio/admin = Administrador) são aceitos", () => {
  for (const role of ["owner", "administrator", "content_editor", "pedagogical", "support"]) assert.equal(parseAdminRole(role), role);
  assert.equal(parseAdminRole(" Owner "), "owner");
  assert.equal(parseAdminRole(""), "administrator");
  assert.equal(parseAdminRole(null), "administrator");
  assert.equal(parseAdminRole(undefined), "administrator");
  assert.equal(parseAdminRole("admin"), "administrator");
});

test("papel desconhecido FALHA FECHADO: nenhuma permissão, nenhuma concessão, nunca Administrador", () => {
  for (const bad of ["superuser", "root", "owner2", "administratorx", "guest", "123"]) {
    assert.equal(parseAdminRole(bad), null, bad);
    assert.equal(hasAdminPermission(bad, "overview.read"), false, bad);
    assert.equal(hasAdminPermission(bad, "content.manage"), false, bad);
    assert.equal(canGrantRole(bad, "support"), false, bad);
    assert.equal(canGrantRole("owner", bad), false, bad);
    assert.equal(normalizeAdminRole(bad), "support", "exibição/entrada: menor privilégio");
  }
});

test("matriz de permissões por papel", () => {
  assert.equal(hasAdminPermission("owner", "settings.manage"), true);
  assert.equal(hasAdminPermission("administrator", "settings.manage"), false);
  assert.equal(hasAdminPermission("content_editor", "content.manage"), true);
  assert.equal(hasAdminPermission("content_editor", "students.read"), false);
  assert.equal(hasAdminPermission("pedagogical", "assessments.manage"), true);
  assert.equal(hasAdminPermission("pedagogical", "content.manage"), false);
  assert.equal(hasAdminPermission("support", "support.manage"), true);
  assert.equal(hasAdminPermission("support", "team.manage"), false);
  assert.equal(canGrantRole("administrator", "owner"), false);
  assert.equal(canGrantRole("administrator", "support"), true);
  assert.equal(canGrantRole("support", "support"), false);
});
