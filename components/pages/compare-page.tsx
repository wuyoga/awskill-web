"use client";

import { type CSSProperties } from "react";
import {
  AGENTS,
  isStale,
  lastVerifiedDays,
  permissionLevel,
  type Skill,
} from "@/lib/data";
import { compareHref, skillHref } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/use-data";
import { type AppActions } from "@/components/shared";
import { compatTone, Icon, SearchableSkillSelect } from "@/components/ui";

type Cell = { text: string; tone?: "good" | "warn" | "bad" | "muted" };

function levelTone(level: string): Cell["tone"] {
  if (level === "未发现") return "good";
  if (level === "需要") return "warn";
  if (level === "待评估") return "muted";
  return undefined;
}

export function ComparePage({ actions }: { actions: AppActions }) {
  const { go, compareIds, toggleCompare } = actions;
  const { t, l, ago, list } = useI18n();
  const { skills, getSkill, reviewsForSkill } = useData();
  const visible = compareIds.map((id) => getSkill(id)).filter((s): s is Skill => Boolean(s));
  const canAdd = visible.length < 3;
  const columns = visible.length + (canAdd ? 1 : 0);
  const candidates = skills.filter((skill) => !compareIds.includes(skill.id));

  function verdictCell(skill: Skill): Cell {
    const verdict = reviewsForSkill(skill.id)[0]?.runs[skill.id]?.verdict;
    if (!verdict) return { text: t("暂无评测", "No review"), tone: "muted" };
    return { text: l(verdict), tone: verdict === "推荐" ? "good" : "warn" };
  }
  function permissionCell(skill: Skill, label: string): Cell {
    const level = permissionLevel(skill, label);
    return { text: l(level), tone: levelTone(level) };
  }

  const basics = t("基本信息", "Basics");
  const verification = t("验证", "Verification");
  const compatibility = t("兼容性", "Compatibility");
  const safety = t("安全与要求", "Security & requirements");
  const rows: { group: string; label: string; cell: (skill: Skill) => Cell }[] = [
    {
      group: basics,
      label: t("来源仓库", "Repository"),
      cell: (s) => ({ text: `${s.owner}/${s.repo}` }),
    },
    { group: basics, label: t("分类", "Category"), cell: (s) => ({ text: l(s.category) }) },
    {
      group: basics,
      label: t("输出格式", "Output"),
      cell: (s) => ({ text: list(s.outputs.map(l)) }),
    },
    {
      group: verification,
      label: t("验证状态", "Status"),
      cell: (s) => ({
        text: l(s.status),
        tone: s.status === "任务已实测" ? "good" : s.status === "待验证" ? "muted" : undefined,
      }),
    },
    { group: verification, label: t("任务表现", "Task result"), cell: verdictCell },
    {
      group: verification,
      label: t("最近验证", "Last verified"),
      cell: (s) => ({ text: ago(lastVerifiedDays(s)) }),
    },
    {
      group: verification,
      label: t("来源更新", "Source updated"),
      cell: (s) =>
        isStale(s) && s.verifiedCommit !== "—"
          ? {
              text: `${ago(s.sourceUpdatedDaysAgo)} · ${t("结论待复核", "under review")}`,
              tone: "warn",
            }
          : { text: ago(s.sourceUpdatedDaysAgo) },
    },
    ...AGENTS.map((agent) => ({
      group: compatibility,
      label: agent,
      cell: (s: Skill): Cell => ({
        text: l(s.compat[agent].status),
        tone: compatTone(s.compat[agent].status),
      }),
    })),
    {
      group: safety,
      label: t("安全等级", "Risk level"),
      cell: (s) => ({
        text: l(s.risk),
        tone: s.risk === "低风险" ? "good" : s.risk === "中风险" ? "warn" : "muted",
      }),
    },
    { group: safety, label: l("执行 Shell"), cell: (s) => permissionCell(s, "执行 Shell") },
    { group: safety, label: l("访问网络"), cell: (s) => permissionCell(s, "访问网络") },
    {
      group: safety,
      label: t("需要 API Key", "API key"),
      cell: (s) =>
        s.needsApiKey
          ? { text: t("需要", "Required"), tone: "warn" }
          : { text: t("不需要", "Not needed"), tone: "good" },
    },
  ];

  return (
    <main className="compare-page container">
      <div className="breadcrumb">
        <button onClick={() => go("/skills")}>{t("发现 Skill", "Discover")}</button>
        <Icon name="chevron" size={13} />
        <strong>{t("对比", "Compare")}</strong>
      </div>
      <div className="page-title">
        <span className="section-kicker">COMPARE</span>
        <h1>{t("选择更适合你的 Skill", "Pick the Skill that fits")}</h1>
      </div>
      {visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="plus" size={25} />
          </span>
          <h3>{t("还没有加入对比的 Skill", "Nothing to compare yet")}</h3>
          <p>
            {t(
              "在列表或详情页点击“对比”，最多可同时对比 3 个。",
              "Tap “Compare” on a list or detail page. Up to 3 at once.",
            )}
          </p>
          <button className="secondary" onClick={() => go("/skills")}>
            {t("去发现 Skill", "Discover Skills")}
          </button>
        </div>
      ) : (
        <div className="compare-table-wrap">
          <div className="compare-head" style={{ "--columns": columns } as CSSProperties}>
            <div className="compare-label-cell">{t("对比项目", "Criteria")}</div>
            {visible.map((skill) => (
              <div className="compare-skill-head" key={skill.id}>
                <button
                  className="remove-compare"
                  onClick={() => toggleCompare(skill.id)}
                  aria-label={t(`将 ${skill.name} 移出对比`, `Remove ${skill.name}`)}
                >
                  <Icon name="x" size={15} />
                </button>
                <span className={`skill-icon ${skill.tone}`}>
                  <Icon name={skill.icon} size={21} />
                </span>
                <strong>{skill.name}</strong>
                <small>
                  {skill.owner}/{skill.repo}
                </small>
                <button className="primary small" onClick={() => go(skillHref(skill.id))}>
                  {t("查看详情", "Details")}
                </button>
              </div>
            ))}
            {canAdd && (
              <div className="compare-skill-head add-slot">
                <span className="skill-icon slate">
                  <Icon name="plus" size={21} />
                </span>
                <strong>{t("添加 Skill", "Add a Skill")}</strong>
                <small>
                  {visible.length < 2
                    ? t("至少需要 2 个才能对比", "Add at least 2 to compare")
                    : t("还可以添加 1 个", "1 more slot")}
                </small>
                <SearchableSkillSelect
                  skills={candidates}
                  onSelect={toggleCompare}
                  ariaLabel={t("选择要加入对比的 Skill", "Choose a Skill to compare")}
                  placeholder={t("选择 Skill…", "Choose…")}
                  searchPlaceholder={t("搜索名称或仓库", "Search name or repo")}
                  emptyLabel={t("无匹配 Skill", "No matching Skills")}
                />
              </div>
            )}
          </div>
          <div className="compare-body">
            {rows.map((row, index) => (
              <div key={row.label}>
                {(index === 0 || rows[index - 1].group !== row.group) && (
                  <div className="compare-group">{row.group}</div>
                )}
                <div
                  className="compare-row"
                  style={{ "--columns": columns } as CSSProperties}
                >
                  <strong>{row.label}</strong>
                  {visible.map((skill) => {
                    const cell = row.cell(skill);
                    return (
                      <span key={skill.id} className={cell.tone ?? ""}>
                        {cell.tone === "good" && <Icon name="check" size={14} />}
                        {cell.tone === "warn" && <Icon name="warning" size={14} />}
                        {cell.text}
                      </span>
                    );
                  })}
                  {canAdd && <span className="muted">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="compare-tip">
        <Icon name="shield" size={19} />
        <div>
          <strong>{t("如何理解对比结果？", "How to read this")}</strong>
          <p>
            {t(
              "中风险不等于不安全，它通常表示 Skill 需要执行命令、修改文件或访问网络。安装前请查看具体权限原因。",
              "Medium risk doesn't mean unsafe—it usually means the Skill runs commands, edits files or uses the network. Check the reasons before installing.",
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

export function CompareDock({ actions }: { actions: AppActions }) {
  const { compareIds, go, toggleCompare } = actions;
  const { t } = useI18n();
  if (!compareIds.length) return null;
  return (
    <div className="compare-dock" role="region" aria-label={t("对比栏", "Compare tray")}>
      <div>
        <span className="compare-count">{compareIds.length}</span>
        <span>{t("已加入对比", "In compare")}</span>
        <small>
          {compareIds.join(", ")} · {t("最多 3 个", "max 3")}
        </small>
      </div>
      <div className="dock-actions">
        <button className="text-button" onClick={() => compareIds.forEach(toggleCompare)}>
          {t("清空", "Clear")}
        </button>
        <button
          className="primary"
          disabled={compareIds.length < 2}
          onClick={() => go(compareHref(compareIds))}
        >
          {t("开始对比", "Compare")} <Icon name="arrow" size={17} />
        </button>
      </div>
    </div>
  );
}



export function NotFound({ go }: { go: (href: string) => void }) {
  const { t } = useI18n();
  return (
    <main className="container empty-state not-found">
      <span className="empty-icon">
        <Icon name="search" size={25} />
      </span>
      <h3>{t("页面不存在", "Page not found")}</h3>
      <p>
        {t(
          "链接可能已失效，或该 Skill 已被下架。",
          "The link may be broken, or the Skill has been removed.",
        )}
      </p>
      <button className="secondary" onClick={() => go("/skills")}>
        {t("返回发现 Skill", "Back to Discover")}
      </button>
    </main>
  );
}


