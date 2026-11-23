import collectedBundle from "./skills.collected.json";

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

function perms(
  read: [PermissionLevel, string],
  write: [PermissionLevel, string],
  shell: [PermissionLevel, string],
  network: [PermissionLevel, string],
  credentials: [PermissionLevel, string],
  remove: [PermissionLevel, string],
): Permission[] {
  return [
    { label: "读取项目文件", level: read[0], reason: read[1] },
    { label: "修改项目文件", level: write[0], reason: write[1] },
    { label: "执行 Shell", level: shell[0], reason: shell[1] },
    { label: "访问网络", level: network[0], reason: network[1] },
    { label: "访问系统凭据", level: credentials[0], reason: credentials[1] },
    { label: "删除文件", level: remove[0], reason: remove[1] },
  ];
}

const none: [PermissionLevel, string] = ["未发现", "静态扫描与人工复核均未发现"];
const pending: [PermissionLevel, string] = ["待评估", "尚未完成安全评估"];
const unverified: Compat = { status: "未验证" };

/** Hand-authored prototype skills (rich demo conclusions). */
export const prototypeSkills: Skill[] = [
  {
    id: "frontend-design",
    name: "frontend-design",
    owner: "anthropics",
    repo: "skills",
    category: "设计与用户体验",
    description: "生成有明确视觉方向、可用于生产环境的前端界面，避免模板化和通用 AI 风格。",
    tags: ["UI 设计", "React", "响应式"],
    keywords: ["前端设计", "界面", "前端 UI", "审查前端", "网页设计"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 3,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "macOS 15", verifiedDaysAgo: 3 },
      Cursor: {
        status: "部分支持",
        agentVersion: "1.2",
        os: "macOS 15",
        verifiedDaysAgo: 8,
        note: "转换为规则后可用，但不会自动加载引用的示例文件。",
      },
      Windsurf: unverified,
    },
    risk: "低风险",
    riskSummary: "未发现凭据访问、系统目录修改或未知网络请求。",
    permissions: perms(
      ["需要", "用于理解现有界面与组件"],
      ["需要", "仅限当前工作目录"],
      ["有限", "仅运行构建与本地预览命令"],
      none,
      none,
      none,
    ),
    status: "任务已实测",
    needsApiKey: false,
    paid: false,
    outputs: ["代码", "网页"],
    stars: "39.7K",
    installs: 18400,
    addedAt: "2026-02-18",
    sourceUpdatedDaysAgo: 3,
    license: "Apache-2.0",
    prerequisites: "Node.js 18+",
    verifiedCommit: "a38f42c",
    latestCommit: "a38f42c",
    useCases: [
      ["建立明确视觉方向", "在编码前确定字体、色彩、布局与动效语言，减少模板化输出。"],
      ["实现完整前端界面", "将设计决策落实为可运行、响应式且具备可访问性的代码。"],
      ["改进已有页面", "识别弱层级、低对比度和不一致细节，并提供可执行的修改。"],
    ],
    notFor: "纯后端任务、需要像素级复刻但没有参考设计、没有浏览器验证环境的复杂交互。",
    skillMd: `---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces.
---

Before coding, commit to a clear aesthetic direction:
- Purpose, tone and constraints of the interface
- Typography, color and layout decisions
- Motion and interaction details

Then implement working code that is responsive and accessible.`,
    tone: "violet",
    icon: "spark",
  },
  {
    id: "agent-browser",
    name: "agent-browser",
    owner: "vercel-labs",
    repo: "agent-browser",
    category: "生产力与自动化",
    description: "让 Agent 完成网页导航、表单填写、截图和内容提取，适合端到端验证与自动化任务。",
    tags: ["浏览器", "测试", "自动化"],
    keywords: ["浏览器自动化", "网页", "截图", "爬取"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 1,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "Ubuntu 24.04", verifiedDaysAgo: 2 },
      Cursor: {
        status: "部分支持",
        agentVersion: "1.2",
        os: "macOS 15",
        verifiedDaysAgo: 6,
        note: "需要手动将 CLI 加入 PATH，Agent 才能调用。",
      },
      Windsurf: {
        status: "部分支持",
        agentVersion: "1.9",
        os: "Windows 11",
        verifiedDaysAgo: 9,
        note: "Windows 下首次运行需要手动安装 Chromium。",
      },
    },
    risk: "中风险",
    riskSummary: "需要执行命令并访问任意网页；使用已登录的浏览器配置时可读取会话数据。",
    permissions: perms(
      ["有限", "仅读取配置文件"],
      ["有限", "仅写入截图与提取结果"],
      ["需要", "启动浏览器 CLI 进程"],
      ["需要", "访问任务指定的网页"],
      ["有限", "使用已登录配置时可读取 Cookie"],
      none,
    ),
    status: "任务已实测",
    needsApiKey: false,
    paid: false,
    outputs: ["数据", "图片"],
    stars: "12.4K",
    installs: 9600,
    addedAt: "2026-03-02",
    sourceUpdatedDaysAgo: 0,
    license: "Apache-2.0",
    prerequisites: "Node.js 20+，Chromium",
    verifiedCommit: "9c1e2d4",
    latestCommit: "4f7b0a1",
    useCases: [
      ["端到端流程验证", "按步骤完成登录、表单提交并保存每一步截图。"],
      ["网页内容提取", "从结构复杂的页面中抽取表格、列表等结构化数据。"],
      ["重复操作自动化", "把固定的后台操作交给 Agent 完成并记录过程。"],
    ],
    notFor: "需要通过复杂验证码的网站、涉及支付确认的操作、违反目标网站条款的抓取。",
    skillMd: `---
name: agent-browser
description: Browser automation CLI for AI agents.
---

Use \`agent-browser open <url>\` to start a session.
Use \`snapshot\` to get the accessibility tree with refs,
then \`click @ref\` / \`fill @ref "text"\` to interact.`,
    tone: "blue",
    icon: "bolt",
  },
  {
    id: "find-skills",
    name: "find-skills",
    owner: "vercel-labs",
    repo: "skills",
    category: "Agent 与工具链",
    description: "根据用户的任务描述发现并安装合适的 Agent Skill，扩展现有 Agent 的专业能力。",
    tags: ["Skill 发现", "工作流", "CLI"],
    keywords: ["查找 Skill", "安装", "工具箱"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 2,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "macOS 15", verifiedDaysAgo: 2 },
      Cursor: { status: "完整支持", agentVersion: "1.2", os: "macOS 15", verifiedDaysAgo: 5 },
      Windsurf: {
        status: "部分支持",
        agentVersion: "1.9",
        os: "macOS 15",
        verifiedDaysAgo: 5,
        note: "可搜索，但安装后需要重启 IDE 才生效。",
      },
    },
    risk: "中风险",
    riskSummary: "会从网络下载并安装第三方 Skill，安装内容本身需要单独评估。",
    permissions: perms(
      ["有限", "读取已安装的 Skill 列表"],
      ["需要", "写入 Skill 安装目录"],
      ["需要", "调用 npx 安装命令"],
      ["需要", "查询 Skill 索引并下载"],
      none,
      none,
    ),
    status: "安装已验证",
    needsApiKey: false,
    paid: false,
    outputs: ["文档"],
    stars: "39.7K",
    installs: 22100,
    addedAt: "2026-01-26",
    sourceUpdatedDaysAgo: 2,
    license: "MIT",
    prerequisites: "Node.js 18+",
    verifiedCommit: "e71b3aa",
    latestCommit: "e71b3aa",
    useCases: [
      ["按任务找 Skill", "用自然语言描述需求，返回候选 Skill 与安装命令。"],
      ["补齐能力缺口", "在任务卡住时建议可以引入的专业 Skill。"],
      ["统一团队工具箱", "快速为新项目安装团队约定的 Skill 组合。"],
    ],
    notFor: "需要离线环境、禁止安装第三方代码的受控项目。",
    skillMd: `---
name: find-skills
description: Discover and install agent skills for a task.
---

When the user asks for a capability you do not have,
search the skills index and propose candidates
with their install command before installing anything.`,
    tone: "mint",
    icon: "search",
  },
  {
    id: "systematic-debugging",
    name: "systematic-debugging",
    owner: "obra",
    repo: "superpowers",
    category: "开发与工程",
    description: "通过观察、提出假设、验证和复盘的闭环，帮助 Agent 系统化定位复杂软件缺陷。",
    tags: ["调试", "代码质量", "方法论"],
    keywords: ["调试缺陷", "修复 Bug", "根因分析"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 5,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "Ubuntu 24.04", verifiedDaysAgo: 5 },
      Cursor: {
        status: "部分支持",
        agentVersion: "1.2",
        os: "macOS 15",
        verifiedDaysAgo: 12,
        note: "规则可加载，但长任务中容易跳过验证步骤。",
      },
      Windsurf: unverified,
    },
    risk: "低风险",
    riskSummary: "仅读取和修改项目代码，命令限于运行测试。",
    permissions: perms(
      ["需要", "阅读相关源码与日志"],
      ["需要", "修复代码与补充测试"],
      ["有限", "仅运行测试与复现脚本"],
      none,
      none,
      none,
    ),
    status: "任务已实测",
    needsApiKey: false,
    paid: false,
    outputs: ["代码", "文档"],
    stars: "24.8K",
    installs: 11200,
    addedAt: "2026-02-04",
    sourceUpdatedDaysAgo: 5,
    license: "MIT",
    prerequisites: "无",
    verifiedCommit: "5d0c9e1",
    latestCommit: "5d0c9e1",
    useCases: [
      ["定位间歇性缺陷", "先稳定复现，再逐步缩小范围，避免盲目修改。"],
      ["验证根因假设", "每个假设都有对应的验证步骤与结果记录。"],
      ["用测试保护修复", "修复后补充回归测试，防止问题复发。"],
    ],
    notFor: "需要快速试错的原型探索、没有可运行测试环境的项目。",
    skillMd: `---
name: systematic-debugging
description: Use when encountering any bug or test failure.
---

1. Reproduce the issue reliably
2. Form a single hypothesis
3. Verify it with the smallest possible test
4. Fix the root cause, not the symptom`,
    tone: "amber",
    icon: "code",
  },
  {
    id: "requesting-code-review",
    name: "requesting-code-review",
    owner: "obra",
    repo: "superpowers",
    category: "开发与工程",
    description: "在合并前按清单审查改动，指出缺陷、遗漏的测试和可维护性问题，并给出修改建议。",
    tags: ["代码审查", "Git", "质量"],
    keywords: ["代码审查", "Code Review", "PR"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 4,
      },
      Codex: {
        status: "部分支持",
        agentVersion: "v0.8.2",
        os: "macOS 15",
        verifiedDaysAgo: 4,
        note: "不支持其中的子 Agent 审查步骤，会改为单轮审查。",
      },
      Cursor: unverified,
      Windsurf: unverified,
    },
    risk: "低风险",
    riskSummary: "只读审查，命令限于读取 Git 差异。",
    permissions: perms(
      ["需要", "阅读改动与上下文"],
      ["未发现", "审查阶段不修改代码"],
      ["有限", "仅运行 git diff / git log"],
      none,
      none,
      none,
    ),
    status: "安装已验证",
    needsApiKey: false,
    paid: false,
    outputs: ["文档"],
    stars: "24.8K",
    installs: 6300,
    addedAt: "2026-03-10",
    sourceUpdatedDaysAgo: 4,
    license: "MIT",
    prerequisites: "Git 仓库",
    verifiedCommit: "5d0c9e1",
    latestCommit: "5d0c9e1",
    useCases: [
      ["合并前自查", "在提交 PR 前发现明显缺陷与遗漏的测试。"],
      ["审查他人改动", "按统一清单输出结构化的审查意见。"],
      ["沉淀团队规范", "把团队的审查要求写成可复用的检查项。"],
    ],
    notFor: "替代安全审计、需要理解大量隐性业务背景的审查。",
    skillMd: `---
name: requesting-code-review
description: Use before merging to verify work meets requirements.
---

Review the diff against the plan:
- Correctness and edge cases
- Missing or weak tests
- Readability and maintainability`,
    tone: "slate",
    icon: "check",
  },
  {
    id: "brainstorming",
    name: "brainstorming",
    owner: "obra",
    repo: "superpowers",
    category: "产品与业务",
    description:
      "在动手实现前通过逐步提问澄清目标、约束和验收标准，把模糊想法整理成可执行的需求说明。",
    tags: ["需求澄清", "PRD", "规划"],
    keywords: ["需求", "产品", "方案设计"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 6,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "macOS 15", verifiedDaysAgo: 6 },
      Cursor: { status: "完整支持", agentVersion: "1.2", os: "macOS 15", verifiedDaysAgo: 10 },
      Windsurf: {
        status: "部分支持",
        agentVersion: "1.9",
        os: "macOS 15",
        verifiedDaysAgo: 10,
        note: "提问轮次较多时会提前结束澄清。",
      },
    },
    risk: "低风险",
    riskSummary: "仅进行对话并写入需求文档，不执行命令。",
    permissions: perms(
      ["有限", "读取现有文档以了解背景"],
      ["有限", "仅写入需求说明文档"],
      ["未发现", "不执行任何命令"],
      none,
      none,
      none,
    ),
    status: "安装已验证",
    needsApiKey: false,
    paid: false,
    outputs: ["文档"],
    stars: "24.8K",
    installs: 8800,
    addedAt: "2026-02-04",
    sourceUpdatedDaysAgo: 5,
    license: "MIT",
    prerequisites: "无",
    verifiedCommit: "5d0c9e1",
    latestCommit: "5d0c9e1",
    useCases: [
      ["澄清模糊需求", "一次只问一个问题，逐步收敛目标与边界。"],
      ["比较实现方案", "列出 2–3 个方案及取舍，再确认方向。"],
      ["产出需求说明", "输出可直接交给实现阶段的设计文档。"],
    ],
    notFor: "需求已经非常明确、只需要直接实现的小改动。",
    skillMd: `---
name: brainstorming
description: Use before any creative or implementation work.
---

Ask one question at a time to understand
purpose, constraints and success criteria.
Propose 2-3 approaches, then write the agreed design.`,
    tone: "rose",
    icon: "grid",
  },
  {
    id: "skill-creator",
    name: "skill-creator",
    owner: "anthropics",
    repo: "skills",
    category: "Agent 与工具链",
    description: "从需求定义、目录结构到测试清单，指导用户创建结构清晰且可维护的新 Skill。",
    tags: ["Skill 创建", "文档", "规范"],
    keywords: ["创建 Skill", "编写 Skill", "模板"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 3,
      },
      Codex: { status: "完整支持", agentVersion: "v0.8.2", os: "macOS 15", verifiedDaysAgo: 7 },
      Cursor: unverified,
      Windsurf: unverified,
    },
    risk: "低风险",
    riskSummary: "只创建 Skill 目录与文件，命令限于校验脚本。",
    permissions: perms(
      ["有限", "读取已有 Skill 作为参考"],
      ["需要", "创建 Skill 目录与文件"],
      ["有限", "运行结构校验脚本"],
      none,
      none,
      none,
    ),
    status: "安装已验证",
    needsApiKey: false,
    paid: false,
    outputs: ["文档", "代码"],
    stars: "39.7K",
    installs: 7400,
    addedAt: "2026-02-18",
    sourceUpdatedDaysAgo: 3,
    license: "Apache-2.0",
    prerequisites: "Python 3.10+",
    verifiedCommit: "a38f42c",
    latestCommit: "a38f42c",
    useCases: [
      ["创建新 Skill", "按规范生成 SKILL.md、脚本与参考文件结构。"],
      ["改进已有 Skill", "检查描述是否能被正确触发，精简冗余说明。"],
      ["编写测试清单", "为 Skill 补充可复现的验收用例。"],
    ],
    notFor: "只想使用现成 Skill、不打算编写或维护 Skill 的用户。",
    skillMd: `---
name: skill-creator
description: Guide for creating effective skills.
---

A skill is a folder with a SKILL.md file.
Keep the description specific about when to use it.
Move long references into separate files.`,
    tone: "rose",
    icon: "file",
  },
  {
    id: "webapp-testing",
    name: "webapp-testing",
    owner: "anthropics",
    repo: "skills",
    category: "测试与安全",
    description: "使用浏览器自动化验证本地 Web 应用的关键流程，并输出截图与可复现的问题记录。",
    tags: ["E2E", "浏览器", "测试"],
    keywords: ["浏览器自动化", "端到端测试", "Playwright"],
    compat: {
      "Claude Code": {
        status: "完整支持",
        agentVersion: "v1.0.24",
        os: "macOS 15",
        verifiedDaysAgo: 7,
      },
      Codex: unverified,
      Cursor: {
        status: "部分支持",
        agentVersion: "1.2",
        os: "macOS 15",
        verifiedDaysAgo: 11,
        note: "需手动安装 Playwright 浏览器。",
      },
      Windsurf: unverified,
    },
    risk: "中风险",
    riskSummary: "需要执行 Playwright 命令并启动本地服务，网络访问限于 localhost。",
    permissions: perms(
      ["需要", "读取应用代码以定位入口"],
      ["有限", "写入测试脚本与截图"],
      ["需要", "启动本地服务与 Playwright"],
      ["有限", "仅访问 localhost"],
      none,
      none,
    ),
    status: "任务已实测",
    needsApiKey: false,
    paid: false,
    outputs: ["代码", "图片"],
    stars: "39.7K",
    installs: 5900,
    addedAt: "2026-02-18",
    sourceUpdatedDaysAgo: 3,
    license: "Apache-2.0",
    prerequisites: "Python 3.10+，Playwright",
    verifiedCommit: "a38f42c",
    latestCommit: "a38f42c",
    useCases: [
      ["验证关键流程", "在本地完整走通注册、下单等核心路径。"],
      ["回归检查", "每次改动后自动复测并对比截图。"],
      ["复现问题", "把用户反馈转成可重复执行的测试脚本。"],
    ],
    notFor: "线上生产环境测试、需要真实支付或第三方登录的流程。",
    skillMd: `---
name: webapp-testing
description: Test local web applications using Playwright.
---

Start the server with scripts/with_server.py,
then write a Playwright script that navigates,
asserts and captures screenshots for each step.`,
    tone: "slate",
    icon: "terminal",
  },
  {
    id: "pptx",
    name: "pptx",
    owner: "anthropics",
    repo: "skills",
    category: "内容与文档",
    description: "创建、编辑和分析 PowerPoint 演示文稿，支持版式、图表和演讲者备注。",
    tags: ["演示文稿", "PPT", "办公"],
    keywords: ["制作演示", "幻灯片", "PowerPoint"],
    compat: {
      "Claude Code": unverified,
      Codex: unverified,
      Cursor: unverified,
      Windsurf: unverified,
    },
    risk: "未评估",
    riskSummary: "已收录，尚未完成安全评估。安装前请自行检查其中的 Python 脚本。",
    permissions: perms(pending, pending, pending, pending, pending, pending),
    status: "待验证",
    needsApiKey: false,
    paid: false,
    outputs: ["演示文稿"],
    stars: "39.7K",
    installs: 4100,
    addedAt: "2026-04-01",
    sourceUpdatedDaysAgo: 3,
    license: "Proprietary",
    prerequisites: "Python 3.10+，LibreOffice",
    verifiedCommit: "—",
    latestCommit: "a38f42c",
    useCases: [
      ["从大纲生成演示", "根据文字大纲生成带版式的幻灯片。"],
      ["批量修改已有文件", "统一字体、配色与页脚信息。"],
      ["提取演示内容", "把幻灯片中的文字与备注导出为文档。"],
    ],
    notFor: "需要复杂动画与精细设计还原的发布会级演示。",
    skillMd: `---
name: pptx
description: Presentation creation, editing, and analysis.
---

Use html2pptx for new decks from scratch.
Use the OOXML scripts to edit existing files.`,
    tone: "amber",
    icon: "file",
  },
];

