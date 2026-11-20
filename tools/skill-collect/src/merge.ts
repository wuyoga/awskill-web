import {
  type ConclusionField,
  CONCLUSION_FIELDS,
  type FieldMeta,
  pendingPermissions,
  type SkillBody,
  type SkillDraft,
  unverifiedCompat,
  type BenchmarkRaw,
  type GithubRaw,
} from "./schema.ts";
import { daysAgo, formatStars, parseSkillFrontmatter } from "./sources/github.ts";

export type MergeInput = {
  id: string;
  github?: GithubRaw;
  /** @deprecated prefer `benchmarks` */
  benchmark?: BenchmarkRaw;
  benchmarks?: BenchmarkRaw[];
  now?: string;
};

function allBenchmarks(input: MergeInput): BenchmarkRaw[] {
  const list = [...(input.benchmarks ?? [])];
  if (input.benchmark && !list.some((b) => b.siteKey === input.benchmark!.siteKey && b.sourceUrl === input.benchmark!.sourceUrl)) {
    list.unshift(input.benchmark);
  }
  return list;
}

function pickDescription(github?: GithubRaw, benchmarks: BenchmarkRaw[] = []): {
  value: string;
  source: FieldMeta;
} {
  if (github?.skillMd) {
    const parsed = parseSkillFrontmatter(github.skillMd);
    if (parsed.description) {
      return {
        value: parsed.description,
        source: { source: "github", confidence: "high", collectedAt: github.fetchedAt },
      };
    }
  }
  for (const site of ["skills-sh", "skillhey", "fixture"]) {
    const hit = benchmarks.find((b) => b.siteKey === site && b.description);
    if (hit?.description) {
      return {
        value: hit.description,
        source: { source: "benchmark", confidence: "medium", collectedAt: hit.fetchedAt, note: site },
      };
    }
  }
  const any = benchmarks.find((b) => b.description);
  if (any?.description) {
    return {
      value: any.description,
      source: { source: "benchmark", confidence: "medium", collectedAt: any.fetchedAt },
    };
  }
  if (github?.description) {
    return {
      value: github.description,
      source: { source: "github", confidence: "medium", collectedAt: github.fetchedAt },
    };
  }
  return { value: "", source: { source: "default", confidence: "low" } };
}

function ownerRepo(github?: GithubRaw, benchmarks: BenchmarkRaw[] = []) {
  if (github) return { owner: github.owner, repo: github.repo };
  const withRepo = benchmarks.find((b) => b.owner && b.repo);
  return { owner: withRepo?.owner ?? "", repo: withRepo?.repo ?? "" };
}

function skillName(id: string, github?: GithubRaw, benchmarks: BenchmarkRaw[] = []): string {
  const named = benchmarks.find((b) => b.name);
  if (named?.name) return named.name;
  if (github?.skillMd) {
    const parsed = parseSkillFrontmatter(github.skillMd);
    if (parsed.name) return parsed.name;
  }
  if (github?.path) {
    const base = github.path.replace(/\/SKILL\.md$/i, "").split("/").filter(Boolean).pop();
    if (base) return base;
  }
  return id;
}

/**
 * Merge dual-channel raw payloads into one SkillDraft.
 * Conclusion fields are always left pending for human review.
 */
