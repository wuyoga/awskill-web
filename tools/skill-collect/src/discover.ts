import { fetchText } from "./sources/html.ts";

const SKILLS_SH_SITEMAPS = [
  "https://www.skills.sh/sitemap-skills-1.xml",
  "https://www.skills.sh/sitemap-skills-2.xml",
];

function locsFromSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]!.trim());
}

/** Discover skills.sh refs (`owner/repo/skill`), skipping already-collected refs. */
export async function discoverSkillsSh(
  limit: number,
  exclude: Set<string>,
): Promise<string[]> {
  const out: string[] = [];
  for (const url of SKILLS_SH_SITEMAPS) {
    if (out.length >= limit) break;
    const xml = await fetchText(url);
    for (const loc of locsFromSitemap(xml)) {
      if (out.length >= limit) break;
      const m = loc.match(/https?:\/\/(?:www\.)?skills\.sh\/(.+?)\/?$/i);
      if (!m) continue;
      const ref = m[1]!;
      if (exclude.has(ref)) continue;
      out.push(ref);
    }
  }
  return out;
}

/** Discover skillhey slugs from sitemap, skipping already-collected refs. */
export async function discoverSkillhey(
  limit: number,
  exclude: Set<string>,
): Promise<string[]> {
  const xml = await fetchText("https://skillhey.com/sitemap.xml");
  const out: string[] = [];
  for (const loc of locsFromSitemap(xml)) {
    if (out.length >= limit) break;
    const m = loc.match(/https?:\/\/(?:www\.)?skillhey\.com\/(?:[a-z]{2}\/)?skills\/([^/?#]+)/i);
    if (!m) continue;
    const ref = decodeURIComponent(m[1]!);
    if (exclude.has(ref)) continue;
    out.push(ref);
  }
  return out;
}

/**
 * Merge explicit seed refs ahead of discovered ones.
 * `exclude` skips already-collected; duplicates across seed+discover are dropped.
 */
export function mergeSeedRefs(
  seedRefs: string[],
  discovered: string[],
  exclude: Set<string>,
  limit: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ref of [...seedRefs, ...discovered]) {
    if (out.length >= limit) break;
    const cleaned = ref.trim();
    if (!cleaned || exclude.has(cleaned) || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out;
}

export function draftIdFor(siteKey: string, ref: string): string {
  if (siteKey === "skillhey") return sanitizeId(ref);
  // skills-sh: owner/repo/skill → prefer skill slug; disambiguate with owner--repo--skill
  const parts = ref.split("/").filter(Boolean);
  if (parts.length >= 3) {
    return sanitizeId(`${parts[0]}--${parts[1]}--${parts[parts.length - 1]}`);
  }
  return sanitizeId(ref.replaceAll("/", "--"));
}

function sanitizeId(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
