"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppActions } from "@/components/app-state";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/icon";
import { useThemeActions } from "@/components/providers";
import { compareHref, homeHref } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { stripLocale } from "@/lib/locale";

const NAV: { path: string; key: string; zh: string; en: string }[] = [
  { path: "/skills", key: "skills", zh: "发现 Skill", en: "Discover" },
  { path: "/reviews", key: "reviews", zh: "评测", en: "Reviews" },
  { path: "/workflows", key: "workflows", zh: "工作流", en: "Workflows" },
  { path: "/agents", key: "agents", zh: "Agent", en: "Agent" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const barePath = stripLocale(pathname);
  const { t, lang, setLang } = useI18n();
  const { dark, toggleTheme, soon } = useThemeActions();
  const { compareIds, go } = useAppActions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  const section = barePath.startsWith("/skills")
    ? "skills"
    : barePath.startsWith("/compare")
      ? "skills"
      : barePath.startsWith("/reviews")
        ? "reviews"
        : barePath.startsWith("/workflows")
          ? "workflows"
          : barePath.startsWith("/agents")
            ? "agents"
            : "";

  return (
    <header className={`site-header ${mobileOpen ? "menu-open" : ""}`}>
      <div className="header-inner">
        <Link className="brand" href={homeHref(lang)}>
          <BrandMark />
          <span>awskill</span>
        </Link>
        <nav
          className={mobileOpen ? "nav-links open" : "nav-links"}
          aria-label={t("主导航", "Main")}
        >
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={`/${lang}${item.path}`}
              className={section === item.key ? "active" : ""}
              aria-current={section === item.key ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {t(item.zh, item.en)}
            </Link>
          ))}
          <div className="mobile-menu-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => soon("提交 Skill", "Submit a Skill")}
            >
              {t("提交 Skill", "Submit a Skill")}
            </button>
            <button className="primary" type="button" onClick={() => soon("登录", "Sign in")}>
              {t("登录", "Sign in")}
            </button>
          </div>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button lang-toggle"
            type="button"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            aria-label={t("Switch to English", "切换到中文")}
            title={t("Switch to English", "切换到中文")}
          >
            {lang === "zh" ? "EN" : "中"}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label={t("切换主题", "Toggle theme")}
          >
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <button
            className="text-button compare-link"
            type="button"
            onClick={() => go(compareHref(compareIds))}
            aria-label={t(`对比（${compareIds.length}）`, `Compare (${compareIds.length})`)}
          >
            <span className="compare-link-label">{t("对比", "Compare")}</span>
            <Icon name="grid" size={17} />
            {compareIds.length > 0 && <span className="header-count">{compareIds.length}</span>}
          </button>
          <button
            className="text-button desktop-only"
            type="button"
            onClick={() => soon("提交 Skill", "Submit a Skill")}
          >
            {t("提交 Skill", "Submit a Skill")}
          </button>
          <button
            className="primary small desktop-only"
            type="button"
            onClick={() => soon("登录", "Sign in")}
          >
            {t("登录", "Sign in")}
          </button>
          <button
            className="mobile-menu"
            type="button"
            aria-label={t("菜单", "Menu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Icon name={mobileOpen ? "x" : "menu"} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <button
          className="menu-scrim"
          type="button"
          aria-label={t("关闭菜单", "Close menu")}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}
