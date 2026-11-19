// Cadastra e ativa as ofertas Pix a partir dos dois arquivos com o "Copia e Cola" decodificado dos QR Codes do proprietário.
// Uso (com as variáveis HOSTINGER_MYSQL_* do ambiente apontando para o banco certo, DEPOIS do backup e das migrações 06 e 07):
//   npx tsx scripts/pix-cadastrar.ts <essencial.txt> <premium.txt> [--aplicar]
// Sem --aplicar só valida e mostra o resumo. O código nunca é impresso; o valor e o recebedor vêm do próprio código (CRC, valor e nome conferidos).
// Idempotente: se já existe oferta ativa do plano com o mesmo código, não duplica.
import { readFileSync } from "node:fs";
import { createPool, type RowDataPacket } from "mysql2/promise";
import { parsePix, validatePixOffer } from "../lib/pix/payload";

const [essencialFile, premiumFile, flag] = process.argv.slice(2);
if (!essencialFile || !premiumFile) { console.error("Uso: npx tsx scripts/pix-cadastrar.ts <essencial.txt> <premium.txt> [--aplicar]"); process.exit(2); }
const EXPECTED = { essencial: 1090, premium: 1990 } as const;

async function main() {
  const plans = [["essencial", essencialFile], ["premium", premiumFile]] as const;
  const parsed = plans.map(([tier, file]) => {
    const code = readFileSync(file, "utf8").trim();
    const info = parsePix(code);
    const problems = info ? validatePixOffer(code, { cents: EXPECTED[tier], receiverName: info.receiverName }) : ["não é Pix Copia e Cola válido"];
    console.log(`${tier}: valor esperado ${EXPECTED[tier]} centavos | código ${info ? `valor ${info.amountCents}, CRC ${info.crcOk ? "ok" : "INVÁLIDO"}` : "ilegível"} | ${problems.length ? "PROBLEMAS: " + problems.join("; ") : "válido"}`);
    return { tier, code, info, problems };
  });
  if (parsed.some((p) => p.problems.length || !p.info)) { console.error("Há problemas: nada foi gravado."); process.exit(1); }
  if (flag !== "--aplicar") { console.log("Validação concluída. Rode de novo com --aplicar para gravar."); return; }
  const env = process.env;
  if (!env.HOSTINGER_MYSQL_HOST || !env.HOSTINGER_MYSQL_DATABASE || !env.HOSTINGER_MYSQL_USER) { console.error("Defina HOSTINGER_MYSQL_HOST, _DATABASE, _USER e _PASSWORD."); process.exit(1); }
  const pool = createPool({ host: env.HOSTINGER_MYSQL_HOST, port: Number(env.HOSTINGER_MYSQL_PORT) || 3306, database: env.HOSTINGER_MYSQL_DATABASE, user: env.HOSTINGER_MYSQL_USER, password: env.HOSTINGER_MYSQL_PASSWORD, connectTimeout: 10_000 });
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    for (const p of parsed) {
      const [same] = await c.query<RowDataPacket[]>("SELECT code FROM pix_offers WHERE tier = ? AND status = 'ativa' AND copy_paste = ? LIMIT 1", [p.tier, p.code]);
      if (same[0]) { console.log(`${p.tier}: já ativa (${same[0].code}), nada a fazer.`); continue; }
      const [max] = await c.query<RowDataPacket[]>("SELECT COALESCE(MAX(version),0) AS v FROM pix_offers WHERE tier = ? FOR UPDATE", [p.tier]);
      const version = Number(max[0].v) + 1;
      const code = `${p.tier}-v${version}`;
      await c.query("UPDATE pix_offers SET status = 'encerrada' WHERE tier = ? AND status = 'ativa'", [p.tier]);
      await c.query("INSERT INTO pix_offers (code,tier,version,cents,status,receiver_name,copy_paste,review_minutes,activated_by,activated_at) VALUES (?,?,?,?, 'ativa', ?,?,?, 'script:pix-cadastrar', CURRENT_TIMESTAMP(3))", [code, p.tier, version, EXPECTED[p.tier], p.info!.receiverName, p.code, 60]);
      await c.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", ["script:pix-cadastrar", "pix.offer.activate", code]);
      console.log(`${p.tier}: oferta ${code} ativada.`);
    }
    await c.commit();
  } catch (error) { await c.rollback(); throw error; } finally { c.release(); }
}
main().then(() => process.exit(0), (error) => { console.error("Falhou:", (error as Error).message); process.exit(1); });
