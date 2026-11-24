import type { Locale } from "@/i18n/locale";

import { skillEn, reviewEn, workflowEn } from "./en";
import { AGENTS, type Skill } from "./model";
import type { Review, Workflow } from "./prototype";

export function localizeSkill(locale: Locale, skill: Skill): Skill {
  if (locale !== "en") return skill;
  const en = skillEn[skill.id];
  if (!en) return skill;
  const compat = { ...skill.compat };
  AGENTS.forEach((agent) => {
    if (compat[agent].note) {
      compat[agent] = { ...compat[agent], note: en.notes?.[agent] ?? compat[agent].note };
    }
  });
  return {
    ...skill,
    description: en.description,
    tags: en.tags,
    riskSummary: en.riskSummary,
    permissions: skill.permissions.map((item, index) => ({
      ...item,
      reason: en.reasons[index] ?? item.reason,
    })),
    useCases: en.useCases,
    notFor: en.notFor,
    prerequisites: en.prerequisites,
    compat,
  };
}

export function localizeReview(locale: Locale, review: Review): Review {
  if (locale !== "en") return review;
  const en = reviewEn[review.id];
  if (!en) return review;
  const runs = Object.fromEntries(
    Object.entries(review.runs).map(([id, run]) => [id, { ...run, note: en.notes[id] ?? run.note }]),
  );
  return {
    ...review,
    title: en.title,
    task: en.task,
    acceptance: en.acceptance,
    summary: en.summary,
    dimensions: review.dimensions.map((item, index) => ({
      ...item,
      name: en.dimensions[index] ?? item.name,
    })),
    runs,
    evidence: en.evidence,
  };
}

export function localizeWorkflow(locale: Locale, workflow: Workflow): Workflow {
  if (locale !== "en") return workflow;
  const en = workflowEn[workflow.id];
  if (!en) return workflow;
  return {
    ...workflow,
    title: en.title,
    summary: en.summary,
    time: en.time,
    steps: workflow.steps.map((step, index) => {
      const [goal, input, output] = en.steps[index] ?? [step.goal, step.input, step.output];
      return { ...step, goal, input, output };
    }),
  };
}

/** List and compare payloads do not need SKILL.md. */
export function presentSkill(locale: Locale, skill: Skill): Skill {
  const localized = localizeSkill(locale, skill);
  return localized.skillMd ? { ...localized, skillMd: "" } : localized;
}
