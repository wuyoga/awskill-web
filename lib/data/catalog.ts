import "server-only";

import collectedBundle from "./skills.collected.json";
import { CATEGORIES, type Category, type Skill } from "./model";
import { prototypeSkills } from "./prototype";

/**
 * Merged catalog. Prototype skills win on id collisions.
 * Server-only: a client import must fail the build instead of shipping this JSON.
 */
export const skills: Skill[] = (() => {
  const map = new Map<string, Skill>();
  for (const skill of prototypeSkills) map.set(skill.id, skill);
  const collected = (collectedBundle as { skills?: Skill[] }).skills ?? [];
  for (const skill of collected) {
    if (!map.has(skill.id)) map.set(skill.id, skill);
  }
  return [...map.values()];
})();

const byId = new Map(skills.map((skill) => [skill.id, skill]));

export function getSkill(id: string) {
  return byId.get(id);
}

export const catalogCounts: Record<Category, number> = (() => {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<
    Category,
    number
  >;
  for (const skill of skills) {
    if (counts[skill.category] !== undefined) counts[skill.category] += 1;
  }
  return counts;
})();

export function catalogSize() {
  return skills.length;
}
