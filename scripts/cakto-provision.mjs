import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const config = JSON.parse(
  await readFile(resolve(root, "config/cakto-products.json"), "utf8"),
);
const apply = process.argv.includes("--apply");
const base = "https://api.cakto.com.br/public_api";

if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", ...config }, null, 2));
  process.exit(0);
}

const clientId = process.env.CAKTO_CLIENT_ID;
const clientSecret = process.env.CAKTO_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error("Defina CAKTO_CLIENT_ID e CAKTO_CLIENT_SECRET no ambiente local.");
}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`Cakto ${response.status} em ${path}: ${JSON.stringify(body)}`);
  }
  return body;
}

const tokenResponse = await request("/token/", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
});
const token = tokenResponse.access_token;
if (!token) throw new Error("A Cakto não retornou um access_token.");
const auth = { Authorization: `Bearer ${token}` };
const jsonHeaders = { ...auth, "Content-Type": "application/json" };

const created = [];
for (const product of config.products) {
  const listed = await request(
    `/products/?search=${encodeURIComponent(product.name)}&limit=50`,
    { headers: auth },
  );
  let remote = listed.results?.find((item) => item.name === product.name);
  if (!remote) {
    remote = await request("/products/", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        price: product.price,
        currency: "BRL",
        type: "unique",
        salesPage: config.salesPage,
        emailAccessLink: config.accessPage,
        contentDeliveries: ["external"],
        paymentMethods: ["pix", "credit_card", "boleto"],
      }),
    });
  }

  let offer = remote.offers?.find((item) => item.default);
  if (!offer) {
    const offers = await request(
      `/offers/?product=${encodeURIComponent(remote.id)}&default=true&limit=20`,
      { headers: auth },
    );
    offer = offers.results?.[0];
  }
  if (!offer) throw new Error(`Oferta padrão não encontrada para ${product.name}.`);

  offer = await request(`/offers/${encodeURIComponent(offer.id)}/`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({
      name: product.name,
      price: Number(product.price),
      image: product.coverUrl,
      currency: "BRL",
      units: 1,
      status: "active",
      type: "unique",
      intervalType: "lifetime",
      interval: 1,
    }),
  });

  created.push({
    plan: product.plan,
    productId: remote.id,
    offerId: offer.id,
    checkoutUrl: `https://pay.cakto.com.br/${offer.id}`,
    coverUrl: product.coverUrl,
  });
}

const webhookName = "Desbloqueia ENEM — pagamentos";
const webhookList = await request("/webhook/?limit=100", { headers: auth });
let webhook = webhookList.results?.find((item) => item.name === webhookName);
if (!webhook) {
  webhook = await request("/webhook/", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      name: webhookName,
      url: config.webhookUrl,
      products: created.map((item) => item.productId),
      events: [
        "purchase_approved",
        "purchase_refused",
        "refund",
        "chargeback",
        "pix_gerado",
        "boleto_gerado",
        "picpay_gerado"
      ],
    }),
  });
}

const result = {
  generatedAt: new Date().toISOString(),
  products: created,
  webhook: {
    id: webhook.id,
    url: webhook.url,
    secret: webhook.fields?.secret || null,
  },
};
await mkdir(resolve(root, "private"), { recursive: true });
const output = resolve(root, "private/cakto-provision-result.json");
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
console.log(`Configuração salva localmente em ${output}.`);
console.log(JSON.stringify({ ...result, webhook: { ...result.webhook, secret: result.webhook.secret ? "[saved locally]" : null } }, null, 2));
