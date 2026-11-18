import "server-only";
import { canAccess, identity } from "../supabase";
import { features } from "../features";
import type { Tier } from "../planos/model";
import { memoryKv } from "./memory-kv";
import type { Kv } from "./kv";

export type { Kv } from "./kv";

type Row = { ref: string; data: unknown; updated_at?: string };
/** A camada MySQL já converte colunas `data` em objeto; aceitamos objeto ou texto JSON. */
const parse = <T,>(raw: unknown): T => (typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mysqlKv(db: any, userId: string): Kv {
  const table = () => db.from("operacao_state");
  return {
    async get<T>(kind: string, ref: string) {
      const { data, error } = await table().select("ref,data").eq("user_id", userId).eq("kind", kind).eq("ref", ref).maybeSingle();
      if (error) throw new Error("operacao_read_failed");
      return data ? (parse<T>((data as Row).data)) : null;
    },
    async list<T>(kind: string) {
      const { data, error } = await table().select("ref,data,updated_at").eq("user_id", userId).eq("kind", kind);
      if (error) throw new Error("operacao_read_failed");
      return ((data || []) as Row[]).map((row) => ({ ref: row.ref, data: parse<T>(row.data), updatedAt: String(row.updated_at || "") }));
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

export { memoryKv } from "./memory-kv";
/** `tier` "gratis" só existe com a chave NEXT_PUBLIC_FEATURE_GRATIS=1; as rotas de estudo aplicam o escopo do Grátis no servidor. */
export type OperacaoUser = { id: string; name: string; kv: Kv; tier: Tier };

/**
 * Usuário da operação. Segue a mesma regra de acesso dos exercícios (plano Essencial ou administrador).
 * Somente fora de produção e com GODEV_DEV_USER=1 existe um usuário local em memória, para testes de interface.
 */
export async function operacaoUser(): Promise<OperacaoUser | null> {
  if (process.env.NODE_ENV !== "production" && process.env.GODEV_DEV_USER === "1") return { id: "dev-user", name: "Estudante", kv: memoryKv("dev-user"), tier: process.env.GODEV_DEV_TIER === "gratis" ? "gratis" : "essencial" };
  const who = await canAccess("essencial");
  if (who) return { id: who.user.id, name: who.profile?.name || "Estudante", kv: mysqlKv(who.db, who.user.id), tier: who.profile?.role === "admin" ? "premium" : "essencial" };
  // Conta verificada sem compra: Grátis (somente com a chave ligada). `identity()` já exige e-mail verificado e conta não suspensa.
  if (!features.gratis) return null;
  const free = await identity();
  if (!free) return null;
  return { id: free.user.id, name: free.profile?.name || "Estudante", kv: mysqlKv(free.db, free.user.id), tier: "gratis" };
}
