import "server-only";
import { canAccess } from "../supabase";

/** Armazenamento chave-valor por usuário (kind + ref). Aditivo: usa apenas a tabela `operacao_state`. */
export interface Kv {
  get<T>(kind: string, ref: string): Promise<T | null>;
  list<T>(kind: string): Promise<{ ref: string; data: T; updatedAt: string }[]>;
  set(kind: string, ref: string, data: unknown): Promise<void>;
  remove(kind: string, ref: string): Promise<void>;
}

type Row = { ref: string; data: string; updated_at?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mysqlKv(db: any, userId: string): Kv {
  const table = () => db.from("operacao_state");
  return {
    async get<T>(kind: string, ref: string) {
      const { data, error } = await table().select("ref,data").eq("user_id", userId).eq("kind", kind).eq("ref", ref).maybeSingle();
      if (error) throw new Error("operacao_read_failed");
      return data ? (JSON.parse((data as Row).data) as T) : null;
    },
    async list<T>(kind: string) {
      const { data, error } = await table().select("ref,data,updated_at").eq("user_id", userId).eq("kind", kind);
      if (error) throw new Error("operacao_read_failed");
      return ((data || []) as Row[]).map((row) => ({ ref: row.ref, data: JSON.parse(row.data) as T, updatedAt: String(row.updated_at || "") }));
    },
    async set(kind: string, ref: string, value: unknown) {
      const { error } = await table().upsert({ user_id: userId, kind, ref, data: JSON.stringify(value) }, { onConflict: "user_id,kind,ref" });
      if (error) throw new Error("operacao_write_failed");
    },
    async remove(kind: string, ref: string) {
      const { error } = await table().delete().eq("user_id", userId).eq("kind", kind).eq("ref", ref);
      if (error) throw new Error("operacao_write_failed");
    },
  };
}

const memory = new Map<string, Map<string, { data: string; updatedAt: string }>>();
function memoryKv(userId: string): Kv {
  const bag = () => { if (!memory.has(userId)) memory.set(userId, new Map()); return memory.get(userId)!; };
  return {
    async get<T>(kind: string, ref: string) { const row = bag().get(`${kind}\u0000${ref}`); return row ? (JSON.parse(row.data) as T) : null; },
    async list<T>(kind: string) { return [...bag().entries()].filter(([key]) => key.startsWith(`${kind}\u0000`)).map(([key, row]) => ({ ref: key.split("\u0000")[1], data: JSON.parse(row.data) as T, updatedAt: row.updatedAt })); },
    async set(kind: string, ref: string, value: unknown) { bag().set(`${kind}\u0000${ref}`, { data: JSON.stringify(value), updatedAt: new Date().toISOString() }); },
    async remove(kind: string, ref: string) { bag().delete(`${kind}\u0000${ref}`); },
  };
}

export type OperacaoUser = { id: string; name: string; kv: Kv };

/**
 * Usuário da operação. Segue a mesma regra de acesso dos exercícios (plano Essencial ou administrador).
 * Somente fora de produção e com GODEV_DEV_USER=1 existe um usuário local em memória, para testes de interface.
 */
export async function operacaoUser(): Promise<OperacaoUser | null> {
  if (process.env.NODE_ENV !== "production" && process.env.GODEV_DEV_USER === "1") return { id: "dev-user", name: "Estudante", kv: memoryKv("dev-user") };
  const who = await canAccess("essencial");
  if (!who) return null;
  return { id: who.user.id, name: who.profile?.name || "Estudante", kv: mysqlKv(who.db, who.user.id) };
}
