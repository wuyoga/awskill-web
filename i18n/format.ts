"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/locale";

/** Relative date helper + list join; uses `common` messages. */
export function useI18nFormat() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");

  return {
    lang: locale,
    ago: (days: number | null | undefined) => {
      if (days === null || days === undefined) return t("time.emDash");
      if (days === 0) return t("time.today");
      if (days === 1) return t("time.yesterday");
      if (days < 14) return t("time.daysAgo", { count: days });
      const weeks = Math.round(days / 7);
      return t("time.weeksAgo", { count: weeks });
    },
    list: (items: string[]) => items.join(t("listSeparator")),
  };
}

/** Enum label from data keys (Chinese stable keys → localized). */
export function useEnumLabel() {
  const t = useTranslations("enums");
  return (key: string) => (t.has(key) ? t(key) : key);
}
