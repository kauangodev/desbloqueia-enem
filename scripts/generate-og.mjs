import { stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const source = join(process.cwd(), "public", "og.svg");
const destination = join(process.cwd(), "public", "og.jpg");

await sharp(source).jpeg({ quality: 82, mozjpeg: true }).toFile(destination);
const { size } = await stat(destination);
if (size >= 200_000) {
  throw new Error(`Preview social excede 200 KB (${size} bytes)`);
}
console.log(`Preview social criada em ${destination} (${size} bytes)`);
