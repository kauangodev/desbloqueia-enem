import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../mysql";
import { funnelRates } from "../funnel/model";

/**
 * Funil dos últimos 30 dias a partir de `funnel_events`. Visitantes (ids aleatórios, só com consentimento) vêm do navegador;
 * cadastro verificado, primeiro estudo, checkout e compra vêm do servidor e contam contas/pedidos únicos (chave única por conta/pedido).
 * Devolve null se a tabela ainda não existe (migração 07 pendente): a tela mostra "sem dados", nunca zero.
 */
export async function funnelSummary() {
  try {
    const win = "created_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 DAY)";
    const one = async (sql: string) => Number(((await mysqlPool().query<RowDataPacket[]>(sql))[0][0]?.n) ?? 0);
    const distinct = (name: string) => one(`SELECT COUNT(DISTINCT visitor_id) AS n FROM funnel_events WHERE name = '${name}' AND visitor_id IS NOT NULL AND ${win}`);
    const count = (name: string) => one(`SELECT COUNT(*) AS n FROM funnel_events WHERE name = '${name}' AND ${win}`);
    const [visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases] = await Promise.all([
      distinct("landing_viewed"), distinct("demo_started"), distinct("plans_viewed"), count("signup_verified"), count("first_study_completed"), count("checkout_started"), count("purchase_confirmed"),
    ]);
    return { counts: { visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases }, rates: funnelRates({ visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases }) };
  } catch { return null; }
}