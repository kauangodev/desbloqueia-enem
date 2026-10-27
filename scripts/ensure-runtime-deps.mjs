import { cpSync, existsSync, readdirSync, mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const store = join(root, "node_modules", ".pnpm");
const packages = [
  { prefix: "@swc+helpers@", path: ["@swc", "helpers"] },
  { prefix: "react@", path: ["react"] },
  { prefix: "react-dom@", path: ["react-dom"] },
];

for (const { prefix, path } of packages) {
  const entry = existsSync(store)
    ? readdirSync(store).find((name) => name.startsWith(prefix))
    : undefined;
  if (!entry) continue;

  const source = join(store, entry, "node_modules", ...path);
  if (!existsSync(source)) continue;

  const sourceReal = realpathSync(source);
  const target = join(root, "node_modules", "next", "node_modules", ...path);
  if (existsSync(target) && realpathSync(target) === sourceReal) continue;

  mkdirSync(join(target, ".."), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}
