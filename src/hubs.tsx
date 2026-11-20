import { useEffect, useMemo, useState } from "react";
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
} from "./data";
import { useI18n } from "./i18n";
import {
  type AppActions,
  Footer,
  type Route,
  searchHref,
  skillHref,
  useCopy,
  VerdictBadge,
} from "./shared";
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
} from "./ui";
import { useData } from "./useData";

/* ---------- Reviews hub ---------- */

export function ReviewsPage({ route, actions }: { route: Route; actions: AppActions }) {
  const { go } = actions;
  const { t, l, ago } = useI18n();
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
    [
      "01",
      t("固定任务", "Fixed tasks"),
      t(
        "同类 Skill 使用相同输入和验收标准",
        "Similar Skills get the same input and acceptance criteria",
      ),
    ],
    [
      "02",
      t("隔离环境", "Isolated runs"),
      t("记录 Agent、模型、系统和 Commit", "Agent, model, OS and commit are recorded"),
    ],
    [
      "03",
      t("保留证据", "Kept evidence"),
      t("保存结果、耗时和人工干预记录", "Results, timing and interventions are saved"),
    ],
    [
      "04",
      t("独立结论", "Independent"),
      t("付费不能改变测试和安全结论", "Payment can't change test or security results"),
    ],
  ];

  return (
    <>
      <main className="hub-page container">
        <div className="hub-hero">
          <div>
            <span className="section-kicker">INDEPENDENT REVIEWS</span>
            <h1>{t("真实任务，透明结论", "Real tasks, open results")}</h1>
            <p>
              {t(
                "同类 Skill 使用统一任务和环境测试。每份结论都绑定 Agent、版本与 Commit。",
                "Similar Skills are tested on the same task and environment. Every result is tied to an Agent, version and commit.",
              )}
            </p>
          </div>
          <div className="hub-stat-row">
            <div>
              <strong>24</strong>
              <span>{t("完整任务评测", "Task reviews")}</span>
            </div>
            <div>
              <strong>68</strong>
              <span>{t("安装验证", "Install checks")}</span>
            </div>
            <div>
              <strong>4</strong>
              <span>{t("Agent 环境", "Agent setups")}</span>
            </div>
          </div>
        </div>

        <section className="featured-review">
          <div className="featured-review-copy">
            <div className="review-meta">
              <span className="demo-tag">{t("本周深度评测", "Deep dive of the week")}</span>
              <span>{l(featured.category)}</span>
            </div>
            <h2>{featured.title}</h2>
            <p>
              {t(
                `让 ${participantName(featured.participants[0])} 与无 Skill 基线在同一个需求和代码起点上运行，比较视觉决策、代码完成度、响应式表现和人工干预次数。`,
                `${participantName(featured.participants[0])} and a no-Skill baseline run from the same brief and codebase. We compare visual decisions, code completeness, responsiveness and human interventions.`,
              )}
            </p>
            <div className="review-facts">
              <span>
                <Icon name="clock" size={15} />{" "}
                {t(`${featured.readMinutes} 分钟阅读`, `${featured.readMinutes} min read`)}
              </span>
              <span>
                <Icon name="terminal" size={15} /> {featured.agent} {featured.agentVersion}
              </span>
              <span>
                <Icon name="check" size={15} /> {t("统一测试环境", "Same environment")}
              </span>
            </div>
            <button className="primary" onClick={() => go(`#/review/${featured.id}`)}>
              {t("查看评测结果", "See results")} <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="review-scoreboard">
            <div className="scoreboard-label">
              {t("分维度结果 · 不合成总分", "Per-dimension results · no overall score")}
            </div>
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
                  {t(
                    `：人工干预 ${featured.runs[id].interventions} 次`,
                    `: ${featured.runs[id].interventions} interventions`,
                  )}
                </span>
              ))}
            </div>
            <p>
              {t(
                "原型演示数据 · 正式评测将公开环境与证据",
                "Prototype demo data · official reviews will publish environment and evidence",
              )}
            </p>
          </div>
        </section>

        <section className="hub-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">LATEST TESTS</span>
              <h2>{t("最新评测", "Latest reviews")}</h2>
            </div>
            <MenuSelect
              className="filter-chip select-chip"
              value={category}
              options={["all", ...categories]}
              onChange={setCategory}
              ariaLabel={t("按分类筛选评测", "Filter reviews by category")}
              getLabel={(item) => (item === "all" ? t("全部分类", "All categories") : l(item))}
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
                        <Icon name="grid" size={14} /> {t("横向对比", "Head-to-head")}
                      </span>
                    ) : (
                      verdict && (
                        <span className={verdict === "推荐" ? "good" : "conditional"}>
                          <Icon name={verdict === "推荐" ? "check" : "warning"} size={14} />
                          {l(verdict)}
                        </span>
                      )
                    )}
                    <button onClick={() => go(`#/review/${review.id}`)}>
                      {t("查看报告", "Read report")} <Icon name="arrow" size={15} />
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
            <h2>{t("结论是如何得出的", "How we reach conclusions")}</h2>
            <p>
              {t(
                "不使用模糊总分。安装、任务效果、稳定性、安全和成本分别记录。",
                "No vague overall score. Install, task results, stability, security and cost are recorded separately.",
              )}
            </p>
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
      <Footer actions={actions} />
    </>
  );
}

