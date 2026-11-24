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

export type IconName =
  | "arrow"
  | "bolt"
  | "bookmark"
  | "check"
  | "chevron"
  | "clock"
  | "code"
  | "copy"
  | "external"
  | "file"
  | "filter"
  | "github"
  | "grid"
  | "menu"
  | "moon"
  | "plus"
  | "search"
  | "shield"
  | "spark"
  | "star"
  | "sun"
  | "terminal"
  | "warning"
  | "x";

export type CompatStatus = "完整支持" | "部分支持" | "未验证";
export type RiskLevel = "低风险" | "中风险" | "未评估";
export type VerifyStatus = "任务已实测" | "安装已验证" | "待验证";
export type PermissionLevel = "需要" | "有限" | "未发现" | "待评估";

/** One verification record per Agent. Mirrors the PRD compatibility entity. */
export type Compat = {
  status: CompatStatus;
  agentVersion?: string;
  os?: string;
  verifiedDaysAgo?: number;
  note?: string;
};

export type Permission = { label: string; level: PermissionLevel; reason: string };

export type Skill = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  category: Category;
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
  sourceUpdatedDaysAgo: number;
  license: string;
  prerequisites: string;
  /** Commit the current conclusions are based on. */
  verifiedCommit: string;
  /** Latest commit seen in the source repository. */
  latestCommit: string;
  useCases: [string, string][];
  notFor: string;
  skillMd: string;
  tone: string;
  icon: IconName;
};

export const AGENT_META: Record<
  AgentName,
  { mark: string; tone: string; installDir: (name: string) => string; format: string }
> = {
  "Claude Code": {
    mark: "CC",
    tone: "a0",
    installDir: (name) => `.claude/skills/${name}/`,
    format: "原生 SKILL.md，无需转换",
  },
  Codex: {
    mark: "CX",
    tone: "a1",
    installDir: (name) => `.codex/skills/${name}/`,
    format: "原生 SKILL.md，无需转换",
  },
  Cursor: {
    mark: "CU",
    tone: "a2",
    installDir: (name) => `.cursor/rules/${name}.mdc`,
    format: "自动转换为 .mdc 项目规则",
  },
  Windsurf: {
    mark: "WS",
    tone: "a3",
    installDir: (name) => `.windsurf/rules/${name}.md`,
    format: "自动转换为 Windsurf 规则文件",
  },
};

const AGENT_FLAG: Record<AgentName, string> = {
  "Claude Code": "claude-code",
  Codex: "codex",
  Cursor: "cursor",
  Windsurf: "windsurf",
};

/** Plan B: every Agent gets its own install command, target directory and uninstall path. */
export function installFor(skill: Skill, agent: AgentName) {
  const dir = AGENT_META[agent].installDir(skill.name);
  return {
    command: `npx skills add ${skill.owner}/${skill.repo} --skill ${skill.name} --agent ${AGENT_FLAG[agent]}`,
    uninstall: `npx skills remove ${skill.name} --agent ${AGENT_FLAG[agent]}`,
    dir,
    format: AGENT_META[agent].format,
  };
}

export function supportedAgents(skill: Skill) {
  return AGENTS.filter((agent) => skill.compat[agent].status !== "未验证");
}

export function lastVerifiedDays(skill: Skill) {
  const days = AGENTS.map((agent) => skill.compat[agent].verifiedDaysAgo).filter(
    (value): value is number => value !== undefined,
  );
  return days.length ? Math.min(...days) : null;
}

export function isStale(skill: Skill) {
  return skill.verifiedCommit !== skill.latestCommit;
}

export function permissionLevel(skill: Skill, label: string): PermissionLevel {
  return skill.permissions.find((item) => item.label === label)?.level ?? "待评估";
}

export function needsShell(skill: Skill) {
  return permissionLevel(skill, "执行 Shell") !== "未发现";
}

export function needsNetwork(skill: Skill) {
  return permissionLevel(skill, "访问网络") !== "未发现";
}

export function relativeDays(days: number | null | undefined) {
  if (days === null || days === undefined) return "—";
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 14) return `${days} 天前`;
  return `${Math.round(days / 7)} 周前`;
}

export const categoryMeta: Record<Category, { icon: IconName; tone: string }> = {
  开发与工程: { icon: "code", tone: "blue" },
  设计与用户体验: { icon: "grid", tone: "violet" },
  测试与安全: { icon: "shield", tone: "amber" },
  数据与研究: { icon: "search", tone: "mint" },
  内容与文档: { icon: "file", tone: "rose" },
  视觉与多媒体: { icon: "spark", tone: "violet" },
  营销与增长: { icon: "bolt", tone: "amber" },
  产品与业务: { icon: "grid", tone: "slate" },
  生产力与自动化: { icon: "terminal", tone: "blue" },
  "Agent 与工具链": { icon: "spark", tone: "mint" },
};

export const agentProfiles: Record<
  AgentName,
  { copy: string; verified: number; compatible: number; tone: string }
> = {
  "Claude Code": {
    copy: "Anthropic 的命令行编码 Agent，当前拥有最完整的 Skill 验证覆盖。",
    verified: 52,
    compatible: 118,
    tone: "charcoal",
  },
  Codex: {
    copy: "OpenAI 的编码 Agent，支持项目级 Skill 安装与可复用工作流程。",
    verified: 38,
    compatible: 96,
    tone: "black",
  },
  Cursor: {
    copy: "以编辑器为核心的 AI 开发环境，Skill 需转换为 .mdc 规则后使用。",
    verified: 21,
    compatible: 74,
    tone: "indigo",
  },
  Windsurf: {
    copy: "支持多步骤编码任务的 AI IDE，兼容性测试正在逐步完善。",
    verified: 12,
    compatible: 43,
    tone: "teal",
  },
};

const RISK_ORDER: RiskLevel[] = ["低风险", "中风险", "未评估"];

export function highestRisk(list: Skill[]): RiskLevel {
  return list.reduce<RiskLevel>(
    (worst, skill) =>
      RISK_ORDER.indexOf(skill.risk) > RISK_ORDER.indexOf(worst) ? skill.risk : worst,
    "低风险",
  );
}

const PROTOTYPE_SKILL_IDS = new Set([
  "frontend-design",
  "agent-browser",
  "find-skills",
  "systematic-debugging",
  "requesting-code-review",
  "brainstorming",
  "skill-creator",
  "webapp-testing",
  "pptx",
]);

/** Hand-authored skills carry demo conclusions. Collected drafts do not. */
export function isPrototypeSkill(id: string) {
  return PROTOTYPE_SKILL_IDS.has(id);
}
