import { randomUUID } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";

const email = "kauangodev.a@gmail.com";
const apply = process.argv.includes("--apply");
const host = process.env.HOSTINGER_MYSQL_HOST || process.env.DB_HOST || "localhost";
const database = process.env.HOSTINGER_MYSQL_DATABASE || process.env.DB_NAME;
const user = process.env.HOSTINGER_MYSQL_USER || process.env.DB_USER;
const password = process.env.HOSTINGER_MYSQL_PASSWORD || process.env.DB_PASSWORD;
const port = Number(process.env.HOSTINGER_MYSQL_PORT || process.env.DB_PORT || 3306);

if (!database || !user || password === undefined) {
  throw new Error("Configure as variáveis MySQL antes de executar este seed.");
}

async function main() {
  const pool = mysql.createPool({ host, port, database, user, password, connectTimeout: 10_000 });
  const connection = await pool.getConnection();
  try {
    try {
      await connection.query("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE");
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME") throw error;
    }
    await connection.beginTransaction();
    const [existingRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, email, role, email_verified_at FROM users WHERE email = ? FOR UPDATE",
      [email],
    );
    const existing = existingRows[0];
    const id = String(existing?.id || randomUUID());
    const plan = "premium";
    const grantId = `admin-grant:${id}:${plan}`;

    if (apply) {
      if (existing) {
        await connection.query(
          "UPDATE users SET role = 'admin', must_change_password = TRUE, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(3)) WHERE id = ?",
          [id],
        );
      } else {
        await connection.query(
          "INSERT INTO users (id, email, name, role, must_change_password, email_verified_at) VALUES (?, ?, ?, 'admin', TRUE, CURRENT_TIMESTAMP(3))",
          [id, email, "Kauan"],
        );
      }
      await connection.query(
        "INSERT INTO admin_invites (email, name, active) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE name = VALUES(name), active = TRUE",
        [email, "Kauan"],
      );
      await connection.query(
        "INSERT INTO entitlements (order_id, user_id, email, plan, active) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), email = VALUES(email), plan = VALUES(plan), active = TRUE",
        [grantId, id, email, plan],
      );
    }

    await connection.commit();
    console.log(JSON.stringify({ applied: apply, email, userId: id, previousRole: existing?.role || null, role: "admin", plan, entitlementId: grantId }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

