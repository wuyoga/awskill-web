"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import {
  AGENTS,
  CATEGORIES,
  catalogCounts,
  categoryMeta,
  lastVerifiedDays,
  permissionLevel,
} from "@/lib/data";
import { searchHref, skillHref } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/use-data";
import { type AppActions } from "@/components/shared";
import { AgentMark, Icon, SkillCard } from "@/components/ui";

export function HomePage({ actions }: { actions: AppActions }) {
  const { go, compareIds, toggleCompare } = actions;
  const shortcut = useSyncExternalStore(() => () => {}, () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"), () => "Ctrl K");
  const { t, l, ago } = useI18n();
  const { skills, getSkill } = useData();
  const [query, setQuery] = useState("");
  const sample = getSkill("frontend-design") ?? skills[0]!;
  const featuredVerified = skills.filter((skill) => skill.status === "任务已实测").slice(0, 3);
  const featured =
    featuredVerified.length > 0 ? featuredVerified : skills.filter((s) => s.id !== sample.id).slice(0, 3);
  const quick: [string, string][] = [
    ["前端设计", "Frontend design"],
    ["代码审查", "Code review"],
    ["浏览器自动化", "Browser automation"],
    ["制作演示", "Slides"],
  ];

  function submit(event: FormEvent) {
    event.preventDefault();
    go(searchHref({ q: query.trim() }));
  }

  return (
      <main>
        <section className="hero">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-orb one" />
          <div className="hero-orb two" />
          <div className="container hero-content">
            <div className="eyebrow">
              <span className="live-dot" />
              {t("中文 Agent Skill 评测与发现平台", "Agent Skill reviews and discovery")}
            </div>
            <h1>
              {t("找到真正适合你的", "Find the")} <span>Agent Skills</span>
              {t("", " that fit")}
            </h1>
            <p className="hero-copy">
              {t(
                "不只看热度。安装前先确认兼容性、安全风险和真实任务表现。",
                "Look past popularity. Check compatibility, security risk and real task results before you install.",
              )}
            </p>
            <form className="hero-search" onSubmit={submit}>
              <Icon name="search" size={21} />
              <input
                id="global-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(
                  "描述你想完成的任务，例如：浏览器自动化",
                  "Describe a task, e.g. browser automation",
                )}
                aria-label={t("搜索 Skill", "Search Skills")}
              />
              <kbd className="shortcut">{shortcut}</kbd>
              <button type="submit">{t("搜索", "Search")}</button>
            </form>
            <div className="quick-searches">
              <span>{t("热门：", "Popular:")}</span>
              {quick.map(([zh, en]) => (
                <button key={zh} onClick={() => go(searchHref({ q: t(zh, en) }))}>
                  {t(zh, en)}
                </button>
              ))}
            </div>
            <div className="agent-strip">
              <span>{t("已支持", "Supports")}</span>
              {AGENTS.map((agent) => (
                <button key={agent} onClick={() => go(searchHref({ agent }))}>
                  <AgentMark agent={agent} />
                  {agent}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">VERIFIED SKILLS</span>
              <h2>{t("经过验证，而不是简单收录", "Verified, not just listed")}</h2>
              <p>
                {t(
                  "每个结论都标明测试环境、Agent 版本和验证日期。",
                  "Every conclusion states its test environment, Agent version and verification date.",
                )}
              </p>
            </div>
            <button className="link-button" onClick={() => go("/skills")}>
              {t("查看全部", "View all")} <Icon name="arrow" size={17} />
            </button>
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
          <p className="demo-note">
            {t(
              "评测内容为原型演示数据，正式上线后将绑定真实测试环境与 Commit。",
              "Review content is prototype demo data. At launch it will be bound to real test environments and commits.",
            )}
          </p>
        </section>

        <section className="section soft-section">
          <div className="container">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">EXPLORE BY TASK</span>
                <h2>{t("从你要完成的任务开始", "Start from the task at hand")}</h2>
              </div>
            </div>
            <div className="category-grid">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  className="category-card"
                  onClick={() => go(searchHref({ category }))}
                >
                  <span className={`category-icon ${categoryMeta[category].tone}`}>
                    <Icon name={categoryMeta[category].icon} size={22} />
                  </span>
                  <span>
                    <strong>{l(category)}</strong>
                    <small>
                      {catalogCounts[category]} {t("个 Skills", "Skills")}
                    </small>
                  </span>
                  <Icon name="chevron" size={17} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="trust-panel">
            <div className="trust-copy">
              <span className="section-kicker">BEFORE YOU INSTALL</span>
              <h2>
                {t("先了解它会做什么，再决定是否安装", "Know what it does before you install")}
              </h2>
              <p>
                {t(
                  "awskill 将复杂的权限和风险转化成清晰、可执行的中文说明。安全等级不是一个模糊分数，每个结论都有原因。",
                  "awskill turns complex permissions and risks into clear, actionable explanations. A risk level is never a vague score—every conclusion comes with a reason.",
                )}
              </p>
              <button className="secondary" onClick={() => go("/reviews?section=method")}>
                {t("了解评测标准", "How we review")} <Icon name="arrow" size={17} />
              </button>
            </div>
            <button className="trust-card" onClick={() => go(skillHref(sample.id))}>
              <div className="trust-card-top">
                <span className="shield-icon">
                  <Icon name="shield" size={23} />
                </span>
                <div>
                  <span>{t("示例安全摘要", "Sample security summary")}</span>
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
                  {t("自动扫描 + 人工复核", "Automated scan + manual review")} · Commit{" "}
                  {sample.verifiedCommit}
                </span>
                <span>
                  {t("验证于", "Verified")} {ago(lastVerifiedDays(sample))}
                </span>
              </div>
            </button>
          </div>
        </section>
      </main>
  );
}


