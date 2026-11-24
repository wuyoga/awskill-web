"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AGENT_META,
  AGENTS,
  type AgentName,
  agentProfiles,
  BASELINE,
  highestRisk,
  installFor,
  type Review,
  type Skill,
  type Workflow,
  workflowAgents,
} from "@/lib/data";
import type { Locale } from "@/i18n/locale";
import { useEnumLabel, useI18nFormat } from "@/i18n/format";
import { useAppActions } from "@/components/app-state";
import { type AppActions, type Route, useCopy, VerdictBadge } from "@/components/shared";
import { agentHref, agentSlug, searchHref, skillHref } from "@/lib/routes";
import {
  AgentMark,
  compatTone,
  CopyBlock,
  Icon,
  LevelMeter,
  MenuSelect,
  Notice,
  RiskPill,
  StatusPill,
} from "@/components/ui";
import { useData } from "@/lib/use-data";

/* ---------- Reviews hub ---------- */

export function ReviewsPage({ route, actions }: { route: Route; actions: AppActions }) {
  const { go } = actions;
  const t = useTranslations("reviews");
  const l = useEnumLabel();
  const { ago } = useI18nFormat();
  const { reviews, getSkill, participantName } = useData();
  const featured = reviews[0];
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => Array.from(new Set(reviews.map((review) => review.category))),
    [reviews],
  );
  const list = reviews.filter((review) => category === "all" || review.category === category);

  useEffect(() => {
    const section = route.params.get("section");
    if (section) {
      window.setTimeout(
        () => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    }
  }, [route]);

  const method: [string, string, string][] = [
  ["01", t("method.steps.fixedTasks.title"), t("method.steps.fixedTasks.copy")],
  ["02", t("method.steps.isolatedRuns.title"), t("method.steps.isolatedRuns.copy")],
  ["03", t("method.steps.keptEvidence.title"), t("method.steps.keptEvidence.copy")],
  ["04", t("method.steps.independent.title"), t("method.steps.independent.copy")],
  ];

  return (
    <>
      <main className="hub-page container">
        <div className="hub-hero">
          <div>
            <span className="section-kicker">INDEPENDENT REVIEWS</span>
            <h1>{t("hero.title")}</h1>
            <p>{t("hero.copy")}</p>
          </div>
          <div className="hub-stat-row">
            <div>
              <strong>24</strong>
              <span>{t("stats.taskReviews")}</span>
            </div>
            <div>
              <strong>68</strong>
              <span>{t("stats.installChecks")}</span>
            </div>
            <div>
              <strong>4</strong>
              <span>{t("stats.agentSetups")}</span>
            </div>
          </div>
        </div>

        <section className="featured-review">
          <div className="featured-review-copy">
            <div className="review-meta">
              <span className="demo-tag">{t("featured.tag")}</span>
              <span>{l(featured.category)}</span>
            </div>
            <h2>{featured.title}</h2>
            <p>
              {t("featured.blurb", {
                participant: participantName(featured.participants[0]),
              })}
            </p>
            <div className="review-facts">
              <span>
                <Icon name="clock" size={15} />{" "}
                {t("featured.readMinutes", { minutes: featured.readMinutes })}
              </span>
              <span>
                <Icon name="terminal" size={15} /> {featured.agent} {featured.agentVersion}
              </span>
              <span>
                <Icon name="check" size={15} /> {t("featured.sameEnvironment")}
              </span>
            </div>
            <button className="primary" onClick={() => go(`/reviews/${featured.id}`)}>
              {t("featured.seeResults")} <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="review-scoreboard">
            <div className="scoreboard-label">{t("featured.perDimension")}</div>
            {featured.dimensions.map((dimension) => (
              <div className="score-line" key={dimension.name}>
                <span className="score-name">{dimension.name}</span>
                {featured.participants.map((id) => (
                  <div className="score-participant" key={id}>
                    <span>{participantName(id)}</span>
                    <LevelMeter level={dimension.results[id]} />
                  </div>
                ))}
              </div>
            ))}
            <div className="score-facts">
              {featured.participants.map((id) => (
                <span key={id}>
                  {participantName(id)}
                  {t("featured.interventionsLine", {
                    count: featured.runs[id].interventions,
                  })}
                </span>
              ))}
            </div>
            <p>{t("featured.prototypeNote")}</p>
          </div>
        </section>

        <section className="hub-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">LATEST TESTS</span>
              <h2>{t("latest.title")}</h2>
            </div>
            <MenuSelect
              className="filter-chip select-chip"
              value={category}
              options={["all", ...categories]}
              onChange={setCategory}
              ariaLabel={t("latest.filterAria")}
              getLabel={(item) => (item === "all" ? t("latest.allCategories") : l(item))}
            />
          </div>
          <div className="review-list">
            {list.map((review, index) => {
              const skill = getSkill(review.participants.find((id) => id !== BASELINE)!)!;
              const skillsInReview = review.participants.filter((id) => id !== BASELINE);
              const verdict = review.runs[skill.id].verdict;
              return (
                <article className="review-row" key={review.id}>
                  <span className="review-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`skill-icon ${skill.tone}`}>
                    <Icon name={skill.icon} size={21} />
                  </span>
                  <div className="review-row-main">
                    <div>
                      <span>{l(review.category)}</span>
                      <h3>{review.task}</h3>
                    </div>
                    <p>{review.summary}</p>
                    <small>
                      {review.participants.map(participantName).join(" vs ")} · {review.agent} ·{" "}
                      {ago(review.daysAgo)}
                    </small>
                  </div>
                  <div className="review-verdict">
                    {skillsInReview.length > 1 ? (
                      <span className="neutral">
                        <Icon name="grid" size={14} /> {t("latest.headToHead")}
                      </span>
                    ) : (
                      verdict && (
                        <span className={verdict === "推荐" ? "good" : "conditional"}>
                          <Icon name={verdict === "推荐" ? "check" : "warning"} size={14} />
                          {l(verdict)}
                        </span>
                      )
                    )}
                    <button onClick={() => go(`/reviews/${review.id}`)}>
                      {t("latest.readReport")} <Icon name="arrow" size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="method-panel" id="method">
          <div>
            <span className="section-kicker">OUR METHOD</span>
            <h2>{t("method.title")}</h2>
            <p>{t("method.intro")}</p>
          </div>
          <div className="method-steps">
            {method.map(([number, title, copy]) => (
              <div key={number}>
                <span>{number}</span>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- Review detail ---------- */

export function ReviewDetailPage({ review, actions }: { review: Review; actions: AppActions }) {
  const { go, soon } = actions;
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const l = useEnumLabel();
  const { ago } = useI18nFormat();
  const { getSkill, participantName } = useData();
  const columns = review.participants.length;
  const completedLabel = t("detail.completed");
  const interventionsLabel = t("detail.interventions");
  const durationLabel = t("detail.duration");
  const verdictLabel = t("detail.verdict");
  const factRows: [string, (id: string) => string][] = [
    [completedLabel, (id) => l(review.runs[id].completed)],
    [
      interventionsLabel,
      (id) => t("detail.interventionsCount", { count: review.runs[id].interventions }),
    ],
    [durationLabel, (id) => review.runs[id].duration],
    [
      verdictLabel,
      (id) => {
        const v = review.runs[id].verdict;
        return v ? l(v) : t("detail.control");
      },
    ],
  ];
  const toneOf = (id: string, label: string) => {
    const run = review.runs[id];
    if (label === verdictLabel)
      return run.verdict === "推荐" ? "good" : run.verdict ? "warn" : "";
    if (label === completedLabel) return run.completed === "部分" ? "warn" : "";
    return "";
  };

  return (
    <>
      <main className="compare-page container review-detail">
        <div className="breadcrumb">
          <button onClick={() => go("/reviews")}>{t("detail.breadcrumb")}</button>
          <Icon name="chevron" size={13} />
          <span>{l(review.category)}</span>
          <Icon name="chevron" size={13} />
          <strong>{review.task}</strong>
        </div>
        <div className="page-title">
          <span className="section-kicker">TASK REVIEW</span>
          <h1>{review.title}</h1>
          <p>{review.summary}</p>
        </div>

        <div className="env-grid">
          {(
            [
              ["Agent", `${review.agent} ${review.agentVersion}`],
              [t("detail.model"), review.model],
              [t("detail.os"), review.os],
              [t("detail.tested"), ago(review.daysAgo)],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
          <div>
            <small>{t("detail.skillVersions")}</small>
            <strong className="mono">
              {review.participants
                .filter((id) => id !== BASELINE)
                .map((id) => `${participantName(id)}@${getSkill(id)!.verifiedCommit}`)
                .join("  ")}
            </strong>
          </div>
        </div>

        <section className="task-card">
          <div>
            <span className="section-kicker">TASK</span>
            <h2>{review.task}</h2>
          </div>
          <div>
            <strong>{t("detail.acceptanceCriteria")}</strong>
            <ul>
              {review.acceptance.map((item) => (
                <li key={item}>
                  <Icon name="check" size={14} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="compare-table-wrap">
          <div className="compare-head" style={{ "--columns": columns } as React.CSSProperties}>
            <div className="compare-label-cell">{t("detail.dimension")}</div>
            {review.participants.map((id) => {
              const skill = getSkill(id);
              return (
                <div className="compare-skill-head compact" key={id}>
                  <span className={`skill-icon ${skill?.tone ?? "slate"}`}>
                    <Icon name={skill?.icon ?? "x"} size={21} />
                  </span>
                  <strong>{participantName(id)}</strong>
                  <small>
                    {skill ? `${skill.owner}/${skill.repo}` : t("detail.noSkillLoaded")}
                  </small>
                </div>
              );
            })}
          </div>
          <div className="compare-body">
            <div className="compare-group">{t("detail.quality")}</div>
            {review.dimensions.map((dimension) => (
              <div
                className="compare-row"
                key={dimension.name}
                style={{ "--columns": columns } as React.CSSProperties}
              >
                <strong>{dimension.name}</strong>
                {review.participants.map((id) => (
                  <span key={id}>
                    <LevelMeter level={dimension.results[id]} />
                  </span>
                ))}
              </div>
            ))}
            <div className="compare-group">{t("detail.runLog")}</div>
            {factRows.map(([label, value]) => (
              <div
                className="compare-row"
                key={label}
                style={{ "--columns": columns } as React.CSSProperties}
              >
                <strong>{label}</strong>
                {review.participants.map((id) => (
                  <span key={id} className={toneOf(id, label)}>
                    {value(id)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="run-notes">
          {review.participants.map((id) => {
            const run = review.runs[id];
            return (
              <article key={id}>
                <div>
                  <strong>{participantName(id)}</strong>
                  {run.verdict && <VerdictBadge verdict={run.verdict} />}
                </div>
                <p>{run.note}</p>
                {id !== BASELINE && (
                  <button className="link-button" onClick={() => go(skillHref(id))}>
                    {t("detail.viewSkill")} <Icon name="arrow" size={15} />
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <section className="evidence">
          <h2>{t("detail.publicEvidence")}</h2>
          <div>
            {review.evidence.map((item) => (
              <button key={item} onClick={() => soon(tCommon("evidenceSoon", { item }))}>
                <Icon name="file" size={16} /> {item}
              </button>
            ))}
          </div>
        </section>

        <div className="compare-tip">
          <Icon name="shield" size={19} />
          <div>
            <strong>{t("detail.independenceTitle")}</strong>
            <p>{t("detail.independenceBody")}</p>
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------- Workflows ---------- */

function WorkflowNodes({ workflow, go }: { workflow: Workflow; go: (href: string) => void }) {
  const t = useTranslations("workflows");
  const { getSkill } = useData();
  return (
    <div className="workflow-nodes">
      {workflow.steps.map((step, index) => {
        const skill = getSkill(step.skillId)!;
        return (
          <div className="workflow-node-wrap" key={step.skillId}>
            <button className="workflow-node" onClick={() => go(skillHref(skill.id))}>
              <span className={`skill-icon ${skill.tone}`}>
                <Icon name={skill.icon} size={20} />
              </span>
              <span>
                <small>
                  {t("stepLabel", { step: index + 1 })} · {step.goal}
                </small>
                <strong>{skill.name}</strong>
              </span>
            </button>
            {index < workflow.steps.length - 1 && (
              <span className="node-arrow">
                <Icon name="arrow" size={17} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowsPage() {
  const { go } = useAppActions();
  const lang = useLocale() as Locale;
  const t = useTranslations("workflows");
  const l = useEnumLabel();
  const { list } = useI18nFormat();
  const { workflows, getSkill } = useData();
  const featured = workflows[0];
  const featuredSkills = featured.steps.map((step) => getSkill(step.skillId)!);
  const combinedRisk =
    lang === "zh" ? highestRisk(featuredSkills) : l(highestRisk(featuredSkills)).toLowerCase();

  return (
    <>
      <main className="hub-page container">
        <div className="hub-hero workflow-hero">
          <div>
            <span className="section-kicker">CURATED WORKFLOWS</span>
            <h1>{t("hero.title")}</h1>
            <p>{t("hero.copy")}</p>
          </div>
          <button className="primary" onClick={() => go("/skills")}>
            {t("hero.findSkills")} <Icon name="arrow" size={17} />
          </button>
        </div>

        <section className="workflow-feature">
          <div className="workflow-visual">
            <div className="workflow-visual-top">
              <span>{t("featured.recommendedLabel")}</span>
              <small>
                {t("featured.meta", {
                  count: featured.steps.length,
                  risk: combinedRisk,
                })}
              </small>
            </div>
            <WorkflowNodes workflow={featured} go={go} />
          </div>
          <div className="workflow-feature-copy">
            <span className="section-kicker">FEATURED WORKFLOW</span>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <div className="workflow-details">
              <span>
                <Icon name="clock" size={15} /> {featured.time}
              </span>
              <span>
                <Icon name="check" size={15} />{" "}
                {t("featured.verifiedOn", { agents: list(featured.verifiedOn) })}
              </span>
            </div>
            <button className="secondary" onClick={() => go(`/workflows/${featured.id}`)}>
              {t("featured.seeAllSteps")} <Icon name="arrow" size={16} />
            </button>
          </div>
        </section>

        <section className="hub-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">BROWSE WORKFLOWS</span>
              <h2>{t("browse.title")}</h2>
            </div>
          </div>
          <div className="workflow-grid">
            {workflows.map((workflow, index) => (
              <article className="workflow-card" key={workflow.id}>
                <div className="workflow-card-top">
                  <span className={`workflow-number ${workflow.tone}`}>0{index + 1}</span>
                  <span>{l(workflow.category)}</span>
                </div>
                <h3>{workflow.title}</h3>
                <p>{workflow.summary}</p>
                <div className="workflow-skill-stack">
                  {Array.from({ length: 3 }, (_, slot) => {
                    const step = workflow.steps[slot];
                    if (!step) {
                      return <span key={`slot-${slot}`} className="workflow-skill-slot" aria-hidden="true" />;
                    }
                    const skill = getSkill(step.skillId)!;
                    return (
                      <button key={step.skillId} onClick={() => go(skillHref(skill.id))}>
                        <span className={`mini-skill-dot ${skill.tone}`} />
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
                <div className="workflow-card-footer">
                  <span>{workflow.time}</span>
                  <span>{l(workflow.level)}</span>
                  <button onClick={() => go(`/workflows/${workflow.id}`)}>
                    {t("browse.open")} <Icon name="arrow" size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export function WorkflowDetailPage({
  workflow,
  actions,
}: {
  workflow: Workflow;
  actions: AppActions;
}) {
  const { go } = actions;
  const t = useTranslations("workflows");
  const l = useEnumLabel();
  const { list } = useI18nFormat();
  const { getSkill } = useData();
  const stepSkills = workflow.steps.map((step) => getSkill(step.skillId)!);
  const available = workflowAgents(workflow);
  const [agent, setAgent] = useState<AgentName>(available[0] ?? "Claude Code");
  const [copied, copy] = useCopy();
  const unsupported = stepSkills.filter((skill) => skill.compat[agent].status === "未验证");
  const commands = stepSkills.map((skill) => installFor(skill, agent).command).join(" \\\n  && ");

  return (
    <>
      <main className="compare-page container workflow-detail">
        <div className="breadcrumb">
          <button onClick={() => go("/workflows")}>{t("detail.breadcrumb")}</button>
          <Icon name="chevron" size={13} />
          <strong>{workflow.title}</strong>
        </div>
        <div className="page-title">
          <span className="section-kicker">{l(workflow.category)}</span>
          <h1>{workflow.title}</h1>
          <p>{workflow.summary}</p>
        </div>
        <div className="detail-signals">
          <span className="meta-pill">
            <Icon name="clock" size={14} /> {workflow.time}
          </span>
          <span className="meta-pill">{l(workflow.level)}</span>
          <span className="meta-pill">
            <Icon name="check" size={14} />{" "}
            {t("detail.endToEndVerified", { agents: list(workflow.verifiedOn) })}
          </span>
          <RiskPill risk={highestRisk(stepSkills)} />
        </div>

        <ol className="workflow-steps">
          {workflow.steps.map((step, index) => {
            const skill: Skill = stepSkills[index];
            return (
              <li key={step.skillId}>
                <span className="step-number">{index + 1}</span>
                <div className="step-body">
                  <div className="step-head">
                    <span className={`skill-icon ${skill.tone}`}>
                      <Icon name={skill.icon} size={20} />
                    </span>
                    <div>
                      <h3>{step.goal}</h3>
                      <p className="repo-line">
                        {skill.name} · {skill.owner}/{skill.repo}
                      </p>
                    </div>
                    <div className="signal-row">
                      <StatusPill status={skill.status} />
                      <RiskPill risk={skill.risk} />
                    </div>
                  </div>
                  <div className="step-io">
                    <span>
                      <small>{t("detail.input")}</small>
                      {step.input}
                    </span>
                    <Icon name="arrow" size={15} />
                    <span>
                      <small>{t("detail.output")}</small>
                      {step.output}
                    </span>
                  </div>
                  <button className="link-button" onClick={() => go(skillHref(skill.id))}>
                    {t("detail.viewSkill")} <Icon name="arrow" size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="content-section">
          <div className="content-heading">
            <span className="number">
              <Icon name="terminal" size={15} />
            </span>
            <div>
              <h2>{t("detail.bulkInstallTitle")}</h2>
              <p>{t("detail.bulkInstallIntro")}</p>
            </div>
          </div>
          <div className="install-panel">
            <div className="agent-tabs" role="tablist" aria-label={t("detail.chooseAgent")}>
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
                  <i className={`tab-dot ${available.includes(item) ? "good" : "muted"}`} />
                </button>
              ))}
            </div>
            {unsupported.length > 0 && (
              <div className="install-notice">
                <Notice>
                  {t("detail.unsupportedOnAgent", {
                    skills: list(unsupported.map((skill) => skill.name)),
                    agent,
                  })}
                </Notice>
              </div>
            )}
            <CopyBlock text={commands} copied={copied} onCopy={() => copy(commands)} multiline />
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- Agents ---------- */

const AGENT_MATRIX_LIMIT = 24;

export function AgentsPage() {
  const { go, soon } = useAppActions();
  const t = useTranslations("agents");
  const tFooter = useTranslations("footer");
  const l = useEnumLabel();
  const { skills, agentCopy } = useData();
  const matrixSkills = useMemo(
    () => [...skills].sort((a, b) => b.installs - a.installs).slice(0, AGENT_MATRIX_LIMIT),
    [skills],
  );
  return (
    <>
      <main className="hub-page container">
        <div className="hub-hero agent-hero">
          <div>
            <span className="section-kicker">AGENT COMPATIBILITY</span>
            <h1>{t("hero.title")}</h1>
            <p>{t("hero.copy")}</p>
          </div>
          <div className="compat-legend">
            <span>
              <i className="full" /> {l("完整支持")}
            </span>
            <span>
              <i className="partial" /> {l("部分支持")}
            </span>
            <span>
              <i /> {l("未验证")}
            </span>
          </div>
        </div>

        <section className="agent-grid">
          {AGENTS.map((agent) => {
            const profile = agentProfiles[agent];
            const coverage = Math.round((profile.verified / profile.compatible) * 100);
            return (
              <article className="agent-card" key={agent}>
                <div className="agent-card-heading">
                  <span className={`agent-logo ${profile.tone}`}>{AGENT_META[agent].mark}</span>
                  <div>
                    <h2>{agent}</h2>
                    <span>
                      <i /> {t("maintained")}
                    </span>
                  </div>
                </div>
                <p>{agentCopy(agent)}</p>
                <div className="agent-metrics">
                  <div>
                    <strong>{profile.verified}</strong>
                    <span>{t("tested")}</span>
                  </div>
                  <div>
                    <strong>{profile.compatible}</strong>
                    <span>{t("compatibleSkills")}</span>
                  </div>
                </div>
                <div className="coverage-bar" title={t("coverageTested", { coverage })}>
                  <span style={{ width: `${coverage}%` }} />
                </div>
                <small className="coverage-label">
                  {t("coverageTestedPath", { coverage })}{" "}
                  <code>{AGENT_META[agent].installDir("<skill>")}</code>
                </small>
                <div className="agent-card-actions">
                  <button
                    type="button"
                    className="agent-card-link"
                    onClick={() => go(agentHref(agentSlug(agent)))}
                  >
                    {t("details")} <Icon name="arrow" size={15} />
                  </button>
                  <button
                    type="button"
                    className="primary small"
                    onClick={() => go(searchHref({ agent }))}
                  >
                    {t("browseSkills")}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="hub-section compatibility-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">COMPATIBILITY MATRIX</span>
              <h2>{t("matrix.title")}</h2>
              <p>{t("matrix.intro")}</p>
            </div>
          </div>
          <div className="agent-matrix">
            <div className="agent-matrix-head">
              <span>Skill</span>
              {AGENTS.map((agent) => (
                <span key={agent}>
                  <AgentMark agent={agent} size="sm" />
                  <span className="matrix-agent-name">{agent}</span>
                </span>
              ))}
            </div>
            {matrixSkills.map((skill) => (
              <div className="agent-matrix-row" key={skill.id}>
                <button onClick={() => go(skillHref(skill.id))}>
                  <span className={`mini-skill-dot ${skill.tone}`} />
                  {skill.name}
                </button>
                {AGENTS.map((agent) => {
                  const compat = skill.compat[agent];
                  const tone = compatTone(compat.status);
                  return (
                    <span
                      className={
                        tone === "good"
                          ? "matrix-full"
                          : tone === "warn"
                            ? "matrix-partial"
                            : "matrix-empty"
                      }
                      key={agent}
                      title={`${agent}: ${l(compat.status)}${compat.note ? ` — ${compat.note}` : ""}`}
                    >
                      {tone === "good" ? (
                        <Icon name="check" size={14} />
                      ) : tone === "warn" ? (
                        t("matrix.partial")
                      ) : (
                        "—"
                      )}
                      <span className="sr-only">{l(compat.status)}</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          {skills.length > AGENT_MATRIX_LIMIT && (
            <p className="matrix-footnote">
              {t("matrix.footnote", { limit: AGENT_MATRIX_LIMIT, total: skills.length })}
            </p>
          )}
        </section>

        <section className="agent-guide">
          <span className="shield-icon">
            <Icon name="file" size={21} />
          </span>
          <div>
            <h3>{t("guide.title")}</h3>
            <p>{t("guide.copy")}</p>
          </div>
          <button className="secondary" onClick={() => soon(tFooter("agentGuideSoon"))}>
            {t("guide.readGuide")} <Icon name="arrow" size={15} />
          </button>
        </section>
      </main>
    </>
  );
}