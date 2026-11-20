import type { GithubRaw } from "../schema.ts";

export type GithubTarget = {
  owner: string;
  repo: string;
  /** Path inside repo to the skill folder or SKILL.md, e.g. `skills/frontend-design`. */
  path?: string;
};

type GhHeaders = Record<string, string>;

function headers(token?: string): GhHeaders {
  const h: GhHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "awskill-skill-collect",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghJson<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} ${url}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function decodeContent(base64: string): string {
  return Buffer.from(base64.replace(/\n/g, ""), "base64").toString("utf8");
}

type RepoJson = {
  html_url: string;
  description: string | null;
  stargazers_count: number;
  default_branch: string;
  license: { spdx_id: string | null } | null;
  topics?: string[];
};

type CommitJson = { sha: string; commit: { committer: { date: string } | null } };

type ContentFile = {
  type: "file";
  name: string;
  path: string;
  encoding: string;
  content: string;
  download_url: string | null;
};

type ContentDirEntry = { type: string; name: string; path: string };

async function findSkillMd(
  owner: string,
  repo: string,
  basePath: string | undefined,
  token?: string,
): Promise<{ path: string; content: string } | null> {
  const candidates = basePath
    ? [
        basePath.endsWith("SKILL.md") ? basePath : `${basePath.replace(/\/$/, "")}/SKILL.md`,
        basePath,
      ]
    : ["SKILL.md", "skill.md"];

  for (const path of candidates) {
    try {
      const file = await ghJson<ContentFile>(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
        token,
      );
      if (file.type === "file" && file.content) {
        return { path: file.path, content: decodeContent(file.content) };
      }
    } catch {
      // try next
    }
  }

  if (!basePath) return null;

  try {
    const listing = await ghJson<ContentDirEntry[]>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(basePath)}`,
      token,
    );
    const hit = listing.find((e) => e.type === "file" && /^skill\.md$/i.test(e.name));
    if (!hit) return null;
    const file = await ghJson<ContentFile>(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(hit.path)}`,
      token,
    );
    return { path: file.path, content: decodeContent(file.content) };
  } catch {
    return null;
  }
}

async function fetchReadmeExcerpt(
  owner: string,
  repo: string,
  token?: string,
): Promise<string | null> {
  try {
    const file = await ghJson<ContentFile>(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      token,
    );
    const text = decodeContent(file.content);
    return text.slice(0, 2000);
  } catch {
    return null;
  }
}

/** Collect raw GitHub metadata + SKILL.md for one skill target. */
export async function collectGithub(
  target: GithubTarget,
  options: { token?: string; now?: string } = {},
): Promise<GithubRaw> {
  const token = options.token ?? process.env.GITHUB_TOKEN;
  const now = options.now ?? new Date().toISOString();
  const { owner, repo, path } = target;

  const repoJson = await ghJson<RepoJson>(`https://api.github.com/repos/${owner}/${repo}`, token);
  const commits = await ghJson<CommitJson[]>(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
    token,
  );
  const latest = commits[0];
  const skill = await findSkillMd(owner, repo, path, token);
  const readmeExcerpt = skill ? null : await fetchReadmeExcerpt(owner, repo, token);

  return {
    owner,
    repo,
    path: path ?? "",
    htmlUrl: repoJson.html_url,
    description: repoJson.description,
    stars: repoJson.stargazers_count,
    license: repoJson.license?.spdx_id ?? null,
    defaultBranch: repoJson.default_branch,
    latestCommitSha: latest?.sha ?? "",
    latestCommitDate: latest?.commit.committer?.date ?? null,
    skillMd: skill?.content ?? null,
    skillMdPath: skill?.path ?? null,
    readmeExcerpt,
    topics: repoJson.topics ?? [],
    fetchedAt: now,
  };
}

/** Parse YAML-ish frontmatter from SKILL.md (name / description only). */
export function parseSkillFrontmatter(md: string): {
  name?: string;
  description?: string;
  body: string;
} {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { body: md };
  const block = match[1];
  const body = match[2].trim();
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  return { name, description, body };
}

export function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

export function daysAgo(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}
