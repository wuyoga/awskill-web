import "server-only";

import enEnums from "@/i18n/messages/en/enums.json";
import type { Locale } from "@/i18n/locale";
import { parseSkillLimit } from "@/lib/routes";

import { catalogCounts, getSkill, skills } from "./catalog";
import { skillEn } from "./en";
import { localizeSkill, presentSkill } from "./localize";
import {
  AGENTS,
  CATEGORIES,
  type AgentName,
  type Category,
  lastVerifiedDays,
  needsNetwork,
  needsShell,
  OUTPUT_FORMATS,
  type RiskLevel,
  type Skill,
  type VerifyStatus,
} from "./model";
import type { SkillQueryResult } from "./skill-result";

const STATUS_OPTIONS: VerifyStatus[] = ["任务已实测", "安装已验证", "待验证"];
const RISK_OPTIONS: RiskLevel[] = ["低风险", "中风险", "未评估"];
const SORTS = ["综合推荐", "最近验证", "最多使用", "最新收录"] as const;
type Sort = (typeof SORTS)[number];

const REQUIREMENTS = {
  "无需 API Key": (skill: Skill) => !skill.needsApiKey,
  免费使用: (skill: Skill) => !skill.paid,
  "无需执行 Shell": (skill: Skill) => !needsShell(skill),
  无需访问网络: (skill: Skill) => !needsNetwork(skill),
} as const;
type Requirement = keyof typeof REQUIREMENTS;

const STATUS_RANK: Record<VerifyStatus, number> = { 任务已实测: 0, 安装已验证: 1, 待验证: 2 };

const enumLabels = enEnums as Record<string, string>;

let haystacks: Map<string, string> | null = null;

function haystack(skill: Skill) {
  if (!haystacks) {
    haystacks = new Map();
    for (const item of skills) {
      const en = skillEn[item.id];
      haystacks.set(
        item.id,
        [
          item.name,
          item.owner,
          item.repo,
          item.description,
          item.category,
          ...item.tags,
          ...item.keywords,
          en?.description ?? "",
          ...(en?.tags ?? []),
          enumLabels[item.category] ?? item.category,
          ...item.outputs.map((output) => enumLabels[output] ?? output),
        ]
          .join(" ")
          .toLowerCase(),
      );
    }
  }
  return haystacks.get(skill.id) ?? "";
}

function matchesQuery(skill: Skill, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const text = haystack(skill);
  return (
    text.includes(normalized) || normalized.split(/\s+/).every((token) => text.includes(token))
  );
}

function sortSkills(list: Skill[], sort: Sort) {
  const copy = [...list];
  if (sort === "最近验证") {
    return copy.sort((a, b) => (lastVerifiedDays(a) ?? 1e9) - (lastVerifiedDays(b) ?? 1e9));
  }
  if (sort === "最多使用") return copy.sort((a, b) => b.installs - a.installs);
  if (sort === "最新收录") return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return copy.sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      RISK_OPTIONS.indexOf(a.risk) - RISK_OPTIONS.indexOf(b.risk) ||
      b.installs - a.installs,
  );
}

function known<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((item): item is T => (allowed as readonly string[]).includes(item));
}

