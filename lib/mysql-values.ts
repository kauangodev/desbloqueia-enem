const booleanColumns = new Set(["active", "enabled", "published", "downloadable", "done", "must_change_password"]);
const jsonColumns = new Set(["features", "answers", "data", "feedback"]);

export function normalizeMysqlRow<T extends Record<string, unknown>>(input: T): T {
  const row: Record<string, unknown> = { ...input };
  for (const [key, value] of Object.entries(row)) {
    if (booleanColumns.has(key) && value !== null) row[key] = value === true || value === 1 || value === "1";
    else if (jsonColumns.has(key) && typeof value === "string") {
      try { row[key] = JSON.parse(value); } catch { /* preserve malformed legacy data for the caller */ }
    } else if (value instanceof Date) row[key] = key === "date_value" ? value.toISOString().slice(0, 10) : value.toISOString();
  }
  if (Object.hasOwn(row, "date_value")) { row.date = row.date_value; delete row.date_value; }
  return row as T;
}

export function mysqlWriteValue(column: string, value: unknown): unknown {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /(?:_at|_expires_at|next_attempt|leased_until)$/.test(column) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error("Data inválida");
    return date;
  }
  return value !== null && typeof value === "object" ? JSON.stringify(value) : value;
}

export const mysqlPrimaryKeys: Record<string, string> = {
  reading_progress: "user_id,material_id",
  account_access_fingerprints: "user_id,fingerprint_hash",
  entitlements: "order_id",
  offers: "plan",
  admin_invites: "email",
};

