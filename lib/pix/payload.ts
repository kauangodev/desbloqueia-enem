/**
 * Validação do "Pix Copia e Cola" (BR Code EMV) gerado pelo banco do proprietário. Puro e sem I/O.
 * Confere CRC16, valor (tag 54), nome do recebedor (tag 59) e se o código é estático (tag 01 = 11) ou dinâmico (12).
 * A GoDev NÃO gera o código: só confere o que o banco gerou e renderiza o QR a partir do mesmo texto.
 */
export type PixInfo = { crcOk: boolean; amountCents: number | null; receiverName: string; city: string; initiation: "estatico" | "dinamico" | "desconhecido"; hasPixKeyField: boolean };

type Tlv = { id: string; value: string };

function tlv(text: string): Tlv[] | null {
  const out: Tlv[] = [];
  let i = 0;
  while (i < text.length) {
    if (i + 4 > text.length) return null;
    const id = text.slice(i, i + 2);
    const len = Number(text.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(len) || i + 4 + len > text.length) return null;
    out.push({ id, value: text.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  return out;
}

export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function parsePix(raw: string): PixInfo | null {
  const text = raw.trim();
  if (text.length < 30 || text.length > 600 || !text.startsWith("000201")) return null;
  const fields = tlv(text);
  if (!fields || fields[fields.length - 1].id !== "63") return null;
  const body = text.slice(0, text.length - 4);
  const crcOk = crc16(body) === text.slice(-4).toUpperCase();
  const get = (id: string) => fields.find((f) => f.id === id)?.value;
  const amount = get("54");
  const init = get("01");
  const account = fields.filter((f) => f.id >= "26" && f.id <= "51").map((f) => tlv(f.value) ?? []);
  const isPix = account.some((sub) => sub.some((s) => s.id === "00" && s.value.toLowerCase() === "br.gov.bcb.pix"));
  if (!isPix) return null;
  return {
    crcOk,
    amountCents: amount && /^\d+(\.\d{1,2})?$/.test(amount) ? Math.round(Number(amount) * 100) : null,
    receiverName: get("59") ?? "",
    city: get("60") ?? "",
    initiation: init === "11" ? "estatico" : init === "12" ? "dinamico" : "desconhecido",
    hasPixKeyField: account.some((sub) => sub.some((s) => s.id === "01" && s.value.length > 0)),
  };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();

/** Problemas que impedem ativar a oferta. Vazio = pode ir para a prévia com o aplicativo do banco. */
export function validatePixOffer(raw: string, expected: { cents: number; receiverName: string }): string[] {
  const info = parsePix(raw);
  if (!info) return ["não é um Pix Copia e Cola válido"];
  const problems: string[] = [];
  if (!info.crcOk) problems.push("CRC inválido (o texto foi alterado ou copiado incompleto)");
  if (info.amountCents === null) problems.push("o código não traz valor fixo; o aluno poderia pagar qualquer quantia");
  else if (info.amountCents !== expected.cents) problems.push(`valor do código (${info.amountCents} centavos) difere do valor da oferta (${expected.cents})`);
  if (!info.receiverName) problems.push("o código não informa o nome do recebedor");
  else if (norm(info.receiverName) !== norm(expected.receiverName)) problems.push("nome do recebedor no código difere do configurado");
  return problems;
}
