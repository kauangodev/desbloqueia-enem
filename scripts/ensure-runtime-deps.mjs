import { cpSync, existsSync, readdirSync, mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const store = join(root, "node_modules", ".pnpm");
const entry = existsSync(store)
  ? readdirSync(store).find((name) => name.startsWith("@swc+helpers@"))
  : undefined;

if (!entry) process.exit(0);

const source = join(store, entry, "node_modules", "@swc", "helpers");
if (!existsSync(source)) process.exit(0);

const sourceReal = realpathSync(source);
const target = join(root, "node_modules", "next", "node_modules", "@swc", "helpers");
if (existsSync(target) && realpathSync(target) === sourceReal) process.exit(0);

{
  mkdirSync(join(target, ".."), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}