const prototypeSkillIdSet = new Set(prototypeSkills.map((skill) => skill.id));

/** Hand-authored prototype Skills carry rich demo conclusions; collected drafts do not. */
export function isPrototypeSkill(id: string) {
  return prototypeSkillIdSet.has(id);
}

/** Prototype first (keeps verified demo + reviews), then collected drafts by new id. */
export const skills: Skill[] = (() => {
  const map = new Map<string, Skill>();
  for (const skill of prototypeSkills) map.set(skill.id, skill);
  const collected = (collectedBundle as { skills: Skill[] }).skills ?? [];
  for (const skill of collected) {
    if (!map.has(skill.id)) map.set(skill.id, skill);
  }
  return [...map.values()];
})();

/** MCP relation on Skill detail only (D-07 / FR-SKILL-06). Not a standalone directory. */
export type McpRelation = "required" | "optional";

export type SkillMcpLink = {
  name: string;
  slug: string;
  url: string;
  relation: McpRelation;
  purposeZh: string;
  purposeEn: string;
  setupZh: string;
  setupEn: string;
  envVars?: string[];
};

const skillMcpLinks: Record<string, SkillMcpLink[]> = {
  "agent-browser": [
    {
      name: "Playwright",
      slug: "playwright",
      url: "https://github.com/microsoft/playwright-mcp",
      relation: "required",
      purposeZh: "驱动无头浏览器完成导航、表单与截图。",
      purposeEn: "Drives a headless browser for navigation, forms, and screenshots.",
      setupZh: "安装 Playwright MCP，并允许 Agent 调用 browser_* 工具。",
      setupEn: "Install the Playwright MCP and allow the Agent to call browser_* tools.",
      envVars: ["PLAYWRIGHT_BROWSERS_PATH"],
    },
  ],
  "webapp-testing": [
    {
      name: "Playwright",
      slug: "playwright",
      url: "https://github.com/microsoft/playwright-mcp",
      relation: "required",
      purposeZh: "在本地 Web 应用上执行端到端断言与截图取证。",
      purposeEn: "Runs end-to-end assertions and screenshot evidence on a local web app.",
      setupZh: "配置 MCP 可访问本地开发服务器（如 localhost）。",
      setupEn: "Configure the MCP to reach the local dev server (e.g. localhost).",
    },
  ],
  "find-skills": [
    {
      name: "GitHub",
      slug: "github",
      url: "https://github.com/github/github-mcp-server",
      relation: "optional",
      purposeZh: "增强仓库与 Skill 元数据检索（可选）。",
      purposeEn: "Optional enrichment for repository and Skill metadata lookup.",
      setupZh: "提供有读权限的 GitHub token；无 MCP 时仍可按文档手工安装。",
      setupEn: "Provide a read-scoped GitHub token; manual install still works without MCP.",
      envVars: ["GITHUB_TOKEN"],
    },
  ],
};

