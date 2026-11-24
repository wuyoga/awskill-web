"use client";

import { type CSSProperties, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AGENTS,
  isStale,
  lastVerifiedDays,
  permissionLevel,
  type Skill,
} from "@/lib/data";
import { compareHref, skillHref } from "@/lib/routes";
import { useEnumLabel, useI18nFormat } from "@/i18n/format";
import { suggestSkills } from "@/lib/data/suggest";
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

export function ComparePage({
  actions,
  urlIds = [],
  compared = [],
}: {
  actions: AppActions;
  /** Skills from `?skills=` — used when context has not hydrated yet. */
  urlIds?: string[];
  /** Resolved rows for the URL selection. Picker results fill anything not here yet. */
  compared?: Skill[];
}) {
  const { go, compareIds, compareHydrated, toggleCompare } = actions;
  const t = useTranslations("compare");
  const l = useEnumLabel();
  const { ago, list } = useI18nFormat();
  const { reviewsForSkill } = useData();
  const [picked, setPicked] = useState<Skill[]>([]);
  // Before hydrate, show share-link ids to avoid an empty flash; after that, state wins.
  const activeIds = compareHydrated ? compareIds : urlIds.length > 0 ? urlIds : compareIds;
  const visible = useMemo(() => {
    const byId = new Map<string, Skill>();
    for (const skill of picked) byId.set(skill.id, skill);
    for (const skill of compared) byId.set(skill.id, skill);
    return activeIds.flatMap((id) => {
      const skill = byId.get(id);
      return skill ? [skill] : [];
    });
  }, [activeIds, compared, picked]);
  const canAdd = visible.length < 3;
  const columns = visible.length + (canAdd ? 1 : 0);
  const excludeKey = activeIds.join(",");
  const loadOptions = useCallback(
    (query: string) => suggestSkills(query, excludeKey ? excludeKey.split(",") : []),
    [excludeKey],
  );

  function verdictCell(skill: Skill): Cell {
    const verdict = reviewsForSkill(skill.id)[0]?.runs[skill.id]?.verdict;
    if (!verdict) return { text: t("noReview"), tone: "muted" };
    return { text: l(verdict), tone: verdict === "推荐" ? "good" : "warn" };
  }
  function permissionCell(skill: Skill, label: string): Cell {
    const level = permissionLevel(skill, label);
    return { text: l(level), tone: levelTone(level) };
  }

  const basics = t("groups.basics");
  const verification = t("groups.verification");
  const compatibility = t("groups.compatibility");
  const safety = t("groups.safety");
  const rows: { group: string; label: string; cell: (skill: Skill) => Cell }[] = [
    {
      group: basics,
      label: t("rows.repository"),
      cell: (s) => ({ text: `${s.owner}/${s.repo}` }),
    },
    { group: basics, label: t("rows.category"), cell: (s) => ({ text: l(s.category) }) },
    {
      group: basics,
      label: t("rows.output"),
      cell: (s) => ({ text: list(s.outputs.map(l)) }),
    },
    {
      group: verification,
      label: t("rows.status"),
      cell: (s) => ({
        text: l(s.status),
        tone: s.status === "任务已实测" ? "good" : s.status === "待验证" ? "muted" : undefined,
      }),
    },
    { group: verification, label: t("rows.taskResult"), cell: verdictCell },
    {
      group: verification,
      label: t("rows.lastVerified"),
      cell: (s) => ({ text: ago(lastVerifiedDays(s)) }),
    },
    {
      group: verification,
      label: t("rows.sourceUpdated"),
      cell: (s) =>
        isStale(s) && s.verifiedCommit !== "—"
          ? {
              text: `${ago(s.sourceUpdatedDaysAgo)} · ${t("rows.underReview")}`,
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
      label: t("rows.riskLevel"),
      cell: (s) => ({
        text: l(s.risk),
        tone: s.risk === "低风险" ? "good" : s.risk === "中风险" ? "warn" : "muted",
      }),
    },
    { group: safety, label: l("执行 Shell"), cell: (s) => permissionCell(s, "执行 Shell") },
    { group: safety, label: l("访问网络"), cell: (s) => permissionCell(s, "访问网络") },
    {
      group: safety,
      label: t("rows.apiKey"),
      cell: (s) =>
        s.needsApiKey
          ? { text: t("rows.required"), tone: "warn" }
          : { text: t("rows.notNeeded"), tone: "good" },
    },
  ];

  return (
    <main className="compare-page container">
      <div className="breadcrumb">
        <button onClick={() => go("/skills")}>{t("breadcrumb.discover")}</button>
        <Icon name="chevron" size={13} />
        <strong>{t("breadcrumb.compare")}</strong>
      </div>
      <div className="page-title">
        <span className="section-kicker">COMPARE</span>
        <h1>{t("title")}</h1>
      </div>
      {visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="plus" size={25} />
          </span>
          <h3>{t("empty.title")}</h3>
          <p>{t("empty.body")}</p>
          <button className="secondary" onClick={() => go("/skills")}>
            {t("empty.discoverCta")}
          </button>
        </div>
      ) : (
        <div className="compare-table-wrap">
          <div className="compare-head" style={{ "--columns": columns } as CSSProperties}>
            <div className="compare-label-cell">{t("criteria")}</div>
            {visible.map((skill) => (
              <div className="compare-skill-head" key={skill.id}>
                <button
                  className="remove-compare"
                  onClick={() => toggleCompare(skill.id)}
                  aria-label={t("removeSkill", { name: skill.name })}
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
                  {t("details")}
                </button>
              </div>
            ))}
            {canAdd && (
              <div className="compare-skill-head add-slot">
                <span className="skill-icon slate">
                  <Icon name="plus" size={21} />
                </span>
                <strong>{t("addSkill")}</strong>
                <small>
                  {visible.length < 2 ? t("needAtLeastTwo") : t("oneMoreSlot")}
                </small>
                <SearchableSkillSelect
                  loadOptions={loadOptions}
                  onPick={(skill) =>
                    setPicked((prev) =>
                      prev.some((item) => item.id === skill.id) ? prev : [...prev, skill],
                    )
                  }
                  onSelect={toggleCompare}
                  ariaLabel={t("selectSkillAria")}
                  placeholder={t("selectPlaceholder")}
                  searchPlaceholder={t("searchPlaceholder")}
                  emptyLabel={t("noMatchingSkills")}
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
          <strong>{t("tip.title")}</strong>
          <p>{t("tip.body")}</p>
        </div>
      </div>
    </main>
  );
}

export function CompareDock({ actions }: { actions: AppActions }) {
  const { compareIds, go, toggleCompare } = actions;
  const t = useTranslations("compare");
  if (!compareIds.length) return null;
  return (
    <div className="compare-dock" role="region" aria-label={t("dock.ariaLabel")}>
      <div>
        <span className="compare-count">{compareIds.length}</span>
        <span>{t("dock.inCompare")}</span>
        <small>
          {compareIds.join(", ")} · {t("dock.maxThree")}
        </small>
      </div>
      <div className="dock-actions">
        <button className="text-button" onClick={() => compareIds.forEach(toggleCompare)}>
          {t("dock.clear")}
        </button>
        <button
          className="primary"
          disabled={compareIds.length < 2}
          onClick={() => go(compareHref(compareIds))}
        >
          {t("dock.startCompare")} <Icon name="arrow" size={17} />
        </button>
      </div>
    </div>
  );
}



export function NotFound({ go }: { go: (href: string) => void }) {
  const t = useTranslations("compare");
  return (
    <main className="container empty-state not-found">
      <span className="empty-icon">
        <Icon name="search" size={25} />
      </span>
      <h3>{t("notFound.title")}</h3>
      <p>{t("notFound.body")}</p>
      <button className="secondary" onClick={() => go("/skills")}>
        {t("notFound.backToDiscover")}
      </button>
    </main>
  );
}