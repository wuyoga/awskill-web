/**
 * Client-safe catalog API: types, hand-authored prototypes, and English overlays.
 * The collected catalog stays in `catalog.ts` / `query.ts` (server-only).
 */
export {
  AGENTS,
  AGENT_META,
  CATEGORIES,
  OUTPUT_FORMATS,
  agentProfiles,
  categoryMeta,
  highestRisk,
  installFor,
  isPrototypeSkill,
  isStale,
  lastVerifiedDays,
  needsNetwork,
  needsShell,
  permissionLevel,
  relativeDays,
  supportedAgents,
} from "./model";

export type {
  AgentName,
  Category,
  Compat,
  CompatStatus,
  IconName,
  OutputFormat,
  Permission,
  PermissionLevel,
  RiskLevel,
  Skill,
  VerifyStatus,
} from "./model";

export {
  BASELINE,
  mcpsForSkill,
  prototypeSkills,
  reviews,
  reviewsForSkill,
  workflowAgents,
  workflows,
} from "./prototype";

export type { Level, McpRelation, Review, SkillMcpLink, Verdict, Workflow } from "./prototype";

export { agentCopyEn, reviewEn, skillEn, workflowEn } from "./en";
