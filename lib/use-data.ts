"use client";

import { useMemo } from "react";
import {
  AGENTS,
  BASELINE,
  agentProfiles,
  type Review,
  reviews as baseReviews,
  type Skill,
  skills as baseSkills,
  type Workflow,
  workflows as baseWorkflows,
  skillEn,
  reviewEn,
  workflowEn,
  agentCopyEn,
} from "@/lib/data";
import { enLabel, type Lang, useI18n } from "@/lib/i18n";

function localizeSkill(skill: Skill): Skill {
  const en = skillEn[skill.id];
  if (!en) return skill;
  const compat = { ...skill.compat };
  AGENTS.forEach((agent) => {
    if (compat[agent].note)
      compat[agent] = { ...compat[agent], note: en.notes?.[agent] ?? compat[agent].note };
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

function localizeReview(review: Review): Review {
  const en = reviewEn[review.id];
  if (!en) return review;
  const runs = Object.fromEntries(
    Object.entries(review.runs).map(([id, run]) => [
      id,
      { ...run, note: en.notes[id] ?? run.note },
    ]),
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

function localizeWorkflow(workflow: Workflow): Workflow {
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

function build(lang: Lang) {
  const zh = lang === "zh";
  const skills = zh ? baseSkills : baseSkills.map(localizeSkill);
  const reviews = zh ? baseReviews : baseReviews.map(localizeReview);
  const workflows = zh ? baseWorkflows : baseWorkflows.map(localizeWorkflow);
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  return {
    skills,
    reviews,
    workflows,
    agentCopy: (agent: (typeof AGENTS)[number]) =>
      zh ? agentProfiles[agent].copy : agentCopyEn[agent],
    getSkill: (id: string) => byId.get(id),
    reviewsForSkill: (id: string) => reviews.filter((review) => review.participants.includes(id)),
    participantName: (id: string) =>
      id === BASELINE ? (zh ? "无 Skill 基线" : "No-Skill baseline") : (byId.get(id)?.name ?? id),
  };
}

const cache: Partial<Record<Lang, ReturnType<typeof build>>> = {};

export function useData() {
  const { lang } = useI18n();
  return useMemo(() => (cache[lang] ??= build(lang)), [lang]);
}

/** Bilingual search text so queries in either language match. */
export const searchIndex: Record<string, string> = Object.fromEntries(
  baseSkills.map((skill) => {
    const en = skillEn[skill.id];
    return [
      skill.id,
      [
        skill.name,
        skill.owner,
        skill.repo,
        skill.description,
        skill.category,
        ...skill.tags,
        ...skill.keywords,
        en?.description ?? "",
        ...(en?.tags ?? []),
        enLabel(skill.category),
        ...skill.outputs.map(enLabel),
      ]
        .join(" ")
        .toLowerCase(),
    ];
  }),
);
