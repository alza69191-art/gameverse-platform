import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required for the GitHub search API.");
const queries = [
  "topic:html5-game stars:>=3 archived:false",
  "topic:browser-game stars:>=3 archived:false",
  "topic:phaser stars:>=5 archived:false",
  "topic:threejs stars:>=5 archived:false",
  "topic:webgl-game stars:>=3 archived:false",
  "topic:godot stars:>=10 archived:false",
  "topic:open-source-game stars:>=3 archived:false"
];
const headers = {
  "Accept": "application/vnd.github+json",
  "Authorization": "Bearer " + token,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "GameVerse-Catalog-Discovery"
};
const candidates = new Map();
for (const query of queries) {
  const url = "https://api.github.com/search/repositories?q=" + encodeURIComponent(query) + "&per_page=100&sort=updated&order=desc";
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error("GitHub search failed (" + response.status + "): " + body.slice(0, 500));
  }
  const data = await response.json();
  for (const repo of data.items ?? []) {
    if (repo.archived || repo.disabled || repo.fork) continue;
    const pushedAt = repo.pushed_at ? Date.parse(repo.pushed_at) : 0;
    if (!pushedAt || pushedAt < Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) continue;
    const license = repo.license?.spdx_id ?? null;
    candidates.set(repo.full_name, {
      repository: repo.full_name, url: repo.html_url, description: repo.description ?? "",
      language: repo.language ?? null, stars: repo.stargazers_count ?? 0, pushedAt: repo.pushed_at,
      licenseSpdx: license, licenseUrl: repo.license?.url ?? null, topics: repo.topics ?? [],
      defaultBranch: repo.default_branch,
      reviewStatus: license ? "needs_asset_and_build_review" : "license_missing",
      discoveredBy: query
    });
  }
}
const output = {
  generatedAt: new Date().toISOString(), totalCandidates: candidates.size,
  notice: "Discovery candidates only. Never publish or mirror a game until the complete build, demo, source licence, asset licences, trademarks, attribution and security have been reviewed.",
  items: [...candidates.values()].sort((a,b)=>b.stars-a.stars || Date.parse(b.pushedAt)-Date.parse(a.pushedAt)).slice(0,1500)
};
const path = "data/game-candidates.json";
await mkdir(dirname(path), { recursive: true });
await writeFile(path, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log("Wrote " + output.items.length + " discovery candidates to " + path);
