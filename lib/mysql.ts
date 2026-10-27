import "server-only";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável MySQL ausente: ${name}`);
  return value;
}

export function mysqlConfigured() {
  return Boolean(
    process.env.HOSTINGER_MYSQL_HOST &&
      process.env.HOSTINGER_MYSQL_DATABASE &&
      process.env.HOSTINGER_MYSQL_USER &&
      process.env.HOSTINGER_MYSQL_PASSWORD,
  );
}

export function mysqlPool() {
  if (!mysqlConfigured()) throw new Error("Banco MySQL não configurado");
  if (!pool) {
    pool = mysql.createPool({
      host: required("HOSTINGER_MYSQL_HOST"),
      port: Number(process.env.HOSTINGER_MYSQL_PORT || 3306),
      database: required("HOSTINGER_MYSQL_DATABASE"),
      user: required("HOSTINGER_MYSQL_USER"),
      password: required("HOSTINGER_MYSQL_PASSWORD"),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      timezone: "Z",
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function mysqlHealth() {
  if (!mysqlConfigured()) return false;
  const [rows] = await mysqlPool().query<RowDataPacket[]>("select 1 as ok");
  return rows[0]?.ok === 1;
}