export function mcpsForSkill(skillId: string): SkillMcpLink[] {
  return skillMcpLinks[skillId] ?? [];
}

export const catalogCounts: Record<Category, number> = (() => {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const skill of skills) counts[skill.category] += 1;
  return counts;
})();

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

/* ---------- Reviews ---------- */

export type Level = "优秀" | "良好" | "一般" | "不足";
export type Verdict = "推荐" | "有条件推荐" | "不推荐";
export const BASELINE = "baseline";

export type Review = {
  id: string;
  title: string;
  category: Category;
  task: string;
  acceptance: string[];
  /** Skill ids; may include BASELINE for the no-Skill control run. */
  participants: string[];
  agent: AgentName;
  agentVersion: string;
  model: string;
  os: string;
  daysAgo: number;
  readMinutes: number;
  summary: string;
  dimensions: { name: string; results: Record<string, Level> }[];
  runs: Record<
    string,
    {
      completed: "是" | "部分" | "否";
      interventions: number;
      duration: string;
      verdict?: Verdict;
      note: string;
    }
  >;
  evidence: string[];
};

export const reviews: Review[] = [
  {
    id: "frontend-design-vs-baseline",
    title: "前端设计 Skill，真的能减少“AI 味”吗？",
    category: "设计与用户体验",
    task: "将基础 SaaS 仪表盘改造成高质量响应式界面",
    acceptance: [
      "桌面、平板、手机三种宽度下无布局错误",
      "主要文本对比度达到 WCAG AA",
      "保留原有数据与交互，不新增依赖",
    ],
    participants: ["frontend-design", BASELINE],
    agent: "Claude Code",
    agentVersion: "v1.0.24",
    model: "Claude Sonnet 4.5",
    os: "macOS 15",
    daysAgo: 3,
    readMinutes: 12,
    summary: "视觉方向明确，响应式完成度高；继承既有设计系统时仍需人工补充约束。",
    dimensions: [
      { name: "视觉方向", results: { "frontend-design": "优秀", [BASELINE]: "一般" } },
      { name: "代码完成度", results: { "frontend-design": "优秀", [BASELINE]: "良好" } },
      { name: "响应式", results: { "frontend-design": "良好", [BASELINE]: "一般" } },
      { name: "可访问性", results: { "frontend-design": "良好", [BASELINE]: "不足" } },
    ],
    runs: {
      "frontend-design": {
        completed: "是",
        interventions: 1,
        duration: "12m 36s",
        verdict: "推荐",
        note: "主动建立视觉方向并持续检查排版与间距；需要人工说明既有设计规范。",
      },
      [BASELINE]: {
        completed: "是",
        interventions: 4,
        duration: "9m 02s",
        note: "能完成功能改造，但配色与布局趋于通用模板，移动端存在溢出。",
      },
    },
    evidence: [
      "三种宽度的完整截图",
      "Lighthouse 可访问性报告",
      "完整对话与命令记录",
      "最终代码差异",
    ],
  },
  {
    id: "systematic-debugging-vs-baseline",
    title: "让 Agent 先验证假设，修 Bug 会更快吗？",
    category: "开发与工程",
    task: "定位并修复 React 应用中的间歇性状态同步问题",
    acceptance: ["稳定复现问题", "指出根因并给出证据", "修复后新增回归测试且全部通过"],
    participants: ["systematic-debugging", BASELINE],
    agent: "Codex",
    agentVersion: "v0.8.2",
    model: "GPT-5 Codex",
    os: "Ubuntu 24.04",
    daysAgo: 5,
    readMinutes: 9,
    summary: "调试路径稳定，能够坚持先验证假设再修改代码，减少了无效尝试。",
    dimensions: [
      { name: "根因定位", results: { "systematic-debugging": "优秀", [BASELINE]: "一般" } },
      { name: "修复正确性", results: { "systematic-debugging": "优秀", [BASELINE]: "良好" } },
      { name: "回归保护", results: { "systematic-debugging": "良好", [BASELINE]: "不足" } },
      { name: "过程透明度", results: { "systematic-debugging": "优秀", [BASELINE]: "一般" } },
    ],
    runs: {
      "systematic-debugging": {
        completed: "是",
        interventions: 0,
        duration: "18m 10s",
        verdict: "推荐",
        note: "耗时更长，但一次修复到位，并留下可复用的回归测试。",
      },
      [BASELINE]: {
        completed: "部分",
        interventions: 2,
        duration: "11m 40s",
        note: "通过增加延迟掩盖了问题，未定位到真正的竞态根因。",
      },
    },
    evidence: ["复现脚本", "假设与验证记录", "回归测试结果", "最终代码差异"],
  },
  {
    id: "browser-automation-compare",
    title: "浏览器自动化：agent-browser 与 webapp-testing 怎么选？",
    category: "测试与安全",
    task: "自动完成登录、表单提交与结果截图",
    acceptance: ["完成 3 个步骤并保存每步截图", "失败时输出可复现的错误信息", "不修改业务代码"],
    participants: ["agent-browser", "webapp-testing"],
    agent: "Claude Code",
    agentVersion: "v1.0.24",
    model: "Claude Sonnet 4.5",
    os: "macOS 15",
    daysAgo: 7,
    readMinutes: 10,
    summary:
      "两者都能完成主流程；agent-browser 更擅长交互恢复，webapp-testing 更适合沉淀测试脚本。",
    dimensions: [
      { name: "流程稳定性", results: { "agent-browser": "良好", "webapp-testing": "良好" } },
      { name: "失败恢复", results: { "agent-browser": "良好", "webapp-testing": "一般" } },
      { name: "证据输出", results: { "agent-browser": "优秀", "webapp-testing": "良好" } },
      { name: "配置成本", results: { "agent-browser": "一般", "webapp-testing": "良好" } },
    ],
    runs: {
      "agent-browser": {
        completed: "是",
        interventions: 2,
        duration: "6m 48s",
        verdict: "有条件推荐",
        note: "主流程稳定，复杂验证码和跨域弹窗需要人工接管。",
      },
      "webapp-testing": {
        completed: "是",
        interventions: 3,
        duration: "8m 15s",
        verdict: "有条件推荐",
        note: "生成的 Playwright 脚本可直接复用，但选择器失效时恢复较慢。",
      },
    },
    evidence: ["每步截图", "生成的测试脚本", "失败重试记录", "完整命令记录"],
  },
];

