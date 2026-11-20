/**
 * Heuristic cleaning for collected Skill drafts.
 * Does NOT invent “任务已实测” or unexplained security verdicts.
 * Agent claims from 对标站 → 部分支持 + 明确“未经本站验证”备注.
 */
import type {
  AgentName,
  Category,
  Compat,
  OutputFormat,
  Permission,
  PermissionLevel,
  RiskLevel,
  SkillDraft,
  VerifyStatus,
} from "./schema.ts";
import { AGENTS, OUTPUT_FORMATS, pendingPermissions, unverifiedCompat } from "./schema.ts";

export type CleanableSkill = {
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
};

type Rule = { category: Category; patterns: RegExp[] };

const CATEGORY_RULES: Rule[] = [
  {
    category: "设计与用户体验",
    patterns: [
      /\b(ui|ux|designs?|redesign|frontend|typography|layout|css|tailwind|figma|impeccable|aesthetic|interfaces?)\b/i,
      /(设计|界面|排版|视觉|前端|样式|体验)/,
    ],
  },
  {
    category: "测试与安全",
    patterns: [
      /\b(tests?|testing|qa|security|audits?|vulnerab|pentest|owasp|snyk|lint|debug|debugging)\b/i,
      /(测试|安全|审计|漏洞|调试|质量)/,
    ],
  },
  {
    category: "数据与研究",
    patterns: [
      /\b(data|sql|databases?|analytics|research|pandas|etl|metrics?|charts?|plots?)\b/i,
      /(数据|研究|分析|统计|数据库)/,
    ],
  },
  {
    category: "内容与文档",
    patterns: [
      /\b(docs?|documentation|markdown|writing|blog|copywriting|readme|content|translate|i18n)\b/i,
      /(文档|写作|文案|翻译|内容)/,
    ],
  },
  {
    category: "视觉与多媒体",
    patterns: [
      /\b(images?|videos?|audio|avatars?|animations?|remotion|manim|slides?|pptx|canvas|media)\b/i,
      /(图片|视频|音频|动画|多媒体|演示|幻灯)/,
    ],
  },
  {
    category: "营销与增长",
    patterns: [/\b(marketing|seo|growth|ads?|campaigns?|social|twitter|reddit)\b/i, /(营销|增长|投放|运营)/],
  },
  {
    category: "产品与业务",
    patterns: [/\b(product|prd|roadmap|business|okr|specs?|requirements?)\b/i, /(产品|需求|业务|规划)/],
  },
  {
    category: "生产力与自动化",
    patterns: [
      /\b(automat(?:e|ion|ing)?|browsers?|workflows?|agent-browser|scrap(?:e|ing)?|crawl(?:er|ing)?|bots?)\b/i,
      /(自动化|浏览器|工作流|爬取)/,
    ],
  },
  {
    category: "开发与工程",
    patterns: [
      /\b(code|coding|refactor|apis?|backend|react|typescript|python|git|pull request|\bpr\b|code review|deploy|devops)\b/i,
      /(开发|工程|代码|重构|部署|后端)/,
    ],
  },
  {
    // Lowest priority dump — only when nothing else scored.
    category: "Agent 与工具链",
    patterns: [/\b(mcp|toolchain|skill-creator|find-skills)\b/i, /(工具链|技能创建)/],
  },
];

const OUTPUT_RULES: { format: OutputFormat; patterns: RegExp[] }[] = [
  { format: "代码", patterns: [/\b(code|typescript|javascript|python|react|api|sdk)\b/i, /(代码|编程)/] },
  { format: "网页", patterns: [/\b(web|html|css|frontend|ui|page|website)\b/i, /(网页|页面|网站)/] },
  { format: "文档", patterns: [/\b(doc|markdown|readme|writing|blog)\b/i, /(文档|文案)/] },
  { format: "数据", patterns: [/\b(data|csv|sql|json|analytics|dataset)\b/i, /(数据)/] },
  { format: "图片", patterns: [/\b(image|png|svg|illustration|icon|photo)\b/i, /(图片|图像|图标)/] },
  { format: "演示文稿", patterns: [/\b(pptx|slide|presentation|deck)\b/i, /(演示|幻灯|ppt)/] },
  { format: "视频", patterns: [/\b(video|mp4|remotion|animation|avatar)\b/i, /(视频|动画)/] },
];

