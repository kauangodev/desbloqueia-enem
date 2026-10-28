import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
let revision = process.env.HOSTINGER_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "unknown";
try {
  revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim() || revision;
} catch {
  // Hosted build environments may omit the git executable; retain their SHA.
}

const payload = {
  revision,
  builtAt: new Date().toISOString(),
  source: "build-artifact",
};
await mkdir(path.join(root, "public"), { recursive: true });
await writeFile(path.join(root, "public", "__build-info.json"), `${JSON.stringify(payload)}\n`, "utf8");
