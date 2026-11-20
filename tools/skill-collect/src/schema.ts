/**
 * Skill draft schema — aligned with prototype `src/data.ts` Skill shape.
 * Auto-collected fields are filled by collectors; conclusion fields stay pending for human review.
 */

export const AGENTS = ["Claude Code", "Codex", "Cursor", "Windsurf"] as const;
export type AgentName = (typeof AGENTS)[number];

export const CATEGORIES = [
  "开发与工程",
  "设计与用户体验",
  "测试与安全",
  "数据与研究",
  "内容与文档",
  "视觉与多媒体",
  "营销与增长",
  "产品与业务",
  "生产力与自动化",
  "Agent 与工具链",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const OUTPUT_FORMATS = ["代码", "网页", "文档", "数据", "图片", "演示文稿", "视频"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type CompatStatus = "完整支持" | "部分支持" | "未验证";
export type RiskLevel = "低风险" | "中风险" | "未评估";
export type VerifyStatus = "任务已实测" | "安装已验证" | "待验证";
export type PermissionLevel = "需要" | "有限" | "未发现" | "待评估";

export type Compat = {
  status: CompatStatus;
  agentVersion?: string;
  os?: string;
  verifiedDaysAgo?: number;
  note?: string;
};

export type Permission = { label: string; level: PermissionLevel; reason: string };

/** Fields that must not be auto-published as verified conclusions. */
export const CONCLUSION_FIELDS = [
  "compat",
  "risk",
  "riskSummary",
  "permissions",
  "status",
  "verifiedCommit",
  "useCases",
  "notFor",
  "category",
  "outputs",
  "installs",
] as const;

export type ConclusionField = (typeof CONCLUSION_FIELDS)[number];

export type SourceChannel = "github" | "benchmark" | "merge" | "default";

export type FieldMeta = {
  source: SourceChannel;
  collectedAt?: string;
  confidence?: "high" | "medium" | "low";
  note?: string;
};

/** Prototype-aligned skill body stored inside a draft. */
export type SkillBody = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  category: Category | "";
  description: string;
  tags: string[];
  keywords: string[];
  compat: Record<AgentName, Compat>;
  risk: RiskLevel;
  riskSummary: string;
  permissions: Permission[];
  status: VerifyStatus;
  needsApiKey: boolean;
  paid: boolean;
  outputs: OutputFormat[];
  stars: string;
  installs: number;
  addedAt: string;
  sourceUpdatedDaysAgo: number | null;
  license: string;
  prerequisites: string;
  verifiedCommit: string;
  latestCommit: string;
  useCases: [string, string][];
  notFor: string;
  skillMd: string;
  tone: string;
  icon: string;
  repositoryUrl: string;
  repositoryPath: string;
};

export type GithubRaw = {
  owner: string;
  repo: string;
  path: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  license: string | null;
  defaultBranch: string;
  latestCommitSha: string;
  latestCommitDate: string | null;
  skillMd: string | null;
  skillMdPath: string | null;
  readmeExcerpt: string | null;
  topics: string[];
  fetchedAt: string;
};

export type BenchmarkRaw = {
  siteKey: string;
  sourceUrl: string;
  externalId: string | null;
  name: string | null;
  owner: string | null;
  repo: string | null;
  repositoryUrl: string | null;
  description: string | null;
  tags: string[];
  stars: string | null;
  installs: number | null;
  license: string | null;
  agentsClaimed: string[];
  raw: Record<string, unknown>;
  fetchedAt: string;
};

export type DraftStatus = "collected" | "needs_review" | "ready_for_cms";

export type SkillDraft = {
  schemaVersion: 1;
  draftStatus: DraftStatus;
  collectedAt: string;
  sources: {
    github?: GithubRaw;
    /** Primary/legacy single snapshot; prefer `benchmarks` when multiple 对标站. */
    benchmark?: BenchmarkRaw;
    benchmarks?: BenchmarkRaw[];
  };
  skill: SkillBody;
  fieldMeta: Partial<Record<keyof SkillBody, FieldMeta>>;
  review: {
    pendingFields: ConclusionField[];
    notes: string[];
  };
};

export const PERMISSION_LABELS = [
  "读取项目文件",
  "修改项目文件",
  "执行 Shell",
  "访问网络",
  "访问系统凭据",
  "删除文件",
] as const;

export function pendingPermissions(): Permission[] {
  return PERMISSION_LABELS.map((label) => ({
    label,
    level: "待评估",
    reason: "尚未完成安全评估",
  }));
}

export function unverifiedCompat(): Record<AgentName, Compat> {
  return {
    "Claude Code": { status: "未验证" },
    Codex: { status: "未验证" },
    Cursor: { status: "未验证" },
    Windsurf: { status: "未验证" },
  };
}