function csv(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toSearchParams(sp: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

const CATALOG_TOTAL = (Object.values(catalogCounts) as number[]).reduce((sum, count) => sum + count, 0);

export function querySkills(locale: Locale, params: URLSearchParams): SkillQueryResult {
  const categoryValue = params.get("category");
  const category: Category | "全部" = CATEGORIES.includes(categoryValue as Category)
    ? (categoryValue as Category)
    : "全部";
  const agentValue = params.get("agent");
  const agent: AgentName | "全部" = AGENTS.includes(agentValue as AgentName)
    ? (agentValue as AgentName)
    : "全部";
  const sortValue = params.get("sort");
  const sort: Sort = SORTS.includes(sortValue as Sort) ? (sortValue as Sort) : "综合推荐";
  const statuses = known(csv(params, "status"), STATUS_OPTIONS);
  const risks = known(csv(params, "risk"), RISK_OPTIONS);
  const requirements = known(csv(params, "req"), Object.keys(REQUIREMENTS) as Requirement[]);
  const outputs = known(csv(params, "out"), OUTPUT_FORMATS);
  const query = params.get("q") ?? "";
  const limit = parseSkillLimit(params.get("limit"));

  const categoryCounts = Object.fromEntries(CATEGORIES.map((item) => [item, 0])) as Record<
    Category,
    number
  >;
  const matched: Skill[] = [];

  for (const skill of skills) {
    if (!matchesQuery(skill, query)) continue;
    if (agent !== "全部" && skill.compat[agent].status === "未验证") continue;
    if (statuses.length && !statuses.includes(skill.status)) continue;
    if (risks.length && !risks.includes(skill.risk)) continue;
    if (!requirements.every((item) => REQUIREMENTS[item](skill))) continue;
    if (outputs.length && !outputs.some((item) => skill.outputs.includes(item))) continue;
    if (categoryCounts[skill.category] !== undefined) categoryCounts[skill.category] += 1;
    if (category === "全部" || skill.category === category) matched.push(skill);
  }

  const poolTotal = (Object.values(categoryCounts) as number[]).reduce((sum, count) => sum + count, 0);
  const ordered = sortSkills(matched, sort);

  return {
    items: ordered.slice(0, limit).map((skill) => presentSkill(locale, skill)),
    total: ordered.length,
    poolTotal,
    categoryCounts,
    catalogTotal: CATALOG_TOTAL,
    limit,
  };
}

const SUGGEST_LIMIT = 12;

function pickerHaystack(skill: Skill) {
  return `${skill.name} ${skill.owner} ${skill.repo} ${skill.owner}/${skill.repo}`.toLowerCase();
}

/** Compare picker. Name / owner / repo only, capped so the action stays small. */
export function suggestSkillMatches(locale: Locale, query: string, exclude: readonly string[]) {
  const skip = new Set(exclude);
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches: Skill[] = [];
  for (const skill of skills) {
    if (skip.has(skill.id)) continue;
    if (tokens.length) {
      const hay = pickerHaystack(skill);
      if (!tokens.every((token) => hay.includes(token))) continue;
    }
    matches.push(skill);
    if (matches.length >= SUGGEST_LIMIT) break;
  }
  return matches.map((skill) => presentSkill(locale, skill));
}

export function getSkillsByIds(locale: Locale, ids: readonly string[]) {
  const list: Skill[] = [];
  for (const id of ids) {
    const skill = getSkill(id);
    if (skill) list.push(presentSkill(locale, skill));
  }
  return list;
}

/** Detail pages keep SKILL.md. */
export function getDetailSkill(locale: Locale, id: string) {
  const skill = getSkill(id);
  return skill ? localizeSkill(locale, skill) : undefined;
}

export function getHomeCatalog(locale: Locale) {
  const sampleRaw = getSkill("frontend-design") ?? skills[0];
  if (!sampleRaw) {
    throw new Error("catalog is empty");
  }
  const sample = presentSkill(locale, sampleRaw);
  const verified = skills.filter((skill) => skill.status === "任务已实测").slice(0, 3);
  const featuredRaw =
    verified.length > 0 ? verified : skills.filter((skill) => skill.id !== sample.id).slice(0, 3);
  return {
    sample,
    featured: featuredRaw.map((skill) => presentSkill(locale, skill)),
    catalogCounts,
  };
}

export function topSkillsByInstalls(locale: Locale, limit: number) {
  return [...skills]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, limit)
    .map((skill) => presentSkill(locale, skill));
}

export function topSkillsForAgent(locale: Locale, agent: AgentName, limit: number) {
  return skills
    .filter((skill) => skill.compat[agent].status !== "未验证")
    .sort((a, b) => b.installs - a.installs)
    .slice(0, limit)
    .map((skill) => presentSkill(locale, skill));
}
