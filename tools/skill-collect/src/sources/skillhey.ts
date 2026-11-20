import type { BenchmarkRaw } from "../schema.ts";
import type { BenchmarkAdapter } from "./benchmark.ts";
import {
  extractGithubRepos,
  extractSkillheySlugs,
  fetchText,
  metaContent,
  parseLdJsonBlocks,
  parseOwnerRepo,
  walkLd,
} from "./html.ts";

const BASE = "https://skillhey.com";

/**
 * SkillHey public skill page.
 * ref: slug only, e.g. `impeccable` → https://skillhey.com/skills/impeccable
 */
export const skillheyAdapter: BenchmarkAdapter = {
  siteKey: "skillhey",
  async collect(ref, options = {}) {
    const slug = ref
      .replace(/^\/+/, "")
      .replace(/^https?:\/\/(www\.)?skillhey\.com\/(?:[a-z]{2}\/)?skills\//i, "")
      .replace(/\/$/, "");
    const sourceUrl = `${BASE}/skills/${slug}`;
    const html = await fetchText(sourceUrl);
    const now = options.now ?? new Date().toISOString();

    let name: string | null = metaContent(html, "og:image:alt");
    let description =
      metaContent(html, "og:description") ?? metaContent(html, "description") ?? null;
    let repositoryUrl: string | null = null;

    for (const block of parseLdJsonBlocks(html)) {
      walkLd(block, (obj) => {
        if (obj["@type"] === "Product") {
          if (typeof obj.name === "string") name = obj.name;
          if (typeof obj.description === "string") description = obj.description;
          const offers = obj.offers as { url?: string } | undefined;
          if (offers?.url?.includes("github.com")) repositoryUrl = offers.url;
        }
      });
    }

    if (!repositoryUrl) {
      const githubs = extractGithubRepos(html);
      // Prefer non-anthropics/skills noise when product offer missing
      repositoryUrl =
        githubs.find((u) => !/github\.com\/anthropics\/skills$/i.test(u)) ?? githubs[0] ?? null;
    }

    const or = parseOwnerRepo(repositoryUrl);
    const starsMatch = html.match(/([\d,.]+[KMB]?)\s*Stars/i);
    const stars = starsMatch?.[1] ?? null;

    const agentsClaimed: string[] = [];
    for (const agent of ["Claude Code", "Codex", "Cursor", "Windsurf", "GitHub Copilot", "Gemini"]) {
      if (new RegExp(agent.replace(/\s+/g, "\\s+"), "i").test(html)) agentsClaimed.push(agent);
    }

    const quality = html.match(/Quality score\s*([\d.]+)/i)?.[1] ?? null;
    const childSlugs = extractSkillheySlugs(html, { exclude: slug });

    return {
      siteKey: "skillhey",
      sourceUrl,
      externalId: slug,
      name: name ?? slug,
      owner: or?.owner ?? null,
      repo: or?.repo ?? null,
      repositoryUrl,
      description,
      tags: [],
      stars,
      installs: null,
      license: null,
      agentsClaimed,
      raw: {
        slug,
        qualityScore: quality,
        starsRaw: stars,
        forks: html.match(/([\d,.]+[KMB]?)\s*Forks/i)?.[1] ?? null,
        childSlugs,
      },
      fetchedAt: now,
    } satisfies BenchmarkRaw;
  },
};
