"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { Locale } from "@/lib/locale";

/** UI language; same as URL locale segment. */
export type Lang = Locale;

/**
 * Enumerations are stored as Chinese keys in data (status, risk, category…).
 * This table maps each key to its English display label.
 */
const EN_LABELS: Record<string, string> = {
  // Categories
  开发与工程: "Engineering",
  设计与用户体验: "Design & UX",
  测试与安全: "Testing & Security",
  数据与研究: "Data & Research",
  内容与文档: "Content & Docs",
  视觉与多媒体: "Visual & Media",
  营销与增长: "Marketing & Growth",
  产品与业务: "Product & Business",
  生产力与自动化: "Productivity & Automation",
  "Agent 与工具链": "Agents & Tooling",
  // Verification status
  任务已实测: "Task-tested",
  安装已验证: "Install-verified",
  待验证: "Pending",
  // Risk
  低风险: "Low risk",
  中风险: "Medium risk",
  未评估: "Not assessed",
  // Compatibility
  完整支持: "Full support",
  部分支持: "Partial",
  未验证: "Unverified",
  // Permission levels
  需要: "Required",
  有限: "Limited",
  未发现: "Not found",
  待评估: "Pending",
  // Permission labels
  读取项目文件: "Read project files",
  修改项目文件: "Modify project files",
  "执行 Shell": "Run shell commands",
  访问网络: "Network access",
  访问系统凭据: "System credentials",
  删除文件: "Delete files",
  // Output formats
  代码: "Code",
  网页: "Web pages",
  文档: "Docs",
  数据: "Data",
  图片: "Images",
  演示文稿: "Slides",
  视频: "Video",
  // Review levels and verdicts
  优秀: "Excellent",
  良好: "Good",
  一般: "Fair",
  不足: "Poor",
  推荐: "Recommended",
  有条件推荐: "Conditional",
  不推荐: "Not recommended",
  是: "Yes",
  部分: "Partial",
  否: "No",
  // Workflow level
  入门: "Beginner",
  进阶: "Advanced",
  // Search requirements and sorting
  "无需 API Key": "No API key",
  免费使用: "Free to use",
  "无需执行 Shell": "No shell access",
  无需访问网络: "No network access",
  综合推荐: "Recommended",
  最近验证: "Recently verified",
  最多使用: "Most used",
  最新收录: "Newest",
};

/** English label lookup outside React (e.g. bilingual search index). */
export const enLabel = (key: string) => EN_LABELS[key] ?? key;

type I18nValue = { lang: Lang; setLang: (lang: Lang) => void };
const I18nContext = createContext<I18nValue>({ lang: "zh", setLang: () => {} });

export function I18nProvider({ value, children }: { value: I18nValue; children: ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const { lang, setLang } = useContext(I18nContext);
  return useMemo(() => {
    const zh = lang === "zh";
    return {
      lang,
      setLang,
      /** Inline translation: t("中文", "English"). */
      t: (chinese: string, english: string) => (zh ? chinese : english),
      /** Display label for a data enumeration key. */
      l: (key: string) => (zh ? key : (EN_LABELS[key] ?? key)),
      /** Relative date from "days ago". */
      ago: (days: number | null | undefined) => {
        if (days === null || days === undefined) return "—";
        if (days === 0) return zh ? "今天" : "today";
        if (days === 1) return zh ? "昨天" : "yesterday";
        if (days < 14) return zh ? `${days} 天前` : `${days} days ago`;
        const weeks = Math.round(days / 7);
        return zh ? `${weeks} 周前` : `${weeks} weeks ago`;
      },
      /** Join list items with the locale's separator. */
      list: (items: string[]) => items.join(zh ? "、" : ", "),
    };
  }, [lang, setLang]);
}

export type I18n = ReturnType<typeof useI18n>;
