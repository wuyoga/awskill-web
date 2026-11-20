import type { BenchmarkRaw } from "../schema.ts";
import type { BenchmarkAdapter } from "./benchmark.ts";
import {
  extractGithubRepos,
  fetchText,
  metaContent,
  parseCompactNumber,
  parseOwnerRepo,
} from "./html.ts";

const BASE = "https://www.skills.sh";

export type SkillsShSecurityAudit = {
  provider: string;
  providerSlug: string;
  status: string;
  href: string;
};

/**
 * skills.sh public skill page.
 * ref: `owner/repo/skill` (same path as sitemap), e.g. `anthropics/skills/frontend-design`
 *
 * Note: Official JSON API requires Vercel OIDC; we parse public HTML instead.
 * `skill.sh` (no s) is a GoDaddy for-sale domain — not this catalog.
 */
export const skillsShAdapter: BenchmarkAdapter = {
  siteKey: "skills-sh",
  async collect(ref, options = {}) {
    const path = ref.replace(/^\/+/, "").replace(/^https?:\/\/(www\.)?skills\.sh\//i, "");
    const sourceUrl = `${BASE}/${path}`;
    const html = await fetchText(sourceUrl);
    const now = options.now ?? new Date().toISOString();

    const parts = path.split("/").filter(Boolean);
    const skillSlug = parts[parts.length - 1] ?? path;
    const sourceRepo = parts.length >= 3 ? `${parts[0]}/${parts[1]}` : null;

    const title = metaContent(html, "og:title") ?? metaContent(html, "twitter:title");
    const description =
      metaContent(html, "og:description") ?? metaContent(html, "description") ?? null;

    const nameFromTitle = title?.split("—")[0]?.trim() || skillSlug;

    const githubs = extractGithubRepos(html).filter((u) => {
      if (!sourceRepo) return true;
      return u.toLowerCase().includes(sourceRepo.toLowerCase());
    });
    const repositoryUrl =
      githubs[0] ?? (sourceRepo ? `https://github.com/${sourceRepo}` : null);
    const or = parseOwnerRepo(repositoryUrl);

    const installsRaw = labelValue(html, "Installs", {
      // Number sits in the following text-3xl div (label → value, not "N installs").
      afterPattern: /Installs<\/span><\/div><div class="[^"]*text-3xl[^"]*">\s*([\d,.]+[KMB]?)\s*</i,
    });
    const installs = parseCompactNumber(installsRaw);

    const starsRaw = labelValue(html, "GitHub Stars", {
      afterPattern: /GitHub Stars[\s\S]{0,1200}?<span>\s*([\d,.]+[KMB]?)\s*<\/span>/i,
    });
    const firstSeen = labelValue(html, "First Seen", {
      afterPattern:
        /First Seen<\/span><\/div><div class="[^"]*text-sm[^"]*">\s*([^<]+?)\s*<\/div>/i,
    });

    const securityAudits = parseSecurityAudits(html);

    // Do not scrape global nav/footer agent names as per-skill claims.
    const agentsClaimed: string[] = [];

    return {
      siteKey: "skills-sh",
      sourceUrl,
      externalId: path,
      name: nameFromTitle,
      owner: or?.owner ?? parts[0] ?? null,
      repo: or?.repo ?? parts[1] ?? null,
      repositoryUrl,
      description,
      tags: sourceRepo ? [sourceRepo] : [],
      stars: starsRaw,
      installs,
      license: null,
      agentsClaimed,
      raw: {
        path,
        ogTitle: title,
        npx:
          html.match(/npx skills add https:\/\/github\.com\/[^\s"'<]+(?:\s+--skill\s+[^\s"'<]+)?/)?.[0] ??
          null,
        installsRaw,
        starsRaw,
        firstSeen,
        securityAudits,
      },
      fetchedAt: now,
    } satisfies BenchmarkRaw;
  },
};

/** Alias kept for seed typos; skill.sh itself is not a catalog. */
export const skillShAliasAdapter: BenchmarkAdapter = {
  siteKey: "skill-sh",
  async collect(ref, options) {
    console.warn(
      "[skill-sh] https://skill.sh is a for-sale domain; routing to skills.sh (https://www.skills.sh)",
    );
    return skillsShAdapter.collect(ref, options);
  },
};

function labelValue(
  html: string,
  _label: string,
  options: { afterPattern: RegExp },
): string | null {
  const m = html.match(options.afterPattern);
  const v = m?.[1]?.trim();
  return v || null;
}

function parseSecurityAudits(html: string): SkillsShSecurityAudit[] {
  const start = html.search(/Security Audits/i);
  if (start < 0) return [];
  // Sidebar block is compact; avoid matching footer "Security audits" nav later.
  const chunk = html.slice(start, start + 4500);
  const out: SkillsShSecurityAudit[] = [];
  const re =
    /href="(\/[^"]+\/security\/([^"/]+))"[^>]*>[\s\S]*?<span class="text-sm font-medium[^>]*>\s*([^<]+?)\s*<\/span>\s*<span class="text-xs[^>]*>\s*([^<]+?)\s*<\/span>/gi;
  for (const m of chunk.matchAll(re)) {
    const href = m[1]!;
    const providerSlug = m[2]!;
    const provider = m[3]!.trim();
    const status = m[4]!.trim();
    if (!provider || !status) continue;
    out.push({ provider, providerSlug, status, href });
  }
  return out;
}