export function reviewsForSkill(skillId: string) {
  return reviews.filter((review) => review.participants.includes(skillId));
}

/* ---------- Workflows ---------- */

export type Workflow = {
  id: string;
  title: string;
  category: Category;
  summary: string;
  tone: string;
  time: string;
  level: "入门" | "进阶";
  verifiedOn: AgentName[];
  steps: { skillId: string; goal: string; input: string; output: string }[];
};

export const workflows: Workflow[] = [
  {
    id: "prd-to-frontend",
    title: "从 PRD 到可交付的前端页面",
    category: "设计与用户体验",
    summary: "先澄清需求，再建立视觉方向，最后通过真实浏览器检查响应式、交互和可访问性。",
    tone: "violet",
    time: "约 45–60 分钟",
    level: "入门",
    verifiedOn: ["Claude Code"],
    steps: [
      {
        skillId: "brainstorming",
        goal: "澄清页面目标、目标用户与验收标准",
        input: "PRD 或一句话需求",
        output: "页面需求说明",
      },
      {
        skillId: "frontend-design",
        goal: "确定视觉方向并实现响应式界面",
        input: "页面需求说明",
        output: "可运行的页面代码",
      },
      {
        skillId: "webapp-testing",
        goal: "在三种宽度下验证关键流程并截图",
        input: "本地运行的页面",
        output: "截图与问题清单",
      },
    ],
  },
  {
    id: "debug-and-protect",
    title: "定位并修复复杂代码缺陷",
    category: "开发与工程",
    summary: "复现问题、建立假设、验证根因，再用测试和审查保护修复结果。",
    tone: "blue",
    time: "约 30 分钟",
    level: "进阶",
    verifiedOn: ["Claude Code"],
    steps: [
      {
        skillId: "systematic-debugging",
        goal: "复现问题并验证根因",
        input: "问题描述与日志",
        output: "根因说明与修复代码",
      },
      {
        skillId: "webapp-testing",
        goal: "用浏览器回归验证修复",
        input: "修复后的应用",
        output: "回归测试脚本",
      },
      {
        skillId: "requesting-code-review",
        goal: "合并前检查改动质量",
        input: "Git 差异",
        output: "审查意见",
      },
    ],
  },
  {
    id: "skill-toolbox",
    title: "建立自己的 Skill 工具箱",
    category: "Agent 与工具链",
    summary: "发现合适的 Skill，检查来源与风险，并为团队创建自己的 Skill。",
    tone: "mint",
    time: "约 20 分钟",
    level: "入门",
    verifiedOn: ["Claude Code", "Codex"],
    steps: [
      {
        skillId: "find-skills",
        goal: "按任务找到候选 Skill",
        input: "团队常见任务列表",
        output: "候选 Skill 与安装命令",
      },
      {
        skillId: "skill-creator",
        goal: "把团队规范写成新的 Skill",
        input: "团队规范文档",
        output: "可安装的团队 Skill",
      },
    ],
  },
];

export function getSkill(id: string) {
  return skills.find((skill) => skill.id === id);
}

const RISK_ORDER: RiskLevel[] = ["低风险", "中风险", "未评估"];
export function highestRisk(list: Skill[]): RiskLevel {
  return list.reduce<RiskLevel>(
    (worst, skill) =>
      RISK_ORDER.indexOf(skill.risk) > RISK_ORDER.indexOf(worst) ? skill.risk : worst,
    "低风险",
  );
}

export function workflowAgents(workflow: Workflow) {
  const list = workflow.steps.map((step) => getSkill(step.skillId)!);
  return AGENTS.filter((agent) => list.every((skill) => skill.compat[agent].status !== "未验证"));
}
