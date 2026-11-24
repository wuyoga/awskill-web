"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useAppActions } from "@/components/app-state";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/icon";
import { useThemeActions } from "@/components/providers";
import { Link, usePathname } from "@/i18n/navigation";
import { compareHref } from "@/lib/routes";

const NAV: { path: string; key: "skills" | "reviews" | "workflows" | "agents" }[] = [
  { path: "/skills", key: "skills" },
  { path: "/reviews", key: "reviews" },
  { path: "/workflows", key: "workflows" },
  { path: "/agents", key: "agents" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("nav");
  const { dark, soon } = useThemeActions();
  const nextLocale = locale === "zh" ? "en" : "zh";
  const qs = searchParams.toString();
  const switchHref = qs ? `${pathname}?${qs}` : pathname;
  const { compareIds, go } = useAppActions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  const section = pathname.startsWith("/skills")
    ? "skills"
    : pathname.startsWith("/compare")
      ? "skills"
      : pathname.startsWith("/reviews")
        ? "reviews"
        : pathname.startsWith("/workflows")
          ? "workflows"
          : pathname.startsWith("/agents")
            ? "agents"
            : "";

  return (
    <header className={`site-header ${mobileOpen ? "menu-open" : ""}`}>
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="awskill">
          <BrandMark />
        </Link>
        <nav
          className={mobileOpen ? "nav-links open" : "nav-links"}
          aria-label={t("mainNav")}
        >
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.path}
              className={section === item.key ? "active" : ""}
              aria-current={section === item.key ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="mobile-menu-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => soon(t("submitSkill"))}
            >
              {t("submitSkill")}
            </button>
            <button className="primary" type="button" onClick={() => soon(t("signIn"))}>
              {t("signIn")}
            </button>
          </div>
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button lang-toggle"
            href={switchHref}
            locale={nextLocale}
            hrefLang={nextLocale}
            aria-label={locale === "zh" ? t("switchToEn") : t("switchToZh")}
            title={locale === "zh" ? t("switchToEn") : t("switchToZh")}
          >
            {locale === "zh" ? "EN" : "中"}
          </Link>
          <button
            className="icon-button"
            type="button"
            data-theme-toggle=""
            aria-pressed={dark}
            aria-label={t("toggleTheme")}
          >
            <span className="theme-icon theme-icon-moon">
              <Icon name="moon" size={18} />
            </span>
            <span className="theme-icon theme-icon-sun">
              <Icon name="sun" size={18} />
            </span>
          </button>
          <button
            className="text-button compare-link"
            type="button"
            onClick={() => go(compareHref(compareIds))}
            aria-label={t("compareCount", { count: compareIds.length })}
          >
            <span className="compare-link-label">{t("compare")}</span>
            <Icon name="grid" size={17} />
            {compareIds.length > 0 && <span className="header-count">{compareIds.length}</span>}
          </button>
          <button
            className="text-button desktop-only"
            type="button"
            onClick={() => soon(t("submitSkill"))}
          >
            {t("submitSkill")}
          </button>
          <button
            className="primary small desktop-only"
            type="button"
            onClick={() => soon(t("signIn"))}
          >
            {t("signIn")}
          </button>
          <button
            className="mobile-menu"
            type="button"
            aria-label={t("menu")}
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
          aria-label={t("closeMenu")}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}
