import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { authUrl, claimProblems, pkce, safeRedirect, verifyRs256 } from "../lib/auth/google";

const claims = { iss: "https://accounts.google.com", aud: "cid", sub: "123", exp: 2000, nonce: "n1", email: "a@b.co", email_verified: true };

test("claims: aceita o válido e recusa emissor, audiência, expiração, nonce e e-mail não verificado", () => {
  const ok = { clientId: "cid", nonce: "n1", nowSeconds: 1000 };
  assert.deepEqual(claimProblems(claims, ok), []);
  assert.ok(claimProblems({ ...claims, iss: "https://evil.example" }, ok).length);
  assert.ok(claimProblems({ ...claims, aud: "outro" }, ok).length);
  assert.ok(claimProblems({ ...claims, exp: 999 }, ok).length);
  assert.ok(claimProblems(claims, { ...ok, nonce: "x" }).length);
  assert.ok(claimProblems({ ...claims, email_verified: false }, ok).length);
  assert.ok(claimProblems({ ...claims, sub: undefined }, ok).length);
});

test("assinatura RS256: válida passa; payload adulterado, chave errada e alg 'none' falham", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1" } as never;
  const make = (payload: object, alg = "RS256", key = privateKey) => {
    const h = Buffer.from(JSON.stringify({ alg, kid: "k1" })).toString("base64url");
    const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${h}.${p}.${sign("RSA-SHA256", Buffer.from(`${h}.${p}`), key).toString("base64url")}`;
  };
  const token = make(claims);
  assert.equal(verifyRs256(token, { keys: [jwk] })?.sub, "123");
  const [h, , s] = token.split(".");
  const tampered = `${h}.${Buffer.from(JSON.stringify({ ...claims, sub: "999" })).toString("base64url")}.${s}`;
  assert.equal(verifyRs256(tampered, { keys: [jwk] }), null);
  const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.equal(verifyRs256(make(claims, "RS256", other.privateKey), { keys: [jwk] }), null);
  assert.equal(verifyRs256(make(claims, "none"), { keys: [jwk] }), null);
});

test("redirect pós-login: só caminhos internos conhecidos", () => {
  assert.equal(safeRedirect("/aluno/trilha"), "/aluno/trilha");
  for (const bad of ["//evil.example", "https://evil.example", "/\\evil", "/outra-area", "", null, "/aluno\n/x"]) assert.equal(safeRedirect(bad), "/aluno");
});

test("url de autorização: code + PKCE S256 + state + nonce e escopos mínimos", () => {
  const { challenge } = pkce();
  const url = new URL(authUrl({ clientId: "cid", redirectUri: "https://x.example/cb", state: "s", nonce: "n", challenge }));
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "s");
  assert.equal(url.searchParams.get("nonce"), "n");
});
