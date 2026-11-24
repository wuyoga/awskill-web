"use client";

import { useLocale } from "next-intl";

import { useEnumLabel, useI18nFormat } from "@/i18n/format";
import type { Locale } from "@/i18n/locale";
import enEnums from "@/i18n/messages/en/enums.json";

/** UI language; same as URL locale segment. */
export type Lang = Locale;

/** English label lookup outside React (e.g. bilingual search index). */
export const enLabel = (key: string) =>
  (enEnums as Record<string, string>)[key] ?? key;

/** Shared helpers: locale + enum labels + relative time / list join. */
export function useI18n() {
  const locale = useLocale() as Locale;
  const { ago, list } = useI18nFormat();
  const l = useEnumLabel();

  return {
    lang: locale,
    ago,
    list,
    l,
  };
}

export type I18n = ReturnType<typeof useI18n>;

export { useEnumLabel, useI18nFormat };
export { useTranslations, useLocale } from "next-intl";
