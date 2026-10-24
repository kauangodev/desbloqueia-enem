import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  verifySignature,
  verifyWebhookSecret,
  eventSchema,
  nextStatus,
} from "../lib/payment";
import { welcomeEmail } from "../lib/email";
import { checkoutConfigured } from "../lib/readiness";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333";
before(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
  );
  await db.exec(readFileSync("supabase/migrations/001_platform.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/002_catalog.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/003_cakto_launch.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/004_cakto_live_offers.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/005_security_hardening.sql", "utf8"));
  await db.exec(readFileSync("supabase/migrations/20261023120000_payment_amount.sql", "utf8"));
  await db.exec(
    readFileSync(
      "supabase/migrations/20261023041013_admin_invites_and_secure_self_provision.sql",
      "utf8",
    ),
  );
  await db.exec(
    `grant usage on schema public,auth to authenticated,anon;grant select,insert,update,delete on all tables in schema public to authenticated;grant execute on function auth.uid() to authenticated;update offers set cakto_product_id='product-'||plan,cakto_offer_id='offer-'||plan;insert into admin_invites(email,name) values('admin@example.test','Admin Teste');insert into auth.users(id,email) values('${alice}','alice@example.test'),('${bob}','bob@example.test'),('${admin}','admin@example.test');`,
  );
});
after(() => db.close());
test("checkout exige envio de acesso validado e todas as integrações", () => {
  const ready = { CHECKOUT_ENABLED: "true", AUTH_EMAIL_READY: "true", CAKTO_WEBHOOK_ENABLED: "true", CAKTO_WEBHOOK_SECRET: "test", NEXT_PUBLIC_SUPABASE_URL: "https://example.test", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test", SUPABASE_SERVICE_ROLE_KEY: "test" };
  assert.equal(checkoutConfigured(ready), true);
  for (const key of Object.keys(ready)) {
    assert.equal(checkoutConfigured({ ...ready, [key]: "" }), false, key);
  }
});
test("aprovação atualiza valor de pedido previamente pendente", async () => {
  await db.query("select receive_payment($1,$2::jsonb)", ["pix_gerado", { ...payload("pending-zero"), amount: null }]);
  await event("pending-zero", "purchase_approved");
  const [order] = await rows("select amount,status from orders where id='pending-zero'");
  assert.equal(Number(order.amount), 19.9);
  assert.equal(order.status, "paid");
});
test("metadados do cadastro não concedem administrador", async () => {
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('55555555-5555-4555-8555-555555555555','spoof@example.test','{"role":"admin"}');`);
  assert.equal((await rows("select role from profiles where email='spoof@example.test'"))[0].role, "student");
});
test("anônimo não pode chamar funções privilegiadas", async () => {
  await db.exec("set role anon");
  try {
    for (const query of ["select claim_emails()", "select take_rate_limit('bypass',3,900)", "select is_admin()", "select has_plan('premium')"])
      await assert.rejects(() => db.exec(query));
  } finally { await db.exec("reset role"); }
});
function payload(id: string, plan = "essencial", email = "alice@example.test") {
  return {
    id,
    status: "paid",
    customer: { email, name: "Estudante de teste" },
    product: { id: `product-${plan}` },
    offer: { id: `offer-${plan}` },
    amount: plan === "premium" ? 39.9 : 19.9,
    currency: "BRL",
  };
}
async function event(
  id: string,
  event: string,
  plan = "essencial",
  email = "alice@example.test",
) {
  await db.query("select receive_payment($1,$2::jsonb)", [
    event,
    payload(id, plan, email),
  ]);
}
async function rows(sql: string) {
  return (await db.query(sql)).rows as Record<string, unknown>[];
}
async function asUser(id: string, fn: () => Promise<void>) {
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);
  try {
    await fn();
  } finally {
    await db.exec("reset role;reset request.jwt.claim.sub;");
  }
}
test("HMAC válido, segredo inválido, corpo adulterado e replay antigo", () => {
  const raw = JSON.stringify({ event: "purchase_approved" }),
    time = "1000000",
    key = "test-only-secret";
  const sign =
    "v1=" + createHmac("sha256", key).update(`${time}.${raw}`).digest("hex");
  assert.ok(verifySignature(raw, time, sign, key, 1000000000));
  assert.equal(verifySignature(raw, time, sign, "wrong", 1000000000), false);
  assert.equal(verifySignature(raw + " ", time, sign, key, 1000000000), false);
  assert.equal(verifySignature(raw, time, sign, key, 1000400000), false);
  assert.equal(verifySignature(raw, "NaN", sign, key), false);
  assert.equal(verifyWebhookSecret(key, key), true);
  assert.equal(verifyWebhookSecret("wrong", key), false);
  assert.equal(verifyWebhookSecret(undefined, key), false);
});
test("payload V1/V2 e validação de dados", () => {
  assert.ok(
    eventSchema.safeParse({ event: "purchase_approved", data: payload("a") })
      .success,
  );
  assert.ok(
    eventSchema.safeParse({ event: "refund", data: [payload("a")] }).success,
  );
  assert.equal(
    eventSchema.safeParse({ event: "purchase_approved", data: { id: "x" } })
      .success,
    false,
  );
});
test("pagamento aprovado persiste evento, pedido, direito e email atomicamente", async () => {
  await event("approved", "purchase_approved");
  assert.equal(
    (await rows("select active from entitlements where order_id='approved'"))[0]
      .active,
    true,
  );
  assert.equal(
    (
      await rows(
        "select count(*)::int n from email_deliveries where order_id='approved'",
      )
    )[0].n,
    1,
  );
});
test("evento duplicado não duplica pedido ou entrega", async () => {
  await event("approved", "purchase_approved");
  await event("approved", "purchase_approved");
  assert.equal(
    (
      await rows(
        "select count(*)::int n from payment_events where order_id='approved'",
      )
    )[0].n,
    1,
  );
  assert.equal(
    (
      await rows(
        "select count(*)::int n from email_deliveries where order_id='approved'",
      )
    )[0].n,
    1,
  );
});
test("recusa e Pix pendente não liberam conteúdo", async () => {
  await event("refused", "purchase_refused");
  await event("pix", "pix_gerado");
  assert.equal(
    (
      await rows(
        "select count(*)::int n from entitlements where order_id in ('refused','pix') and active",
      )
    )[0].n,
    0,
  );
});
test("pedido pendente aceita amount nulo e usa baseAmount", async () => {
  const pending = { ...payload("pix-null"), amount: null, baseAmount: 19.9 };
  assert.ok(eventSchema.safeParse({ event: "pix_gerado", data: pending }).success);
  await db.query("select receive_payment($1,$2::jsonb)", ["pix_gerado", pending]);
  const [order] = await rows("select amount,status from orders where id='pix-null'");
  assert.equal(Number(order.amount), 19.9);
  assert.equal(order.status, "pending");
});
test("upgrade e reembolso preservam outro pedido válido", async () => {
  await event("upgrade", "purchase_approved", "premium");
  await event("approved", "refund");
  assert.equal(
    (await rows("select active from entitlements where order_id='approved'"))[0]
      .active,
    false,
  );
  assert.equal(
    (await rows("select active from entitlements where order_id='upgrade'"))[0]
      .active,
    true,
  );
});
test("aprovação atrasada após reembolso não reativa acesso", async () => {
  await event("refund-first", "refund");
  await event("refund-first", "purchase_approved");
  assert.equal(
    (
      await rows(
        "select active from entitlements where order_id='refund-first'",
      )
    )[0].active,
    false,
  );
  assert.equal(nextStatus("refunded", "purchase_approved"), "refunded");
});
test("chargeback revoga somente o pedido afetado", async () => {
  await event("cb", "purchase_approved");
  await event("cb", "chargeback");
  assert.equal(
    (await rows("select active from entitlements where order_id='cb'"))[0]
      .active,
    false,
  );
  assert.equal(
    (await rows("select active from entitlements where order_id='upgrade'"))[0]
      .active,
    true,
  );
});
test("aluno existente é vinculado, novo aluno recebe vínculo no trigger", async () => {
  await event("existing", "purchase_approved");
  assert.equal(
    (
      await rows("select user_id from entitlements where order_id='existing'")
    )[0].user_id,
    alice,
  );
  await event("new", "purchase_approved", "essencial", "new@example.test");
  assert.equal(
    (await rows("select user_id from entitlements where order_id='new'"))[0]
      .user_id,
    null,
  );
  await db.exec(
    "insert into auth.users(id,email) values('44444444-4444-4444-8444-444444444444','new@example.test')",
  );
  assert.ok(
    (await rows("select user_id from entitlements where order_id='new'"))[0]
      .user_id,
  );
});
test("convite administrativo promove somente o e-mail convidado", async () => {
  const [invited] = await rows(
    `select role,name from profiles where id='${admin}'`,
  );
  const [student] = await rows(`select role from profiles where id='${bob}'`);
  assert.equal(invited.role, "admin");
  assert.equal(invited.name, "Admin Teste");
  assert.equal(student.role, "student");
});
test("falha e retry de email preservam fila, lease impede concorrência", async () => {
  await db.exec("update email_deliveries set status='accepted'");
  await event("retry", "purchase_approved");
  let claimed = await rows("select * from claim_emails()");
  assert.equal(claimed.length, 1);
  assert.equal((await rows("select * from claim_emails()")).length, 0);
  await db.exec(
    "update email_deliveries set status='failed',leased_until=null,next_attempt=now() where order_id='retry'",
  );
  claimed = await rows("select * from claim_emails()");
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].attempts, 2);
});
test("RLS aluno não lê outro perfil, não se promove e não concede acesso", async () => {
  await asUser(bob, async () => {
    assert.equal((await rows("select * from profiles")).length, 1);
    await db.exec("update profiles set role='admin'");
    assert.equal((await rows("select role from profiles"))[0].role, "student");
    await assert.rejects(() =>
      db.exec(
        `insert into entitlements(order_id,user_id,email,plan,active) values('approved','${bob}','bob@example.test','premium',true)`,
      ),
    );
    await assert.rejects(() =>
      db.query("select receive_payment($1,$2::jsonb)", [
        "purchase_approved",
        payload("attack"),
      ]),
    );
  });
});
test("RLS material Premium só aparece para aluno autorizado/admin", async () => {
  await db.exec(
    "update materials set published=true,storage_path='private/test.pdf'",
  );
  await asUser(bob, async () =>
    assert.equal((await rows("select * from materials")).length, 0),
  );
  await asUser(alice, async () =>
    assert.equal((await rows("select * from materials")).length, 6),
  );
  await asUser(admin, async () =>
    assert.equal((await rows("select * from materials")).length, 6),
  );
});
test("RLS progresso tem limite de páginas e isolamento", async () => {
  await asUser(alice, async () => {
    await db.exec(
      `insert into reading_progress(user_id,material_id,page) values('${alice}','kit',5)`,
    );
    await assert.rejects(() =>
      db.exec(`update reading_progress set page=999 where material_id='kit'`),
    );
  });
  await asUser(bob, async () =>
    assert.equal((await rows("select * from reading_progress")).length, 0),
  );
});
test("rate limit é persistente", async () => {
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await rows("select take_rate_limit('test',3,900) allowed"))[0].allowed,
      true,
    );
  assert.equal(
    (await rows("select take_rate_limit('test',3,900) allowed"))[0].allowed,
    false,
  );
});
test("biblioteca preserva índice e fontes seguras", () => {
  const data = JSON.parse(readFileSync("data/library.json", "utf8"));
  assert.equal(data.length, 1800);
  assert.equal(
    data.filter((e: { resolucao_autoral: string }) => e.resolucao_autoral)
      .length,
    7,
  );
  assert.equal(new Set(data.map((e: { id: string }) => e.id)).size, 1800);
});
test("e-mail de acesso usa marca e não envia senha", () => {
  const html = welcomeEmail("https://example.test");
  assert.ok(html.includes("GoDev"));
  assert.ok(html.includes("https://example.test/entrar"));
  assert.ok(!html.includes("password="));
});
