import mysql, { type RowDataPacket } from "mysql2/promise";

const email = (process.argv[2] || "kauango.dev@gmail.com").trim().toLowerCase();
const host = process.env.HOSTINGER_MYSQL_HOST || process.env.DB_HOST || "localhost";
const database = process.env.HOSTINGER_MYSQL_DATABASE || process.env.DB_NAME;
const user = process.env.HOSTINGER_MYSQL_USER || process.env.DB_USER;
const password = process.env.HOSTINGER_MYSQL_PASSWORD || process.env.DB_PASSWORD;
const port = Number(process.env.HOSTINGER_MYSQL_PORT || process.env.DB_PORT || 3306);

if (!database || !user || password === undefined) {
  throw new Error("Configure as variáveis MySQL antes de executar este diagnóstico.");
}

async function main() {
  const pool = mysql.createPool({ host, port, database, user, password, connectTimeout: 10_000 });
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email, name, role, email_verified_at, password_hash IS NOT NULL AS has_password, LEFT(password_hash, 7) AS password_algorithm FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const [invites] = await pool.query<RowDataPacket[]>(
      "SELECT email, name, active FROM admin_invites WHERE email = ? LIMIT 1",
      [email],
    );
    console.log(JSON.stringify({ user: rows[0] || null, invite: invites[0] || null }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