const AGENT_ALIASES: Record<string, AgentName> = {
  "claude code": "Claude Code",
  claude: "Claude Code",
  "claude-code": "Claude Code",
  codex: "Codex",
  "codex cli": "Codex",
  cursor: "Cursor",
  windsurf: "Windsurf",
};

function corpus(skill: CleanableSkill, draft?: SkillDraft): string {
  const extra = (draft?.sources.benchmarks ?? [])
    .flatMap((b) => [b.description ?? "", ...(b.tags ?? []), ...(b.agentsClaimed ?? [])])
    .join(" ");
  return [
    skill.id,
    skill.name,
    skill.description,
    skill.tags.join(" "),
    skill.keywords.join(" "),
    skill.skillMd,
    skill.prerequisites,
    extra,
  ]
    .join("\n")
    .toLowerCase();
}

function cleanCategory(_skill: CleanableSkill, text: string): Category {
  let best: Category = "Agent 与工具链";
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const p of rule.patterns) if (p.test(text)) score += 1;
    // Prefer more specific task categories over Agent dump on ties.
    if (score > bestScore || (score === bestScore && score > 0 && best === "Agent 与工具链")) {
      bestScore = score;
      best = rule.category;
    }
  }
  return bestScore > 0 ? best : "Agent 与工具链";
}

function claimedAgents(draft?: SkillDraft): AgentName[] {
  const names = new Set<AgentName>();
  for (const b of draft?.sources.benchmarks ?? []) {
    const mappedList: AgentName[] = [];
    for (const raw of b.agentsClaimed ?? []) {
      const key = raw.trim().toLowerCase();
      const mapped = AGENT_ALIASES[key];
      if (mapped) mappedList.push(mapped);
      else {
        for (const agent of AGENTS) {
          if (key === agent.toLowerCase() || key.includes(agent.toLowerCase())) mappedList.push(agent);
        }
      }
    }
    const unique = [...new Set(mappedList)];
    // skills.sh page chrome lists all agents — ignore “claims” that are all four core agents.
    if (b.siteKey === "skills-sh" && unique.length >= AGENTS.length) continue;
    for (const agent of unique) names.add(agent);
  }
  return [...names];
}

function cleanCompat(draft?: SkillDraft): Record<AgentName, Compat> {
  const base = unverifiedCompat();
  const claimed = claimedAgents(draft);
  for (const agent of claimed) {
    base[agent] = {
      status: "部分支持",
      note: "对标站或来源页声明可用，本站尚未做兼容性验证",
    };
  }
  return base;
}

function setPerm(
  list: Permission[],
  label: string,
  level: PermissionLevel,
  reason: string,
): Permission[] {
  return list.map((p) => (p.label === label ? { ...p, level, reason } : p));
}

function cleanSecurityAndRequirements(
  skill: CleanableSkill,
  text: string,
): Pick<
  CleanableSkill,
  "risk" | "riskSummary" | "permissions" | "needsApiKey" | "paid" | "prerequisites"
