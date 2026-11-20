/** Small HTML helpers for public-page benchmark adapters (no API keys). */

export function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `(?:property|name)="${escapeReg(name)}"[^>]*content="([^"]*)"|content="([^"]*)"[^>]*(?:property|name)="${escapeReg(name)}"`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  return decodeEntities(m[1] || m[2] || "").trim() || null;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function extractGithubRepos(html: string): string[] {
  const found = html.match(/https:\/\/github\.com\/[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+/g) ?? [];
  return [...new Set(found.map((u) => u.replace(/\.git$/, "")))];
}

/** SkillHey skill slugs linked from a page (`/skills/{slug}` or absolute). */
export function extractSkillheySlugs(html: string, options: { exclude?: string } = {}): string[] {
  const found = new Set<string>();
  const re =
    /(?:href|content)=["'](?:https?:\/\/(?:www\.)?skillhey\.com)?(?:\/[a-z]{2})?\/skills\/([^"'/?#]+)/gi;
  for (const m of html.matchAll(re)) {
    const slug = decodeURIComponent(m[1]!).trim();
    if (!slug || slug === options.exclude) continue;
    found.add(slug);
  }
  return [...found];
}

export function parseOwnerRepo(url: string | null | undefined): { owner: string; repo: string } | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

export function parseLdJsonBlocks(html: string): unknown[] {
  const blocks = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis);
  const out: unknown[] = [];
  for (const block of blocks) {
    try {
      out.push(JSON.parse(block[1]!));
    } catch {
      // ignore malformed
    }
  }
  return out;
}

export function walkLd(node: unknown, visit: (obj: Record<string, unknown>) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkLd(item, visit);
    return;
  }
  const obj = node as Record<string, unknown>;
  visit(obj);
  if (obj["@graph"]) walkLd(obj["@graph"], visit);
}

export function parseCompactNumber(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.trim().match(/^([\d,.]+)\s*([KMB])?$/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (Number.isNaN(n)) return null;
  const unit = (m[2] || "").toUpperCase();
  const mult = unit === "K" ? 1_000 : unit === "M" ? 1_000_000 : unit === "B" ? 1_000_000_000 : 1;
  return Math.round(n * mult);
}

export async function fetchText(url: string, options: { timeoutMs?: number } = {}): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 30_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "awskill-skill-collect/0.1 (+https://awskill.com; draft-collection)",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
