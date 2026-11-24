"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AGENTS,
  type AgentName,
  BASELINE,
  installFor,
  isPrototypeSkill,
  isStale,
  lastVerifiedDays,
  mcpsForSkill,
  type Skill,
} from "@/lib/data";
import { searchHref } from "@/lib/routes";
import type { Locale } from "@/i18n/locale";
import { useEnumLabel, useI18nFormat } from "@/i18n/format";
import { useData } from "@/lib/use-data";
import { type AppActions, useCopy, VerdictBadge } from "@/components/shared";
import {
  AgentMark,
  compatTone,
  CopyBlock,
  Icon,
  Notice,
  RiskPill,
  StatusPill,
} from "@/components/ui";

export function DetailPage({
  skill,
  actions,
  favorite,
  onFavorite,
}: {
  skill: Skill;
  actions: AppActions;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const { go, compareIds, toggleCompare } = actions;
  const lang = useLocale() as Locale;
  const t = useTranslations("skillDetail");
  const l = useEnumLabel();
  const { ago } = useI18nFormat();
  const { reviewsForSkill } = useData();
  const selected = compareIds.includes(skill.id);
  const [agent, setAgent] = useState<AgentName>(
    AGENTS.find((item) => skill.compat[item].status === "完整支持") ?? "Claude Code",
  );
  const [copied, copy] = useCopy();
  const [active, setActive] = useState<string>("install");
  const install = installFor(skill, agent);
  const compat = skill.compat[agent];
  const skillReviews = reviewsForSkill(skill.id);
  const lastVerified = lastVerifiedDays(skill);
  const riskClass = skill.risk === "中风险" ? "medium" : skill.risk === "未评估" ? "muted" : "";
  const format =
    agent === "Cursor"
      ? t("format.cursorMdc")
      : agent === "Windsurf"
        ? t("format.windsurfRule")
        : t("format.nativeSkillMd");

  const prototype = isPrototypeSkill(skill.id);
  const relatedMcps = mcpsForSkill(skill.id);
  const sections: [string, string][] = [
    ["install", t("tabs.install")],
    ["usage", t("tabs.usage")],
    ["compat", t("tabs.compat")],
    ["security", t("tabs.security")],
    ["mcp", t("tabs.mcp")],
    ["evaluation", t("tabs.evaluation")],
    ["skillmd", t("tabs.skillmd")],
  ];

  useEffect(() => {
    const ids = ["install", "usage", "compat", "security", "mcp", "evaluation", "skillmd"];
    function onScroll() {
      let current = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top < 170) current = id;
      }
      setActive(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function jump(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 140,
      behavior: "smooth",
    });
  }

  const trust: [string, boolean][] = [
    [t("trustSignals.sourceListed"), true],
    [t("trustSignals.installVerified"), skill.status !== "待验证"],
    [t("trustSignals.securityAssessed"), skill.risk !== "未评估"],
    [t("trustSignals.taskTested"), skill.status === "任务已实测"],
    [t("trustSignals.authorVerified"), false],
  ];

  const verifiedNoteSuffix = compat.note
    ? t("installSection.verifiedNoteSuffix", { note: compat.note })
    : "";

  return (
    <main className="detail-page">
      <div className="container breadcrumb">
        <button onClick={() => go("/skills")}>Skills</button>
        <Icon name="chevron" size={13} />
        <button onClick={() => go(searchHref({ category: skill.category }))}>
          {l(skill.category)}
        </button>
        <Icon name="chevron" size={13} />
        <strong>{skill.name}</strong>
      </div>
      <section className="detail-hero">
        <div className="container detail-hero-grid">
          <div>
            <div className="detail-title-row">
              <span className={`skill-icon large ${skill.tone}`}>
                <Icon name={skill.icon} size={28} />
              </span>
              <div>
                <div className="detail-title">
                  <h1>{skill.name}</h1>
                  {prototype ? (
                    <span className="verified-badge">
                      <Icon name="check" size={13} /> {t("badges.prototypeDemo")}
                    </span>
                  ) : (
                    <span className="verified-badge muted">
                      <Icon name="clock" size={13} /> {t("badges.collectedDraft")}
                    </span>
                  )}
                </div>
                <p className="repo-line">
                  <Icon name="github" size={15} /> {skill.owner} / {skill.repo}
                </p>
              </div>
            </div>
            <p className="detail-summary">{skill.description}</p>
            <div className="detail-signals">
              <StatusPill status={skill.status} />
              <RiskPill risk={skill.risk} />
              <span className="meta-pill" title={t("meta.sourceRepoStarsTitle")}>
                <Icon name="star" size={14} /> {t("meta.repo")} {skill.stars}
              </span>
              <span className="meta-pill">
                <Icon name="clock" size={14} />
                {lastVerified === null
                  ? t("meta.notVerifiedYet")
                  : `${t("meta.verifiedLabel")} ${ago(lastVerified)}`}
              </span>
            </div>
            {!prototype && (
              <Notice>
                <strong>{t("notices.draftTitle")}</strong>
                {t("notices.draftBody")}
              </Notice>
            )}
            {isStale(skill) && skill.verifiedCommit !== "—" && (
              <Notice>
                <strong>{t("notices.staleTitle")}</strong>
                {t("notices.staleRepoUpdated")}
                <code>{skill.latestCommit}</code>
                {t("notices.staleBasedOn")}
                <code>{skill.verifiedCommit}</code>
                {t("notices.staleReverify")}
              </Notice>
            )}
          </div>
          <div className="hero-side-actions">
            <button
              className={`secondary ${selected ? "selected" : ""}`}
              onClick={() => toggleCompare(skill.id)}
              aria-pressed={selected}
            >
              <Icon name={selected ? "check" : "plus"} size={17} />
              {selected ? t("actions.inCompare") : t("actions.addToCompare")}
            </button>
            <button
              className={`icon-button ${favorite ? "on" : ""}`}
              aria-label={favorite ? t("actions.removeBookmark") : t("actions.bookmark")}
              aria-pressed={favorite}
              title={favorite ? t("actions.bookmarked") : t("actions.bookmark")}
              onClick={onFavorite}
            >
              <Icon name="bookmark" size={18} />
            </button>
          </div>
        </div>
      </section>

      <nav className="detail-tabs" aria-label={t("onThisPage")}>
        <div className="container">
          {sections.map(([id, label]) => (
            <button
              key={id}
              className={active === id ? "active" : ""}
              aria-current={active === id ? "location" : undefined}
              onClick={() => jump(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="container detail-layout">
        <div className="detail-content">
          <section className="content-section" id="install">
            <div className="content-heading">
              <span className="number">01</span>
              <div>
                <h2>{t("installSection.title")}</h2>
                <p>{t("installSection.intro")}</p>
              </div>
            </div>
            <div className="install-panel">
              <div
                className="agent-tabs"
                role="tablist"
                aria-label={t("installSection.chooseAgent")}
              >
                {AGENTS.map((item) => (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={agent === item}
                    className={agent === item ? "active" : ""}
                    onClick={() => setAgent(item)}
                  >
                    <AgentMark agent={item} size="sm" />
                    {item}
                    <i className={`tab-dot ${compatTone(skill.compat[item].status)}`} />
                  </button>
                ))}
              </div>
              <div className="compatibility-line">
                <span className={`compat-badge ${compatTone(compat.status)}`}>
                  <Icon
                    name={
                      compat.status === "完整支持"
                        ? "check"
                        : compat.status === "部分支持"
                          ? "warning"
                          : "clock"
                    }
                    size={14}
                  />
                  {l(compat.status)}
                </span>
                <span>
                  {compat.status === "未验证"
                    ? t("installSection.notVerifiedOnAgent", { agent })
                    : t("installSection.verifiedOnAgent", {
                        agent,
                        agentVersion: compat.agentVersion ?? "",
                        os: compat.os ?? "",
                        verifiedAgo: ago(compat.verifiedDaysAgo),
                        noteSuffix: verifiedNoteSuffix,
                      })}
                </span>
              </div>
              <CopyBlock
                text={install.command}
                copied={copied}
                onCopy={() => copy(install.command)}
              />
              <div className="install-meta four">
                <span>
                  <strong>{t("installSection.requires")}</strong> {skill.prerequisites}
                </span>
                <span>
                  <strong>API Key</strong>{" "}
                  {skill.needsApiKey
                    ? t("installSection.apiKeyRequired")
                    : t("installSection.apiKeyNotNeeded")}
                </span>
                <span>
                  <strong>{t("installSection.path")}</strong> <code>{install.dir}</code>
                </span>
                <span>
                  <strong>{t("installSection.formatLabel")}</strong> {format}
                </span>
              </div>
              <div className="uninstall-line">
                <strong>{t("installSection.uninstall")}</strong>
                <code>{install.uninstall}</code>
              </div>
            </div>
          </section>

          <section className="content-section" id="usage">
            <div className="content-heading">
              <span className="number">02</span>
              <div>
                <h2>{t("usageSection.title")}</h2>
                <p>{t("usageSection.intro")}</p>
              </div>
            </div>
            <div className="use-cases">
              {skill.useCases.map(([title, copyText], index) => (
                <div key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{copyText}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="not-for">
              <strong>{t("usageSection.notForLabel")}</strong>
              <span>{skill.notFor}</span>
            </div>
          </section>

          <section className="content-section" id="compat">
            <div className="content-heading">
              <span className="number">03</span>
              <div>
                <h2>{t("compatSection.title")}</h2>
                <p>{t("compatSection.intro")}</p>
              </div>
            </div>
            <div className="compat-table">
              <div className="table-head">
                <span>Agent</span>
                <span>{t("compatSection.status")}</span>
                <span>{t("compatSection.environment")}</span>
                <span>{t("compatSection.lastVerified")}</span>
              </div>
              {AGENTS.map((item) => {
                const row = skill.compat[item];
                return (
                  <div className="table-group" key={item}>
                    <div className="table-row">
                      <strong>{item}</strong>
                      <span className={`table-status ${compatTone(row.status)}`}>
                        {row.status === "完整支持" && <Icon name="check" size={13} />}{" "}
                        {l(row.status)}
                      </span>
                      <span>{row.os ? `${row.os} · ${row.agentVersion}` : "—"}</span>
                      <span>{ago(row.verifiedDaysAgo)}</span>
                    </div>
                    {row.note && <p className="table-note">{row.note}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="content-section" id="security">
            <div className="content-heading">
              <span className="number">04</span>
              <div>
                <h2>{t("securitySection.title")}</h2>
                <p>{t("securitySection.intro")}</p>
              </div>
            </div>
            <div className={`security-panel ${riskClass}`}>
              <div className="security-score">
                <span className="shield-icon large">
                  <Icon name={skill.risk === "低风险" ? "shield" : "warning"} size={26} />
                </span>
                <div>
                  <small>{t("securitySection.overallRisk")}</small>
                  <strong>{l(skill.risk)}</strong>
                  <p>{skill.riskSummary}</p>
                </div>
              </div>
              <div className="permissions-grid">
                {skill.permissions.map((item) => {
                  const used = item.level === "需要" || item.level === "有限";
                  return (
                    <div key={item.label}>
                      <span
                        className={
                          item.level === "需要"
                            ? "permission-needed strong"
                            : used
                              ? "permission-needed"
                              : "permission-none"
                        }
                      >
                        <Icon
                          name={used ? "check" : item.level === "待评估" ? "clock" : "x"}
                          size={13}
                        />
                      </span>
                      <span>
                        {l(item.label)}
                        <small>{item.reason}</small>
                      </span>
                      <strong>{l(item.level)}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="audit-note">
                <Icon name="shield" size={16} />
                <span>
                  {skill.risk === "未评估"
                    ? t("securitySection.assessmentPending")
                    : t("securitySection.scanAndReview")}
                </span>
                <span>
                  {skill.risk === "未评估"
                    ? "—"
                    : `${t("securitySection.basedOnCommit")} Commit ${skill.verifiedCommit}`}
                </span>
              </div>
            </div>
          </section>

          <section className="content-section" id="mcp">
            <div className="content-heading">
              <span className="number">05</span>
              <div>
                <h2>{t("mcpSection.title")}</h2>
                <p>{t("mcpSection.intro")}</p>
              </div>
            </div>
            {relatedMcps.length ? (
              <div className="mcp-list">
                {relatedMcps.map((mcp) => (
                  <article className="mcp-card" key={mcp.slug}>
                    <div className="mcp-card-top">
                      <div>
                        <h3>{mcp.name}</h3>
                        <a href={mcp.url} target="_blank" rel="noreferrer">
                          {t("mcpSection.siteRepo")} <Icon name="external" size={13} />
                        </a>
                      </div>
                      <span className={`mcp-relation ${mcp.relation}`}>
                        {mcp.relation === "required"
                          ? t("mcpSection.required")
                          : t("mcpSection.optional")}
                      </span>
                    </div>
                    <p>{lang === "zh" ? mcp.purposeZh : mcp.purposeEn}</p>
                    <p className="mcp-setup">
                      <strong>{t("mcpSection.setupLabel")}</strong>{" "}
                      {lang === "zh" ? mcp.setupZh : mcp.setupEn}
                    </p>
                    {mcp.envVars?.length ? (
                      <p className="mcp-env">
                        <strong>{t("mcpSection.envLabel")}</strong>{" "}
                        {mcp.envVars.map((name) => (
                          <code key={name}>{name}</code>
                        ))}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="evaluation-card empty">
                <h3>{t("mcpSection.emptyTitle")}</h3>
                <p className="evaluation-copy">{t("mcpSection.emptyBody")}</p>
              </div>
            )}
          </section>

          <section className="content-section evaluation-section" id="evaluation">
            <div className="content-heading">
              <span className="number">06</span>
              <div>
                <h2>{t("evaluationSection.title")}</h2>
                <p>
                  {prototype
                    ? t("evaluationSection.prototypeIntro")
                    : t("evaluationSection.draftIntro")}
                </p>
              </div>
            </div>
            {skillReviews.length ? (
              skillReviews.map((review) => {
                const run = review.runs[skill.id];
                return (
                  <div className="evaluation-card" key={review.id}>
                    <div className="evaluation-top">
                      <div>
                        <span className="demo-tag">
                          {review.participants.includes(BASELINE)
                            ? t("evaluationSection.vsBaseline")
                            : t("evaluationSection.headToHead")}
                        </span>
                        <h3>{review.task}</h3>
                      </div>
                      {run.verdict && <VerdictBadge verdict={run.verdict} />}
                    </div>
                    <div className="metrics">
                      <div>
                        <small>{t("evaluationSection.completed")}</small>
                        <strong>{l(run.completed)}</strong>
                      </div>
                      <div>
                        <small>{t("evaluationSection.interventions")}</small>
                        <strong>
                          {run.interventions} {t("evaluationSection.interventionsUnit")}
                        </strong>
                      </div>
                      <div>
                        <small>{t("evaluationSection.duration")}</small>
                        <strong>{run.duration}</strong>
                      </div>
                      <div>
                        <small>{t("evaluationSection.environment")}</small>
                        <strong>
                          {review.agent} {review.agentVersion}
                        </strong>
                      </div>
                    </div>
                    <p className="evaluation-copy">{run.note}</p>
                    <button className="link-button" onClick={() => go(`/reviews/${review.id}`)}>
                      {t("evaluationSection.viewFullReview")} <Icon name="arrow" size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="evaluation-card empty">
                <h3>{t("evaluationSection.emptyTitle")}</h3>
                <p className="evaluation-copy">
                  {t("evaluationSection.emptyBody", { status: l(skill.status) })}
                </p>
                <button className="link-button" onClick={() => go("/reviews")}>
                  {t("evaluationSection.browseReviews")} <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </section>

          <section className="content-section" id="skillmd">
            <div className="content-heading">
              <span className="number">07</span>
              <div>
                <h2>SKILL.md</h2>
                <p>
                  {t("skillMdSection.excerptLabel")}{" "}
                  <span className="mono">{skill.latestCommit}</span>
                </p>
              </div>
            </div>
            <pre className="skill-md">{skill.skillMd}</pre>
          </section>
        </div>
        <aside className="detail-aside">
          <div className="aside-card">
            <h3>{t("aside.sourceTitle")}</h3>
            <dl>
              {(
                [
                  [t("aside.author"), skill.owner],
                  [t("aside.repository"), `${skill.owner}/${skill.repo}`],
                  [t("aside.license"), skill.license],
                  [t("aside.listed"), skill.addedAt],
                  [t("aside.sourceUpdated"), ago(skill.sourceUpdatedDaysAgo)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div>
                <dt>{t("aside.verifiedCommit")}</dt>
                <dd className="mono">{skill.verifiedCommit}</dd>
              </div>
              <div>
                <dt>{t("aside.latestCommit")}</dt>
                <dd className={`mono ${isStale(skill) ? "stale" : ""}`}>{skill.latestCommit}</dd>
              </div>
            </dl>
            <a
              className="github-link"
              href={`https://github.com/${skill.owner}/${skill.repo}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" size={17} /> {t("aside.viewOnGitHub")}{" "}
              <Icon name="external" size={14} />
            </a>
          </div>
          <div className="aside-card">
            <h3>{t("aside.trustTitle")}</h3>
            {trust.map(([label, done]) => (
              <div className="trust-line" key={label}>
                <span className={done ? "done" : ""}>
                  <Icon name={done ? "check" : "clock"} size={13} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}