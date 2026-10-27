import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { canAccess, identity } from "../../../lib/supabase";
import { mysqlPool } from "../../../lib/mysql";
import { jsonError } from "../../../lib/http";
import { NextResponse } from "next/server";

const root = () => join(process.cwd(), "private", "materials");
const fileFor = (path: string) => join(root(), basename(path));
const secret = () => process.env.AUTH_SESSION_SECRET || process.env.HOSTINGER_MYSQL_PASSWORD || "temporary-hostinger-session-secret";
const validUploadToken = (path: string, token: string) => {
  const expected = createHmac("sha256", secret()).update(`upload:${path}`).digest("base64url");
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
};

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") || "";
  if (!path.startsWith("private/") || path.includes("..")) return jsonError("Arquivo inválido", 400);
  const who = await identity();
  if (!who) return jsonError("Entre para acessar.", 401);
  const [rows] = await mysqlPool().query<any[]>("SELECT plan FROM materials WHERE storage_path = ? AND published = 1 LIMIT 1", [path]);
  const material = rows[0];
  if (!material || !(await canAccess(material.plan))) return jsonError("Material não disponível para esta conta.", 403);
  try {
    const file = await readFile(fileFor(path));
    return new NextResponse(file, { headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
  } catch { return jsonError("Arquivo ainda não publicado.", 404); }
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";
  const token = url.searchParams.get("token") || "";
  if (!path.startsWith("private/") || path.includes("..") || !validUploadToken(path, token)) return jsonError("Upload inválido", 403);
  const who = await identity();
  if (who?.profile?.role !== "admin") return jsonError("Não autorizado", 403);
  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") return jsonError("O arquivo não é um PDF válido", 400);
  await mkdir(root(), { recursive: true });
  await writeFile(fileFor(path), bytes);
  return NextResponse.json({ path });
}