/* ---------- Review detail ---------- */

export function ReviewDetailPage({ review, actions }: { review: Review; actions: AppActions }) {
  const { go, soon } = actions;
  const { t, l, ago } = useI18n();
  const { getSkill, participantName } = useData();
  const columns = review.participants.length;
  const factRows: [string, (id: string) => string][] = [
    [t("任务完成", "Completed"), (id) => l(review.runs[id].completed)],
    [
      t("人工干预", "Interventions"),
      (id) => t(`${review.runs[id].interventions} 次`, `${review.runs[id].interventions}`),
    ],
    [t("运行时间", "Duration"), (id) => review.runs[id].duration],
    [
      t("结论", "Verdict"),
      (id) => {
        const verdict = review.runs[id].verdict;
        return verdict ? l(verdict) : t("对照组", "Control");
      },
    ],
  ];
  const toneOf = (id: string, label: string) => {
    const run = review.runs[id];
    if (label === t("结论", "Verdict"))
      return run.verdict === "推荐" ? "good" : run.verdict ? "warn" : "";
    if (label === t("任务完成", "Completed")) return run.completed === "部分" ? "warn" : "";
    return "";
  };

  return (
    <>
      <main className="compare-page container review-detail">
        <div className="breadcrumb">
          <button onClick={() => go("#/reviews")}>{t("评测", "Reviews")}</button>
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
              [t("模型", "Model"), review.model],
              [t("系统", "OS"), review.os],
              [t("测试时间", "Tested"), ago(review.daysAgo)],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
          <div>
            <small>{t("Skill 版本", "Skill versions")}</small>
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
            <strong>{t("验收标准", "Acceptance criteria")}</strong>
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
            <div className="compare-label-cell">{t("评测维度", "Dimension")}</div>
            {review.participants.map((id) => {
              const skill = getSkill(id);
              return (
                <div className="compare-skill-head compact" key={id}>
                  <span className={`skill-icon ${skill?.tone ?? "slate"}`}>
                    <Icon name={skill?.icon ?? "x"} size={21} />
                  </span>
                  <strong>{participantName(id)}</strong>
                  <small>
                    {skill
                      ? `${skill.owner}/${skill.repo}`
                      : t("相同任务，不加载任何 Skill", "Same task, no Skill loaded")}
                  </small>
                </div>
              );
            })}
          </div>
          <div className="compare-body">
            <div className="compare-group">{t("质量维度", "Quality")}</div>
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
            <div className="compare-group">{t("运行记录", "Run log")}</div>
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
                    {t("查看 Skill 详情", "View Skill")} <Icon name="arrow" size={15} />
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <section className="evidence">
          <h2>{t("公开证据", "Public evidence")}</h2>
          <div>
            {review.evidence.map((item) => (
              <button key={item} onClick={() => soon(`评测证据：${item}`, `Evidence: ${item}`)}>
                <Icon name="file" size={16} /> {item}
              </button>
            ))}
          </div>
        </section>

        <div className="compare-tip">
          <Icon name="shield" size={19} />
          <div>
            <strong>{t("独立性声明", "Independence statement")}</strong>
            <p>
              {t(
                "本评测未接受任何 Skill 作者赞助，付费推广不会改变测试与安全结论。当前为原型演示数据。",
                "This review accepted no sponsorship from Skill authors; paid promotion never changes test or security results. Prototype demo data.",
              )}
            </p>
          </div>
        </div>
      </main>
      <Footer actions={actions} />
    </>
  );
}

