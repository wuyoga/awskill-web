import type { Metadata } from "next";

import { type Locale, htmlLang, isLocale, DEFAULT_LOCALE } from "@/i18n/locale";
import enMeta from "@/i18n/messages/en/meta.json";
import zhMeta from "@/i18n/messages/zh/meta.json";
import { getSkill, reviewEn, reviews, skillEn, workflowEn, workflows } from "@/lib/data";

export const SITE_NAME = "awskill";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://awskill.com";

const META = { zh: zhMeta, en: enMeta } as const;

const HUB_PATH_TO_KEY: Record<string, keyof typeof zhMeta> = {
  "/": "home",
  "/skills": "skills",
  "/compare": "compare",
  "/reviews": "reviews",
  "/workflows": "workflows",
  "/agents": "agents",
};

export function resolveLocale(raw: string): Locale {
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function localeAlternates(locale: Locale, barePath: string): Metadata["alternates"] {
  const path = barePath === "/" ? "" : barePath;
  return {
    canonical: `/${locale}${path}`,
    languages: {
      "zh-CN": `/zh${path}`,
      en: `/en${path}`,
      "x-default": `/zh${path}`,
    },
  };
}

export function pageMetadata(
  locale: Locale,
  barePath: string,
  copy: { title: string; description: string },
): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: copy.title,
    description: copy.description,
    alternates: localeAlternates(locale, barePath),
    openGraph: {
      title: copy.title,
      description: copy.description,
      locale: htmlLang(locale),
      siteName: SITE_NAME,
      type: "website",
      url: `/${locale}${barePath === "/" ? "" : barePath}`,
    },
  };
}

export function homeMetadata(locale: Locale): Metadata {
  const copy = META[locale].home;
  return pageMetadata(locale, "/", copy);
}

export function hubMetadata(locale: Locale, barePath: string): Metadata {
  const key = HUB_PATH_TO_KEY[barePath] ?? "home";
  const entry = META[locale][key] as { title: string; description: string };
  return pageMetadata(locale, barePath, entry);
}

export function detailMetadata(
  locale: Locale,
  barePath: string,
  copy: { title: string; description: string },
): Metadata {
  return pageMetadata(locale, barePath, copy);
}

export function metaMessages(locale: Locale) {
  return META[locale];
}

export function skillDetailCopy(locale: Locale, slug: string) {
  const skill = getSkill(slug);
  if (!skill) return null;
  const en = locale === "en" ? skillEn[skill.id] : undefined;
  return {
    name: skill.name,
    description: en?.description ?? skill.description,
  };
}

export function reviewDetailCopy(locale: Locale, slug: string) {
  const review = reviews.find((item) => item.id === slug);
  if (!review) return null;
  const en = locale === "en" ? reviewEn[review.id] : undefined;
  return {
    name: en?.title ?? review.title,
    description: en?.summary ?? review.summary,
  };
}

export function workflowDetailCopy(locale: Locale, slug: string) {
  const workflow = workflows.find((item) => item.id === slug);
  if (!workflow) return null;
  const en = locale === "en" ? workflowEn[workflow.id] : undefined;
  return {
    name: en?.title ?? workflow.title,
    description: en?.summary ?? workflow.summary,
  };
}
