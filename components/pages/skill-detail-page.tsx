"use client";

import { useEffect, useState } from "react";
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
import { useI18n } from "@/lib/i18n";
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
  const { t, l, ago } = useI18n();
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
      ? t("自动转换为 .mdc 项目规则", "Auto-converted to a .mdc project rule")
      : agent === "Windsurf"
        ? t("自动转换为 Windsurf 规则文件", "Auto-converted to a Windsurf rule file")
        : t("原生 SKILL.md，无需转换", "Native SKILL.md, no conversion");

  const prototype = isPrototypeSkill(skill.id);
  const relatedMcps = mcpsForSkill(skill.id);
  const sections: [string, string][] = [
    ["install", t("安装", "Install")],
    ["usage", t("适用场景", "Use cases")],
    ["compat", t("兼容性", "Compatibility")],
    ["security", t("安全与权限", "Security")],
    ["mcp", t("MCP 关联", "MCP")],
    ["evaluation", t("任务评测", "Task review")],
    ["skillmd", "SKILL.md"],
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
    [t("来源已收录", "Source listed"), true],
    [t("安装已验证", "Install verified"), skill.status !== "待验证"],
    [t("安全已评估", "Security assessed"), skill.risk !== "未评估"],
    [t("任务已实测", "Task-tested"), skill.status === "任务已实测"],
    [t("作者已认证", "Author verified"), false],
  ];

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
                      <Icon name="check" size={13} /> {t("原型演示", "Prototype demo")}
                    </span>
                  ) : (
                    <span className="verified-badge muted">
                      <Icon name="clock" size={13} /> {t("采集草稿", "Collected draft")}
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
              <span
                className="meta-pill"
                title={t("来源仓库 GitHub Star", "Source repo GitHub stars")}
              >
                <Icon name="star" size={14} /> {t("来源仓库", "Repo")} {skill.stars}
              </span>
              <span className="meta-pill">
                <Icon name="clock" size={14} />
                {lastVerified === null
                  ? t("尚未验证", "Not verified yet")
                  : `${t("验证于", "Verified")} ${ago(lastVerified)}`}
              </span>
            </div>
            {!prototype && (
              <Notice>
                <strong>{t("采集草稿 · 结论待审。", "Collected draft · conclusions pending review.")}</strong>
                {t(
                  "兼容性、安全与评测字段来自启发式或对标站快照，非正式本站验证结论。",
                  "Compatibility, security and review fields come from heuristics or benchmark snapshots—not official awskill verification.",
                )}
              </Notice>
            )}
            {isStale(skill) && skill.verifiedCommit !== "—" && (
              <Notice>
                <strong>
                  {t("来源已更新，结论待复核。", "Source updated; conclusions under review.")}
                </strong>
                {t(
                  "仓库在验证后有新提交（最新 ",
                  "The repo has new commits since verification (latest ",
                )}
                <code>{skill.latestCommit}</code>
                {t("），当前结论基于 ", "). Current conclusions are based on ")}
                <code>{skill.verifiedCommit}</code>
                {t("，平台将在 72 小时内重新验证。", " and will be re-verified within 72 hours.")}
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
              {selected ? t("已加入对比", "In compare") : t("加入对比", "Add to compare")}
            </button>
            <button
              className={`icon-button ${favorite ? "on" : ""}`}
              aria-label={favorite ? t("取消收藏", "Remove bookmark") : t("收藏", "Bookmark")}
              aria-pressed={favorite}
              title={favorite ? t("已收藏", "Bookmarked") : t("收藏", "Bookmark")}
              onClick={onFavorite}
            >
              <Icon name="bookmark" size={18} />
            </button>
          </div>
        </div>
      </section>

      <nav className="detail-tabs" aria-label={t("页面目录", "On this page")}>
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
                <h2>{t("安装与使用", "Install & use")}</h2>
                <p>
                  {t(
                    "不同 Agent 的安装目录与格式不同，请选择你使用的 Agent。",
                    "Install paths and formats differ by Agent. Pick the one you use.",
                  )}
                </p>
              </div>
            </div>
            <div className="install-panel">
              <div
                className="agent-tabs"
                role="tablist"
                aria-label={t("选择 Agent", "Choose Agent")}
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
                    ? t(
                        `尚未在 ${agent} 中验证，以下命令按通用规则生成，仅供参考。`,
                        `Not yet verified on ${agent}. The command below follows generic rules and is for reference only.`,
                      )
                    : t(
                        `已在 ${agent} ${compat.agentVersion} · ${compat.os} 验证（${ago(compat.verifiedDaysAgo)}）${compat.note ? `：${compat.note}` : ""}`,
                        `Verified on ${agent} ${compat.agentVersion} · ${compat.os} (${ago(compat.verifiedDaysAgo)})${compat.note ? `. ${compat.note}` : ""}`,
                      )}
                </span>
              </div>
              <CopyBlock
                text={install.command}
                copied={copied}
                onCopy={() => copy(install.command)}
              />
              <div className="install-meta four">
                <span>
                  <strong>{t("前置条件", "Requires")}</strong> {skill.prerequisites}
                </span>
                <span>
                  <strong>API Key</strong>{" "}
                  {skill.needsApiKey ? t("需要", "Required") : t("不需要", "Not needed")}
                </span>
                <span>
                  <strong>{t("安装位置", "Path")}</strong> <code>{install.dir}</code>
                </span>
                <span>
                  <strong>{t("格式", "Format")}</strong> {format}
                </span>
              </div>
              <div className="uninstall-line">
                <strong>{t("卸载", "Uninstall")}</strong>
                <code>{install.uninstall}</code>
              </div>
            </div>
          </section>

          <section className="content-section" id="usage">
            <div className="content-heading">
              <span className="number">02</span>
              <div>
                <h2>{t("适合做什么", "What it's good for")}</h2>
                <p>
                  {t(
                    "基于原始说明与平台实测整理。",
                    "Based on the original docs and our own tests.",
                  )}
                </p>
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
              <strong>{t("不适合：", "Not for: ")}</strong>
              <span>{skill.notFor}</span>
            </div>
          </section>

          <section className="content-section" id="compat">
            <div className="content-heading">
              <span className="number">03</span>
              <div>
                <h2>{t("兼容性", "Compatibility")}</h2>
                <p>
                  {t(
                    "每项结论都绑定 Agent 版本和验证环境。“未验证”不等于不支持。",
                    "Every result is tied to an Agent version and environment. “Unverified” doesn't mean unsupported.",
                  )}
                </p>
              </div>
            </div>
            <div className="compat-table">
              <div className="table-head">
                <span>Agent</span>
                <span>{t("状态", "Status")}</span>
                <span>{t("验证环境", "Environment")}</span>
                <span>{t("最近验证", "Last verified")}</span>
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
                <h2>{t("安全与权限", "Security & permissions")}</h2>
                <p>
                  {t(
                    "低风险不代表零风险，请在安装前确认权限范围。",
                    "Low risk isn't zero risk. Confirm the permission scope before installing.",
                  )}
                </p>
              </div>
            </div>
            <div className={`security-panel ${riskClass}`}>
              <div className="security-score">
                <span className="shield-icon large">
                  <Icon name={skill.risk === "低风险" ? "shield" : "warning"} size={26} />
                </span>
                <div>
                  <small>{t("综合风险等级", "Overall risk")}</small>
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
                    ? t("尚未完成安全评估", "Security assessment pending")
                    : t("自动静态扫描 + 平台人工复核", "Automated static scan + manual review")}
                </span>
                <span>
                  {skill.risk === "未评估"
                    ? "—"
                    : `${t("基于", "Based on")} Commit ${skill.verifiedCommit}`}
                </span>
              </div>
            </div>
          </section>

          <section className="content-section" id="mcp">
            <div className="content-heading">
              <span className="number">05</span>
              <div>
                <h2>{t("依赖或搭配的 MCP", "Related MCP servers")}</h2>
                <p>
                  {t(
                    "仅在详情关联展示，不做独立 MCP 目录（D-07）。",
                    "Shown only on Skill detail—no standalone MCP directory (D-07).",
                  )}
                </p>
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
                          {t("官网 / 仓库", "Site / repo")} <Icon name="external" size={13} />
                        </a>
                      </div>
                      <span className={`mcp-relation ${mcp.relation}`}>
                        {mcp.relation === "required"
                          ? t("必需", "Required")
                          : t("可选增强", "Optional")}
                      </span>
                    </div>
                    <p>{t(mcp.purposeZh, mcp.purposeEn)}</p>
                    <p className="mcp-setup">
                      <strong>{t("配置", "Setup")}</strong> {t(mcp.setupZh, mcp.setupEn)}
                    </p>
                    {mcp.envVars?.length ? (
                      <p className="mcp-env">
                        <strong>{t("环境变量", "Env")}</strong>{" "}
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
                <h3>{t("暂无登记的 MCP 关联", "No MCP links recorded")}</h3>
                <p className="evaluation-copy">
                  {t(
                    "该 Skill 当前未登记必需或可选 MCP。有依赖时会在此列出用途与配置前置条件。",
                    "This Skill has no required or optional MCP links yet. When present, purpose and setup prerequisites appear here.",
                  )}
                </p>
              </div>
            )}
          </section>

          <section className="content-section evaluation-section" id="evaluation">
            <div className="content-heading">
              <span className="number">06</span>
              <div>
                <h2>{t("任务评测", "Task review")}</h2>
                <p>
                  {prototype
                    ? t(
                        "以下为原型演示数据，不代表正式评测结论。",
                        "Prototype demo data, not an official review conclusion.",
                      )
                    : t(
                        "采集草稿通常尚无任务评测；有结论前请勿当作正式实测。",
                        "Collected drafts usually have no task review yet—don't treat empty results as official tests.",
                      )}
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
                            ? t("对比无 Skill 基线", "vs. no-Skill baseline")
                            : t("同类横向对比", "Head-to-head")}
                        </span>
                        <h3>{review.task}</h3>
                      </div>
                      {run.verdict && <VerdictBadge verdict={run.verdict} />}
                    </div>
                    <div className="metrics">
                      <div>
                        <small>{t("任务完成", "Completed")}</small>
                        <strong>{l(run.completed)}</strong>
                      </div>
                      <div>
                        <small>{t("人工干预", "Interventions")}</small>
                        <strong>
                          {run.interventions} {t("次", "")}
                        </strong>
                      </div>
                      <div>
                        <small>{t("运行时间", "Duration")}</small>
                        <strong>{run.duration}</strong>
                      </div>
                      <div>
                        <small>{t("测试环境", "Environment")}</small>
                        <strong>
                          {review.agent} {review.agentVersion}
                        </strong>
                      </div>
                    </div>
                    <p className="evaluation-copy">{run.note}</p>
                    <button className="link-button" onClick={() => go(`/reviews/${review.id}`)}>
                      {t("查看完整评测记录", "View full review")} <Icon name="arrow" size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="evaluation-card empty">
                <h3>{t("暂无任务评测", "No task review yet")}</h3>
                <p className="evaluation-copy">
                  {t(
                    `当前状态为“${skill.status}”。完成安装验证后，同类 Skill 将进入统一任务评测排期。`,
                    `Current status: “${l(skill.status)}”. Once installs are verified, similar Skills are scheduled for a shared task review.`,
                  )}
                </p>
                <button className="link-button" onClick={() => go("/reviews")}>
                  {t("浏览已有评测", "Browse reviews")} <Icon name="arrow" size={16} />
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
                  {t("原始文件摘录 · 来自 Commit", "Original file excerpt · from commit")}{" "}
                  <span className="mono">{skill.latestCommit}</span>
                </p>
              </div>
            </div>
            <pre className="skill-md">{skill.skillMd}</pre>
          </section>
        </div>
        <aside className="detail-aside">
          <div className="aside-card">
            <h3>{t("来源信息", "Source")}</h3>
            <dl>
              {(
                [
                  [t("作者", "Author"), skill.owner],
                  [t("来源仓库", "Repository"), `${skill.owner}/${skill.repo}`],
                  [t("许可证", "License"), skill.license],
                  [t("收录时间", "Listed"), skill.addedAt],
                  [t("来源更新", "Source updated"), ago(skill.sourceUpdatedDaysAgo)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div>
                <dt>{t("验证 Commit", "Verified commit")}</dt>
                <dd className="mono">{skill.verifiedCommit}</dd>
              </div>
              <div>
                <dt>{t("最新 Commit", "Latest commit")}</dt>
                <dd className={`mono ${isStale(skill) ? "stale" : ""}`}>{skill.latestCommit}</dd>
              </div>
            </dl>
            <a
              className="github-link"
              href={`https://github.com/${skill.owner}/${skill.repo}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" size={17} /> {t("在 GitHub 查看", "View on GitHub")}{" "}
              <Icon name="external" size={14} />
            </a>
          </div>
          <div className="aside-card">
            <h3>{t("数据可信度", "Trust signals")}</h3>
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