/* ---------- Workflows ---------- */

function WorkflowNodes({ workflow, go }: { workflow: Workflow; go: (href: string) => void }) {
  const { t } = useI18n();
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
                  {t(`步骤 ${index + 1}`, `Step ${index + 1}`)} · {step.goal}
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

export function WorkflowsPage({ actions }: { actions: AppActions }) {
  const { go } = actions;
  const { t, l, list } = useI18n();
  const { workflows, getSkill } = useData();
  const featured = workflows[0];
  const featuredSkills = featured.steps.map((step) => getSkill(step.skillId)!);

  return (
    <>
      <main className="hub-page container">
        <div className="hub-hero workflow-hero">
          <div>
            <span className="section-kicker">CURATED WORKFLOWS</span>
            <h1>{t("不要只安装，开始组合", "Don't just install—combine")}</h1>
            <p>
              {t(
                "将多个 Skill 按正确顺序组合成可复用流程，从一个目标出发完成整项工作。",
                "Chain Skills in the right order into reusable flows that take one goal all the way to done.",
              )}
            </p>
          </div>
          <button className="primary" onClick={() => go("#/search")}>
            {t("查找所需 Skill", "Find Skills")} <Icon name="arrow" size={17} />
          </button>
        </div>

        <section className="workflow-feature">
          <div className="workflow-visual">
            <div className="workflow-visual-top">
              <span>{t("推荐工作流", "Recommended workflow")}</span>
              <small>
                {t(
                  `${featured.steps.length} 个 Skills · 组合风险 ${highestRisk(featuredSkills)}`,
                  `${featured.steps.length} Skills · combined risk: ${l(highestRisk(featuredSkills)).toLowerCase()}`,
                )}
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
                {t(
                  `${list(featured.verifiedOn)} 已验证`,
                  `Verified on ${list(featured.verifiedOn)}`,
                )}
              </span>
            </div>
            <button className="secondary" onClick={() => go(`#/workflow/${featured.id}`)}>
              {t("查看完整步骤", "See all steps")} <Icon name="arrow" size={16} />
            </button>
          </div>
        </section>

        <section className="hub-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">BROWSE WORKFLOWS</span>
              <h2>{t("从目标开始", "Start from a goal")}</h2>
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
                  <button onClick={() => go(`#/workflow/${workflow.id}`)}>
                    {t("查看", "Open")} <Icon name="arrow" size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer actions={actions} />
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
  const { t, l, list } = useI18n();
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
          <button onClick={() => go("#/workflows")}>{t("工作流", "Workflows")}</button>
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
            {t(
              `${list(workflow.verifiedOn)} 已整体验证`,
              `End-to-end verified on ${list(workflow.verifiedOn)}`,
            )}
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
                      <small>{t("输入", "Input")}</small>
                      {step.input}
                    </span>
                    <Icon name="arrow" size={15} />
                    <span>
                      <small>{t("输出", "Output")}</small>
                      {step.output}
                    </span>
                  </div>
                  <button className="link-button" onClick={() => go(skillHref(skill.id))}>
                    {t("查看 Skill 详情", "View Skill")} <Icon name="arrow" size={15} />
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
              <h2>{t("一次安装全部 Skill", "Install every Skill at once")}</h2>
              <p>
                {t("按所选 Agent 生成安装命令。", "Commands are generated for the selected Agent.")}
              </p>
            </div>
          </div>
          <div className="install-panel">
            <div className="agent-tabs" role="tablist" aria-label={t("选择 Agent", "Choose Agent")}>
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
                  {t(
                    `${list(unsupported.map((skill) => skill.name))} 尚未在 ${agent} 中验证，组合流程可能无法完整运行。`,
                    `${list(unsupported.map((skill) => skill.name))} not yet verified on ${agent}; the full flow may not run end to end.`,
                  )}
                </Notice>
              </div>
            )}
            <CopyBlock text={commands} copied={copied} onCopy={() => copy(commands)} multiline />
          </div>
        </section>
      </main>
      <Footer actions={actions} />
    </>
  );
}

