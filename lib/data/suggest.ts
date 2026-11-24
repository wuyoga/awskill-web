"use server";

import { getLocale } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale } from "@/i18n/locale";

import type { Skill } from "./model";
import { suggestSkillMatches } from "./query";

export async function suggestSkills(query: string, exclude: string[] = []): Promise<Skill[]> {
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return suggestSkillMatches(locale, query, exclude);
}
