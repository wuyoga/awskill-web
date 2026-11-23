import type { Metadata } from "next";
import { type Locale, htmlLang, isLocale, DEFAULT_LOCALE } from "@/lib/locale";

export const SITE_NAME = "awskill";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://awskill.com";

const HOME_COPY = {
  zh: {
    title: "awskill · Agent Skill 评测与发现",
    description: "中文 AI Agent Skill 评测与发现平台。安装前确认兼容性、安全风险和真实任务表现。",
  },
  en: {
    title: "awskill · Agent Skill reviews & discovery",
    description:
      "Discover and evaluate AI Agent Skills. Check compatibility, security risk, and real-task performance before you install.",
  },
} as const;

const PAGE_COPY: Record<
  string,
  { zh: { title: string; description: string }; en: { title: string; description: string } }
> = {
  "/": HOME_COPY,
  "/skills": {
    zh: {
      title: "发现 Skill · awskill",
      description: "按任务、Agent、安全与验证状态筛选 AI Agent Skills，安装前先看兼容性与风险。",
    },
    en: {
      title: "Discover Skills · awskill",
      description:
        "Filter AI Agent Skills by task, Agent, security and verification before you install.",
    },
  },
  "/compare": {
    zh: {
      title: "Skill 对比 · awskill",
      description: "并排对比最多 3 个 Skill 的兼容性、安全权限与评测维度。",
    },
    en: {
      title: "Compare Skills · awskill",
      description: "Compare up to 3 Skills side by side on compatibility, security and review dimensions.",
    },
  },
  "/reviews": {
    zh: {
      title: "评测中心 · awskill",
      description: "按固定任务与环境查看分维度评测，不做模糊综合总分。",
    },
    en: {
      title: "Reviews · awskill",
      description: "Dimension-based Skill reviews on fixed tasks and environments — no blurry aggregate scores.",
    },
  },
  "/workflows": {
    zh: {
      title: "工作流 · awskill",
      description: "多 Skill 工作流的步骤、输入输出、组合风险与按 Agent 安装命令。",
    },
    en: {
      title: "Workflows · awskill",
      description: "Multi-Skill workflows with steps, I/O, combined risk and per-Agent install commands.",
    },
  },
  "/agents": {
    zh: {
      title: "Agent 兼容性 · awskill",
      description: "Claude Code、Codex、Cursor、Windsurf 的安装差异与 Skill 覆盖。",
    },
    en: {
      title: "Agent compatibility · awskill",
      description: "Install differences and Skill coverage for Claude Code, Codex, Cursor and Windsurf.",
    },
  },
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
  return pageMetadata(locale, "/", HOME_COPY[locale]);
}

export function hubMetadata(locale: Locale, barePath: string): Metadata {
  const entry = PAGE_COPY[barePath] ?? HOME_COPY;
  return pageMetadata(locale, barePath, entry[locale]);
}

export function detailMetadata(
  locale: Locale,
  barePath: string,
  copy: { title: string; description: string },
): Metadata {
  return pageMetadata(locale, barePath, copy);
}
