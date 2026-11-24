import type { Category, Skill } from "./model";

/** Slice returned to the discover page. Skill markdown is omitted. */
export type SkillQueryResult = {
  items: Skill[];
  total: number;
  poolTotal: number;
  categoryCounts: Record<Category, number>;
  catalogTotal: number;
  limit: number;
};
