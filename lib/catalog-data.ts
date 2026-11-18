import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const allowedFiles = new Set([
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
]);

export async function loadCatalogData<T>(request: Request, filename: string): Promise<T> {
  if (!allowedFiles.has(filename)) throw new Error("Unknown catalog data file");

  try {
    const { env } = getCloudflareContext();
    if (env.ASSETS) {
      const assetUrl = new URL(`/catalog-data/${filename}`, request.url);
      const response = await env.ASSETS.fetch(new Request(assetUrl));
      if (response.ok) return await response.json() as T;
    }
  } catch {
    // Outside the Workers runtime, use the repository data file.
  }

  const raw = await readFile(join(process.cwd(), "data", filename), "utf8");
  return JSON.parse(raw) as T;
}
