import "server-only";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function required(name: string) {
  const value = envValue(name);
  if (!value) throw new Error(`Variável MySQL ausente: ${name}`);
  return value;
}

function requiredSecret(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável MySQL ausente: ${name}`);
  return value;
}

function mysqlPassword() {
  return process.env.HOSTINGER_MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? requiredSecret("HOSTINGER_MYSQL_PASSWORD");
}

export function mysqlConfigured() {
  return Boolean(
    envValue("HOSTINGER_MYSQL_HOST", "DB_HOST") &&
      envValue("HOSTINGER_MYSQL_DATABASE", "DB_NAME") &&
      envValue("HOSTINGER_MYSQL_USER", "DB_USER") &&
      (process.env.HOSTINGER_MYSQL_PASSWORD ?? process.env.DB_PASSWORD),
  );
}

function mysqlHost() {
  return envValue("HOSTINGER_MYSQL_HOST", "DB_HOST") || "localhost";
}

function mysqlPort() {
  return Number(envValue("HOSTINGER_MYSQL_PORT", "DB_PORT") || 3306);
}

export function mysqlPool() {
  if (!mysqlConfigured()) throw new Error("Banco MySQL não configurado");
  if (!pool) {
    pool = mysql.createPool({
      host: mysqlHost(),
      port: mysqlPort(),
      database: envValue("HOSTINGER_MYSQL_DATABASE", "DB_NAME") || required("HOSTINGER_MYSQL_DATABASE"),
      user: envValue("HOSTINGER_MYSQL_USER", "DB_USER") || required("HOSTINGER_MYSQL_USER"),
      // mysql2 receives structured credentials; URL percent-encoding is neither
      // needed nor desirable here. Preserve the secret exactly as configured.
      password: mysqlPassword(),
      connectTimeout: 10_000,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      timezone: "Z",
      dateStrings: ["DATE"],
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

