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
    // Uma consulta só: visitantes distintos (navegador) e contagens (servidor) por nome de evento.
    const [rows] = await mysqlPool().query<RowDataPacket[]>(`SELECT name, COUNT(*) AS total, COUNT(DISTINCT visitor_id) AS visitors FROM funnel_events WHERE ${win} GROUP BY name`);
    const by = new Map(rows.map((r) => [String(r.name), r]));
    const distinct = (name: string) => Number(by.get(name)?.visitors ?? 0);
    const count = (name: string) => Number(by.get(name)?.total ?? 0);
    const [visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases] = [
      distinct("landing_viewed"), distinct("demo_started"), distinct("plans_viewed"), count("signup_verified"), count("first_study_completed"), count("checkout_started"), count("purchase_confirmed"),
    ];
    return { counts: { visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases }, rates: funnelRates({ visitors, demoVisitors, planViewers, signupsVerified, firstStudy, checkouts, purchases }) };
  } catch { return null; }
}