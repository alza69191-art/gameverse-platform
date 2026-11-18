import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const files = [
  "apple-app-catalog.json",
  "fdroid-catalog.json",
  "openuse-catalog.json",
  "game-catalog.json",
  "osgl-game-catalog.json",
  "awesome-game-candidates.json",
  "homebrew-catalog.json",
  "store-catalog.json",
  "site-catalog.json",
  "game-candidates.json"
];

const source = join(process.cwd(), "data");
const destination = join(process.cwd(), "public", "catalog-data");
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of files) {
  await copyFile(join(source, file), join(destination, file));
}
console.log(`Prepared ${files.length} catalog data assets for Cloudflare.`);