export function mergeToDraft(input: MergeInput): SkillDraft {
  const now = input.now ?? new Date().toISOString();
  const { github, id } = input;
  const benchmarks = allBenchmarks(input);

  if (!github && !benchmarks.length) {
    throw new Error(`mergeToDraft(${id}): need at least one of github or benchmark(s)`);
  }

  const { owner, repo } = ownerRepo(github, benchmarks);
  const name = skillName(id, github, benchmarks);
  const desc = pickDescription(github, benchmarks);

  const tags = [
    ...new Set([
      ...benchmarks.flatMap((b) => b.tags),
      ...(github?.topics ?? []),
    ].filter(Boolean)),
  ];

  const starsFromHey = benchmarks.find((b) => b.siteKey === "skillhey" && b.stars)?.stars;
  const stars =
    github != null ? formatStars(github.stars) : (starsFromHey ?? benchmarks.find((b) => b.stars)?.stars ?? "0");

  const license =
    github?.license ?? benchmarks.find((b) => b.license)?.license ?? "";
  const latestCommit = github?.latestCommitSha?.slice(0, 7) ?? "";
  const sourceUpdatedDaysAgo = daysAgo(github?.latestCommitDate ?? null);
  const skillMd = github?.skillMd ?? "";
  const repositoryUrl =
    github?.htmlUrl ??
    benchmarks.find((b) => b.repositoryUrl)?.repositoryUrl ??
    (owner && repo ? `https://github.com/${owner}/${repo}` : "");
  const repositoryPath = github?.skillMdPath ?? github?.path ?? "";

  const needsApiKey = /api[_ -]?key|openai|anthropic key/i.test(`${desc.value}\n${skillMd}`);

  // Cross-check installs from skills.sh as raw evidence only — still pending OQ-04 for publish.
  const installsEvidence = benchmarks.find((b) => b.installs != null)?.installs ?? null;

  const skill: SkillBody = {
    id,
    name,
    owner,
    repo,
    category: "",
    description: desc.value,
    tags,
    keywords: tags.slice(),
    compat: unverifiedCompat(),
    risk: "未评估",
    riskSummary: "待人工安全评估",
    permissions: pendingPermissions(),
    status: "待验证",
    needsApiKey,
    paid: false,
    outputs: [],
    stars,
    installs: 0,
    addedAt: now.slice(0, 10),
    sourceUpdatedDaysAgo,
    license,
    prerequisites: "",
    verifiedCommit: "",
    latestCommit,
    useCases: [],
    notFor: "",
    skillMd,
    tone: "neutral",
    icon: "spark",
    repositoryUrl,
    repositoryPath,
  };

  const fieldMeta: SkillDraft["fieldMeta"] = {
    id: { source: "merge", collectedAt: now },
    name: {
      source: benchmarks.some((b) => b.name) ? "benchmark" : github ? "github" : "default",
      collectedAt: now,
    },
    owner: { source: github ? "github" : "benchmark", collectedAt: now },
    repo: { source: github ? "github" : "benchmark", collectedAt: now },
    description: desc.source,
    tags: {
      source: tags.length ? "merge" : "default",
      collectedAt: now,
    },
    stars: {
      source: github ? "github" : starsFromHey ? "benchmark" : "default",
      collectedAt: now,
      confidence: "high",
    },
    license: { source: github?.license ? "github" : "default" },
    latestCommit: { source: github ? "github" : "default", confidence: "high" },
    skillMd: { source: github?.skillMd ? "github" : "default", confidence: "high" },
    repositoryUrl: { source: github ? "github" : "benchmark" },
    needsApiKey: { source: "merge", confidence: "low", note: "heuristic from text" },
    compat: { source: "default", note: "requires human Agent verification" },
    risk: { source: "default", note: "requires human security review" },
    riskSummary: { source: "default" },
    permissions: { source: "default" },
    status: { source: "default" },
    verifiedCommit: { source: "default" },
    useCases: { source: "default" },
    notFor: { source: "default" },
    category: { source: "default" },
    outputs: { source: "default" },
    installs: {
      source: "default",
      note:
        installsEvidence != null
          ? `benchmark evidence installs=${installsEvidence} (OQ-04; not copied to skill.installs)`
          : "install count source unsettled (OQ-04)",
    },
  };

  const notes: string[] = [];
  if (!github) notes.push("GitHub channel missing — repo metadata incomplete");
  if (!benchmarks.length) notes.push("Benchmark channel missing — cross-check skipped");
  for (const b of benchmarks) {
    if (b.agentsClaimed?.length) {
      notes.push(`${b.siteKey} claimed agents (not verified): ${b.agentsClaimed.join(", ")}`);
    }
    if (github && b.repositoryUrl) {
      const needle = `${github.owner}/${github.repo}`.toLowerCase();
      if (!b.repositoryUrl.toLowerCase().includes(needle)) {
        notes.push(`${b.siteKey} repositoryUrl may not match GitHub ${needle}`);
      }
    }
  }

  const primary = benchmarks[0];

  return {
    schemaVersion: 1,
    draftStatus: "needs_review",
    collectedAt: now,
    sources: {
      ...(github ? { github } : {}),
      ...(primary ? { benchmark: primary } : {}),
      ...(benchmarks.length ? { benchmarks } : {}),
    },
    skill,
    fieldMeta,
    review: {
      pendingFields: [...CONCLUSION_FIELDS] as ConclusionField[],
      notes,
    },
  };
}
