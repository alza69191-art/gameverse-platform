import "server-only";
import { browserGames } from "@/lib/catalog";
import { getDbPool } from "@/lib/db";

export async function isKnownGameSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) return false;
  if (browserGames.some(game => game.slug === slug)) return true;
  const [rows] = await getDbPool().execute(
    "SELECT id FROM games WHERE slug = ? AND status = 'approved' LIMIT 1", [slug]
  );
  return (rows as unknown[]).length > 0;
}
