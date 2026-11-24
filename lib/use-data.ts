"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/locale";
import { localizeReview, localizeSkill, localizeWorkflow } from "@/lib/data/localize";
import {
  AGENTS,
  BASELINE,
  agentProfiles,
  prototypeSkills,
  reviews as baseReviews,
  workflows as baseWorkflows,
  agentCopyEn,
} from "@/lib/data";

function build(lang: Locale, baselineName: string) {
  const zh = lang === "zh";
  const skills = zh ? prototypeSkills : prototypeSkills.map((skill) => localizeSkill(lang, skill));
  const reviews = zh ? baseReviews : baseReviews.map((review) => localizeReview(lang, review));
  const workflows = zh
    ? baseWorkflows
    : baseWorkflows.map((workflow) => localizeWorkflow(lang, workflow));
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
      id === BASELINE ? baselineName : (byId.get(id)?.name ?? id),
  };
}

const cache: Partial<Record<Locale, ReturnType<typeof build>>> = {};

/** Prototype reviews, workflows, and the nine hand-authored skills. Not the collected catalog. */
export function useData() {
  const lang = useLocale() as Locale;
  const t = useTranslations("common");
  const baselineName = t("baselineName");
  return useMemo(() => (cache[lang] ??= build(lang, baselineName)), [lang, baselineName]);
}
