/** Armazenamento chave-valor por usuário (kind + ref). Aditivo: usa apenas a tabela `operacao_state`. */
export interface Kv {
  get<T>(kind: string, ref: string): Promise<T | null>;
  list<T>(kind: string): Promise<{ ref: string; data: T; updatedAt: string }[]>;
  set(kind: string, ref: string, data: unknown): Promise<void>;
  remove(kind: string, ref: string): Promise<void>;
}