/* ---------- Agents ---------- */

const AGENT_MATRIX_LIMIT = 24;

export function AgentsPage({ actions }: { actions: AppActions }) {
  const { go, soon } = actions;
  const { t, l } = useI18n();
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
            <h1>{t("为你的 Agent 找到正确版本", "The right setup for your Agent")}</h1>
            <p>
              {t(
                "同一个 Skill 在不同 Agent 中可能需要不同目录、命令和配置。我们分别验证。",
                "The same Skill may need different paths, commands and config per Agent. We verify each one.",
              )}
            </p>
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
                      <i /> {t("正在维护", "Maintained")}
                    </span>
                  </div>
                </div>
                <p>{agentCopy(agent)}</p>
                <div className="agent-metrics">
                  <div>
                    <strong>{profile.verified}</strong>
                    <span>{t("已实测", "Tested")}</span>
                  </div>
                  <div>
                    <strong>{profile.compatible}</strong>
                    <span>{t("兼容 Skills", "Compatible")}</span>
                  </div>
                </div>
                <div
                  className="coverage-bar"
                  title={t(`实测覆盖 ${coverage}%`, `${coverage}% tested`)}
                >
                  <span style={{ width: `${coverage}%` }} />
                </div>
                <small className="coverage-label">
                  {t(`实测覆盖 ${coverage}% · 安装目录`, `${coverage}% tested · path`)}{" "}
                  <code>{AGENT_META[agent].installDir("<skill>")}</code>
                </small>
                <button onClick={() => go(searchHref({ agent }))}>
                  {t(`浏览 ${agent} Skills`, `Browse ${agent} Skills`)}{" "}
                  <Icon name="arrow" size={15} />
                </button>
              </article>
            );
          })}
        </section>

        <section className="hub-section compatibility-section">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">COMPATIBILITY MATRIX</span>
              <h2>{t("热门 Skill 兼容情况", "Popular Skill compatibility")}</h2>
              <p>
                {t(
                  "“未验证”不等于不支持，只表示平台尚未完成对应环境测试。",
                  "“Unverified” doesn't mean unsupported—we just haven't tested that environment yet.",
                )}
              </p>
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
                        t("部分", "Partial")
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
              {t(
                `按安装量展示前 ${AGENT_MATRIX_LIMIT} 个 · 共 ${skills.length} 个`,
                `Top ${AGENT_MATRIX_LIMIT} by installs · ${skills.length} total`,
              )}
            </p>
          )}
        </section>

        <section className="agent-guide">
          <span className="shield-icon">
            <Icon name="file" size={21} />
          </span>
          <div>
            <h3>{t("不知道从哪个 Agent 开始？", "Not sure which Agent to start with?")}</h3>
            <p>
              {t(
                "阅读中文 Agent 入门指南，了解安装方式、Skill 目录和主要差异。",
                "Read the starter guide for install methods, Skill paths and key differences.",
              )}
            </p>
          </div>
          <button
            className="secondary"
            onClick={() => soon("Agent 入门指南", "Agent starter guide")}
          >
            {t("查看入门指南", "Read the guide")} <Icon name="arrow" size={15} />
          </button>
        </section>
      </main>
      <Footer actions={actions} />
    </>
  );
}
