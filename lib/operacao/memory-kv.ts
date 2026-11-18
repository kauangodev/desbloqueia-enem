import type { Kv } from "./kv";

const parse = <T,>(raw: unknown): T => (typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T));

// Em desenvolvimento cada rota pode ter sua própria cópia do módulo; guardar o mapa em globalThis mantém o estado entre API e páginas (e nos testes).
type MemoryStore = Map<string, Map<string, { data: string; updatedAt: string }>>;
const globalMemory = globalThis as unknown as { __godevMemoryKv?: MemoryStore };
const memory: MemoryStore = (globalMemory.__godevMemoryKv ??= new Map());
export function memoryKv(userId: string): Kv {
  const bag = () => { if (!memory.has(userId)) memory.set(userId, new Map()); return memory.get(userId)!; };
  return {
    async get<T>(kind: string, ref: string) { const row = bag().get(`${kind}\u0000${ref}`); return row ? (parse<T>(row.data)) : null; },
    async list<T>(kind: string) { return [...bag().entries()].filter(([key]) => key.startsWith(`${kind}\u0000`)).map(([key, row]) => ({ ref: key.split("\u0000")[1], data: parse<T>(row.data), updatedAt: row.updatedAt })); },
    async set(kind: string, ref: string, value: unknown) { bag().set(`${kind}\u0000${ref}`, { data: JSON.stringify(value), updatedAt: new Date().toISOString() }); },
    async remove(kind: string, ref: string) { bag().delete(`${kind}\u0000${ref}`); },
  };
}


