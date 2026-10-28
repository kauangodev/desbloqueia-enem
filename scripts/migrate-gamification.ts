import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";

const apply = process.argv.includes("--apply");
const migration = "04-gamification";
const database = process.env.HOSTINGER_MYSQL_DATABASE || process.env.DB_NAME;
const user = process.env.HOSTINGER_MYSQL_USER || process.env.DB_USER;
const password = process.env.HOSTINGER_MYSQL_PASSWORD ?? process.env.DB_PASSWORD;
if (!database || !user || password === undefined) throw new Error("Configure as variáveis MySQL no ambiente do executor. Nenhum segredo deve ser passado pela linha de comando.");
const pool = mysql.createPool({ host: process.env.HOSTINGER_MYSQL_HOST || process.env.DB_HOST || "localhost", port: Number(process.env.HOSTINGER_MYSQL_PORT || process.env.DB_PORT || 3306), database, user, password, connectionLimit: 1, timezone: "Z" });
const expected = { gamification_events: ["id", "user_id", "event_key", "event_type", "source_id", "xp", "rule_version", "occurred_at"], gamification_goals: ["user_id", "daily_target", "weekly_target", "updated_at"] };

async function main() {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [parents] = await connection.query<RowDataPacket[]>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'");
    if (!parents.length) throw new Error("Schema base users ausente; migração não aplicada.");
    const sql = await readFile("scripts/hostinger-mysql-schema-04-gamification.sql", "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (apply) {
      const [locks] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK(?, 10) AS acquired", [`godev:${database}:migrate`]);
      if (Number(locks[0]?.acquired) !== 1) throw new Error("Outro executor está migrando este banco.");
      locked = true;
      // MySQL DDL commits implicitamente; não anunciar rollback transacional.
      for (const statement of sql.split(";").map((value) => value.trim()).filter(Boolean)) await connection.query(statement);
    }
    const missing: string[] = [];
    for (const [table, columns] of Object.entries(expected)) {
      const [found] = await connection.query<RowDataPacket[]>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [table]);
      const actual = new Set(found.map((row) => String(row.COLUMN_NAME)));
      for (const column of columns) if (!actual.has(column)) missing.push(`${table}.${column}`);
    }
    const [indexes] = await connection.query<RowDataPacket[]>("SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gamification_events' AND NON_UNIQUE = 0 ORDER BY INDEX_NAME, SEQ_IN_INDEX");
    const unique = new Map<string, string[]>();
    for (const row of indexes) unique.set(row.INDEX_NAME, [...(unique.get(row.INDEX_NAME) || []), row.COLUMN_NAME]);
    if (![...unique.values()].some((columns) => columns.join(",") === "user_id,event_key")) missing.push("gamification_events.unique(user_id,event_key)");
    console.log(JSON.stringify({ migration, applied: apply, checksum, ready: missing.length === 0, missing }, null, 2));
    if (missing.length) process.exitCode = 1;
  } finally {
    if (locked) await connection.query("SELECT RELEASE_LOCK(?)", [`godev:${database}:migrate`]);
    connection.release();
  }
}
main().catch(() => { console.error("Não foi possível verificar/aplicar a migração. Confira acesso, permissões e schema no servidor; credenciais não são registradas."); process.exitCode = 1; }).finally(() => pool.end());

