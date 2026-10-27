import { identity, serviceClient } from "../../../lib/supabase";
import { sameOrigin, jsonError } from "../../../lib/http";
import { NextResponse } from "next/server";
import { z } from "zod";
const plan = z.enum(["essencial", "premium"]);
const support = z.object({
  name: z.string().max(100),
  email: z.union([z.email(), z.literal("")]),
  whatsapp: z.string().regex(/^(55\d{10,11})?$/),
  message: z.string().max(300),
  hours: z.string().max(200),
  enabled: z.boolean(),
  legal_name: z.string().max(180),
  legal_document: z.string().max(30),
});
const material = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/),
  title: z.string().min(1).max(180),
  description: z.string().max(800),
  category: z.enum([
    "Revisão",
    "Cronograma",
    "Linguagens",
    "Humanas",
    "Natureza",
    "Matemática",
    "Simulados",
    "Exercícios",
    "Redação",
    "Checklists",
  ]),
  plan,
  pages: z.number().int().min(1).max(5000),
  cover: z.string().regex(/^\/covers\/(?:[a-z0-9-]+\/)?[a-z0-9-]+\.(?:png|jpg|webp)$/),
  published: z.boolean(),
  downloadable: z.boolean(),
  storage_path: z
    .string()
    .regex(/^private\/[A-Za-z0-9_-]+\.pdf$/)
    .nullable(),
  public_sample_url: z
    .string()
    .regex(/^\/samples\/[a-z0-9-]+\.pdf$/)
    .nullable(),
});
const product = z.object({
  id: plan,
  name: z.string().min(1).max(80),
  description: z.string().max(300),
  price_cents: z.number().int().positive().max(1000000),
  features: z.array(z.string().min(1).max(200)).min(1).max(15),
});
const offer = z.object({
  plan,
  cakto_product_id: z.string().max(120).nullable(),
  cakto_offer_id: z.string().max(120).nullable(),
  checkout_url: z.string().max(500).nullable(),
  enabled: z.boolean(),
});
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (who?.profile?.role !== "admin")
    return jsonError("Acesso administrativo necessário", 403);
  if (Number(req.headers.get("content-length") || 0) > 32768)
    return jsonError("Solicitação muito grande", 413);
  const input = await req.json().catch(() => null);
  if (!input) return jsonError("Dados inválidos");
  const db = serviceClient();
  try {
    let target = "";
    if (input.action === "support") {
      const v = support.parse(input.data);
      if (v.enabled && !v.whatsapp)
        throw new Error("Informe um WhatsApp válido.");
      const { error } = await db
        .from("support_settings")
        .update(v)
        .eq("id", true);
      if (error) throw error;
      target = "support";
    } else if (input.action === "product") {
      const v = product.parse(input.data);
      const { error } = await db.from("products").update(v).eq("id", v.id);
      if (error) throw error;
      target = v.id;
    } else if (input.action === "offer") {
      const v = offer.parse(input.data);
      if (v.checkout_url) {
        const u = new URL(v.checkout_url);
        if (
          u.protocol !== "https:" ||
          u.hostname !== "pay.cakto.com.br" ||
          u.username ||
          u.password
        )
          throw new Error("Use um checkout oficial pay.cakto.com.br.");
      }
      if (
        v.enabled &&
        (!v.cakto_product_id || !v.cakto_offer_id || !v.checkout_url)
      )
        throw new Error("Preencha os identificadores e o checkout.");
      const { error } = await db.from("offers").upsert(v, { onConflict: "plan" });
      if (error) throw error;
      target = v.plan;
    } else if (input.action === "material") {
      const v = material.parse(input.data);
      if (v.published && !v.storage_path)
        throw new Error("Envie o PDF antes de publicar.");
      if (v.published && v.storage_path) {
        const signed = await db.storage
          .from("materials")
          .download(v.storage_path);
        if (signed.error) throw new Error("Arquivo privado não encontrado.");
        const signature = await signed.data.slice(0, 5).text();
        if (signature !== "%PDF-") throw new Error("O arquivo enviado não é um PDF válido.");
      }
      const { data: old } = await db
        .from("materials")
        .select("version,storage_path")
        .eq("id", v.id)
        .maybeSingle();
      const version =
        old && old.storage_path !== v.storage_path
          ? old.version + 1
          : old?.version || 1;
      const { error } = await db.from("materials").upsert({ ...v, version });
      if (error) throw error;
      target = v.id;
    } else if (input.action === "upload") {
      const key = `private/${crypto.randomUUID()}.pdf`;
      const { data, error } = await db.storage
        .from("materials")
        .createSignedUploadUrl(key);
      if (error || !data) throw new Error("Upload indisponível");
      return NextResponse.json({
        path: key,
        token: data.token,
        signedUrl: data.signedUrl,
      });
    } else if (input.action === "resend") {
      if (!process.env.RESEND_API_KEY || !process.env.CRON_SECRET)
        return jsonError("O envio de boas-vindas ainda não está configurado. O acesso usa o link solicitado na página Entrar.", 503);
      const id = z.uuid().parse(input.data.id);
      const { data: job } = await db
        .from("email_deliveries")
        .select("order_id")
        .eq("id", id)
        .single();
      if (!job) throw new Error("Entrega não encontrada.");
      const { data: order } = await db
        .from("orders")
        .select("status")
        .eq("id", job.order_id)
        .single();
      if (order?.status !== "paid") throw new Error("Pedido sem acesso ativo.");
      const { error } = await db
        .from("email_deliveries")
        .update({
          status: "pending",
          attempts: 0,
          next_attempt: new Date().toISOString(),
          leased_until: null,
        })
        .eq("id", id);
      if (error) throw error;
      target = id;
    } else return jsonError("Ação desconhecida");
    await db
      .from("audit_logs")
      .insert({ actor: who.user.id, action: input.action, target });
    return NextResponse.json({ saved: true });
  } catch (e) {
    return jsonError(
      e instanceof z.ZodError
        ? "Confira os campos informados."
        : e instanceof Error
          ? e.message
          : "Não foi possível salvar.",
      400,
    );
  }
}
