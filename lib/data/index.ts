/**
 * Static catalog API for the Next app (mock / prototype data).
 * CMS access will land later via `lib/strapi` — pages must not fetch Strapi directly.
 */
export {
  AGENTS,
  AGENT_META,
  BASELINE,
  CATEGORIES,
  OUTPUT_FORMATS,
  agentProfiles,
  catalogCounts,
  categoryMeta,
  getSkill,
  highestRisk,
  installFor,
  isPrototypeSkill,
  isStale,
  lastVerifiedDays,
  mcpsForSkill,
  needsNetwork,
  needsShell,
  permissionLevel,
  prototypeSkills,
  relativeDays,
  reviews,
  reviewsForSkill,
  skills,
  supportedAgents,
  workflowAgents,
  workflows,
} from "./catalog";

export type {
  AgentName,
  Category,
  Compat,
  CompatStatus,
  IconName,
  Level,
  McpRelation,
  OutputFormat,
  Permission,
  PermissionLevel,
  Review,
  RiskLevel,
  Skill,
  SkillMcpLink,
  Verdict,
  VerifyStatus,
  Workflow,
} from "./catalog";

export { agentCopyEn, reviewEn, skillEn, workflowEn } from "./en";