> {
  let permissions = skill.permissions?.length ? [...skill.permissions] : pendingPermissions();
  const reasons: string[] = [];

  const needsApiKey =
    skill.needsApiKey ||
    /\b(api[_ -]?key|openai|anthropic|gemini api|bearer token|secret key)\b/i.test(text);
  const paid = skill.paid || /\b(paid|premium|subscription|license fee|付费|订阅)\b/i.test(text);

  const needsShell = /\b(shell|bash|zsh|powershell|exec|cli|terminal|command line|npx |npm |pnpm )\b/i.test(
    text,
  );
  const needsNetwork =
    /\b(http|https|fetch|network|webhook|download|crawl|scrap|api\.|openai|remote)\b/i.test(text);
  const needsCreds =
    /\b(credential|password|token|secret|ssh key|env var|环境变量|凭据)\b/i.test(text);
  const writesFiles = /\b(write|edit|modify|refactor|generate file|patch|commit)\b/i.test(text);
  const readsFiles = writesFiles || /\b(read|inspect|review|audit|analyze code)\b/i.test(text);

  if (readsFiles) {
    permissions = setPerm(permissions, "读取项目文件", "需要", "文本启发式：涉及读取/审查项目内容（待人工复核）");
    reasons.push("可能读取项目文件");
  }
  if (writesFiles) {
    permissions = setPerm(permissions, "修改项目文件", "需要", "文本启发式：涉及生成或修改文件（待人工复核）");
    reasons.push("可能修改项目文件");
  }
  if (needsShell) {
    permissions = setPerm(permissions, "执行 Shell", "有限", "文本启发式：出现 CLI/Shell/安装命令迹象（待人工复核）");
    reasons.push("可能执行命令");
  }
  if (needsNetwork) {
    permissions = setPerm(permissions, "访问网络", "有限", "文本启发式：出现网络/API/抓取迹象（待人工复核）");
    reasons.push("可能访问网络");
  }
  if (needsCreds || needsApiKey) {
    permissions = setPerm(
      permissions,
      "访问系统凭据",
      needsCreds ? "有限" : "待评估",
      "文本启发式：出现密钥/Token/API Key 迹象（待人工复核）",
    );
    reasons.push("可能涉及密钥或 API Key");
  }

  let risk: RiskLevel = "未评估";
  let riskSummary = "尚未完成安全评估";
  if (needsCreds) {
    risk = "中风险";
    riskSummary = `启发式判定为中风险（${reasons.join("；") || "涉及凭据迹象"}）。结论待人工复核，非正式安全审计。`;
  } else if (needsShell || needsNetwork || writesFiles) {
    risk = "中风险";
    riskSummary = `启发式判定为中风险（${reasons.join("；")}）。结论待人工复核，非正式安全审计。`;
  } else if (readsFiles && !needsShell && !needsNetwork) {
    risk = "低风险";
    riskSummary =
      "启发式倾向低风险（主要像读写/审查文本，未见明显 Shell/网络/凭据迹象）。结论待人工复核，非正式安全审计。";
  }

  const prerequisites = skill.prerequisites?.trim()
    ? skill.prerequisites
    : [
        needsApiKey ? "可能需要外部 API Key" : "",
        paid ? "可能涉及付费" : "",
        needsShell ? "可能需要本机命令行环境" : "",
      ]
        .filter(Boolean)
        .join("；");

  return { risk, riskSummary, permissions, needsApiKey, paid, prerequisites };
}

function cleanOutputs(skill: CleanableSkill, text: string): OutputFormat[] {
  const found = new Set<OutputFormat>();
  for (const rule of OUTPUT_RULES) {
    if (rule.patterns.some((p) => p.test(text))) found.add(rule.format);
  }
  for (const o of skill.outputs ?? []) {
    if ((OUTPUT_FORMATS as readonly string[]).includes(o)) found.add(o);
  }
  return [...found];
}

function cleanStatus(skill: CleanableSkill, draft?: SkillDraft): VerifyStatus {
  // Never promote to 任务已实测 from crawl alone.
  if (skill.status === "任务已实测") return "待验证";
  if (skill.status === "安装已验证") return "待验证";
  const hasSkillMd = Boolean(skill.skillMd?.trim()) || Boolean(draft?.sources.github?.skillMd);
  // Keep 待验证; skillMd presence is evidence of source material, not install verification.
  void hasSkillMd;
  return "待验证";
}

/** Apply all six cleaning dimensions to one collected skill. */
export function cleanSkill(skill: CleanableSkill, draft?: SkillDraft): CleanableSkill {
  const text = corpus(skill, draft);
  const sec = cleanSecurityAndRequirements(skill, text);
  return {
    ...skill,
    category: cleanCategory(skill, text),
    compat: cleanCompat(draft),
    status: cleanStatus(skill, draft),
    risk: sec.risk,
    riskSummary: sec.riskSummary,
    permissions: sec.permissions,
    needsApiKey: sec.needsApiKey,
    paid: sec.paid,
    prerequisites: sec.prerequisites,
    outputs: cleanOutputs(skill, text),
    keywords: skill.keywords?.length ? skill.keywords : skill.tags.slice(),
  };
}
