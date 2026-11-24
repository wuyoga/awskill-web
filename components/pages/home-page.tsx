"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AGENTS,
  CATEGORIES,
  catalogCounts,
  categoryMeta,
  lastVerifiedDays,
  permissionLevel,
} from "@/lib/data";
import { searchHref, skillHref } from "@/lib/routes";
import { getPathname, Link } from "@/i18n/navigation";
import { useEnumLabel, useI18nFormat } from "@/i18n/format";
import { useData } from "@/lib/use-data";
import { useAppActions } from "@/components/app-state";
import { AgentMark, Icon, SkillCard } from "@/components/ui";

const QUICK_SEARCH_KEYS = [
  "frontendDesign",
  "codeReview",
  "browserAutomation",
  "slides",
] as const;

export function HomePage() {
  const { go, compareIds, toggleCompare } = useAppActions();
  const locale = useLocale();
  const shortcut = useSyncExternalStore(() => () => {}, () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"), () => "Ctrl K");
  const t = useTranslations("home");
  const l = useEnumLabel();
  const { ago } = useI18nFormat();
  const { skills, getSkill } = useData();
  const [query, setQuery] = useState("");
  const sample = getSkill("frontend-design") ?? skills[0]!;
  const featuredVerified = skills.filter((skill) => skill.status === "任务已实测").slice(0, 3);
  const featured =
    featuredVerified.length > 0 ? featuredVerified : skills.filter((s) => s.id !== sample.id).slice(0, 3);
  const skillsAction = getPathname({ locale, href: "/skills" });

  return (
      <main>
        <section className="hero">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-orb one" />
          <div className="hero-orb two" />
          <div className="container hero-content">
            <div className="eyebrow">
              <span className="live-dot" />
              {t("eyebrow")}
            </div>
            <h1>
              {t("hero.titlePrefix")} <span>Agent Skills</span>
              {t("hero.titleSuffix")}
            </h1>
            <p className="hero-copy">{t("hero.copy")}</p>
            <form className="hero-search" action={skillsAction} method="get">
              <Icon name="search" size={21} />
              <input
                id="global-search"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("search.ariaLabel")}
              />
              <kbd className="shortcut">{shortcut}</kbd>
              <button type="submit">{t("search.submit")}</button>
            </form>
            <div className="quick-searches">
              <span>{t("popularLabel")}</span>
              {QUICK_SEARCH_KEYS.map((key) => (
                <Link key={key} href={searchHref({ q: t(`quickSearches.${key}`) })}>
                  {t(`quickSearches.${key}`)}
                </Link>
              ))}
            </div>
            <div className="agent-strip">
              <span>{t("supports")}</span>
              {AGENTS.map((agent) => (
                <Link key={agent} href={searchHref({ agent })}>
                  <AgentMark agent={agent} />
                  {agent}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">VERIFIED SKILLS</span>
              <h2>{t("verified.title")}</h2>
              <p>{t("verified.copy")}</p>
            </div>
            <Link className="link-button" href="/skills">
              {t("verified.viewAll")} <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="skill-grid">
            {featured.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                selected={compareIds.includes(skill.id)}
                onOpen={() => go(skillHref(skill.id))}
                onCompare={() => toggleCompare(skill.id)}
              />
            ))}
          </div>
          <p className="demo-note">{t("demoNote")}</p>
        </section>

        <section className="section soft-section">
          <div className="container">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">EXPLORE BY TASK</span>
                <h2>{t("explore.title")}</h2>
              </div>
            </div>
            <div className="category-grid">
              {CATEGORIES.map((category) => (
                <Link
                  key={category}
                  className="category-card"
                  href={searchHref({ category })}
                >
                  <span className={`category-icon ${categoryMeta[category].tone}`}>
                    <Icon name={categoryMeta[category].icon} size={22} />
                  </span>
                  <span>
                    <strong>{l(category)}</strong>
                    <small>
                      {t("skillsCount", { count: catalogCounts[category] })}
                    </small>
                  </span>
                  <Icon name="chevron" size={17} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="trust-panel">
            <div className="trust-copy">
              <span className="section-kicker">BEFORE YOU INSTALL</span>
              <h2>{t("trust.title")}</h2>
              <p>{t("trust.copy")}</p>
              <Link className="secondary" href="/reviews?section=method">
                {t("trust.howWeReview")} <Icon name="arrow" size={17} />
              </Link>
            </div>
            <Link className="trust-card" href={skillHref(sample.id)}>
              <div className="trust-card-top">
                <span className="shield-icon">
                  <Icon name="shield" size={23} />
                </span>
                <div>
                  <span>{t("trust.sampleSecuritySummary")}</span>
                  <strong>{sample.name}</strong>
                </div>
                <span className="safe-label">{l(sample.risk)}</span>
              </div>
              <div className="permission-list">
                {sample.permissions.slice(0, 2).map((item) => (
                  <div key={item.label}>
                    <Icon name="check" size={16} />
                    <span>{l(item.label)}</span>
                    <small>{item.reason}</small>
                  </div>
                ))}
                <div className="not-used">
                  <Icon name="x" size={16} />
                  <span>{l("访问系统凭据")}</span>
                  <small>{l(permissionLevel(sample, "访问系统凭据"))}</small>
                </div>
              </div>
              <div className="trust-footer">
                <span>
                  {t("trust.automatedScanManualReview")} · Commit {sample.verifiedCommit}
                </span>
                <span>
                  {t("trust.verifiedLabel")} {ago(lastVerifiedDays(sample))}
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>
  );
}