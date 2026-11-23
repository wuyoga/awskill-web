"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AGENTS,
  type AgentName,
  CATEGORIES,
  type Category,
  catalogCounts,
  lastVerifiedDays,
  needsNetwork,
  needsShell,
  OUTPUT_FORMATS,
  type OutputFormat,
  type RiskLevel,
  type Skill,
  type VerifyStatus,
} from "@/lib/data";
import { localized, parseCsvParam, searchHref, skillHref } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { searchIndex, useData } from "@/lib/use-data";
import { type AppActions, type Route } from "@/components/shared";
import { Icon, MenuSelect, SkillCard } from "@/components/ui";

const SEARCH_PAGE_SIZE = 24;

const STATUS_OPTIONS: VerifyStatus[] = ["任务已实测", "安装已验证", "待验证"];
const RISK_OPTIONS: RiskLevel[] = ["低风险", "中风险", "未评估"];
const REQUIREMENTS = {
  "无需 API Key": (skill: Skill) => !skill.needsApiKey,
  免费使用: (skill: Skill) => !skill.paid,
  "无需执行 Shell": (skill: Skill) => !needsShell(skill),
  无需访问网络: (skill: Skill) => !needsNetwork(skill),
} as const;
type Requirement = keyof typeof REQUIREMENTS;
const SORTS = ["综合推荐", "最近验证", "最多使用", "最新收录"] as const;
type Sort = (typeof SORTS)[number];

function toggleIn<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function matchesQuery(skill: Skill, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = searchIndex[skill.id] ?? "";
  return (
    haystack.includes(normalized) ||
    normalized.split(/\s+/).every((token) => haystack.includes(token))
  );
}

const STATUS_RANK: Record<VerifyStatus, number> = { 任务已实测: 0, 安装已验证: 1, 待验证: 2 };

function sortSkills(list: Skill[], sort: Sort) {
  const copy = [...list];
  if (sort === "最近验证")
    return copy.sort((a, b) => (lastVerifiedDays(a) ?? 1e9) - (lastVerifiedDays(b) ?? 1e9));
  if (sort === "最多使用") return copy.sort((a, b) => b.installs - a.installs);
  if (sort === "最新收录") return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return copy.sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      RISK_OPTIONS.indexOf(a.risk) - RISK_OPTIONS.indexOf(b.risk) ||
      b.installs - a.installs,
  );
}

function parseSearchCategory(params: URLSearchParams): Category | "全部" {
  const value = params.get("category");
  return CATEGORIES.includes(value as Category) ? (value as Category) : "全部";
}

function parseSearchAgent(params: URLSearchParams): AgentName | "全部" {
  const value = params.get("agent");
  return AGENTS.includes(value as AgentName) ? (value as AgentName) : "全部";
}

function parseSearchSort(params: URLSearchParams): Sort {
  const value = params.get("sort");
  return SORTS.includes(value as Sort) ? (value as Sort) : "综合推荐";
}

function filterKnown<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((item): item is T => (allowed as readonly string[]).includes(item));
}

export function SearchPage({ route, actions }: { route: Route; actions: AppActions }) {
  const { go, compareIds, toggleCompare } = actions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, l, lang } = useI18n();
  const { skills } = useData();
  const paramsKey = route.params.toString();
  const [query, setQuery] = useState(route.params.get("q") ?? "");
  const [category, setCategory] = useState<Category | "全部">(() => parseSearchCategory(route.params));
  const [agent, setAgent] = useState<AgentName | "全部">(() => parseSearchAgent(route.params));
  const [statuses, setStatuses] = useState<VerifyStatus[]>(() =>
    filterKnown(parseCsvParam(route.params, "status"), STATUS_OPTIONS),
  );
  const [risks, setRisks] = useState<RiskLevel[]>(() =>
    filterKnown(parseCsvParam(route.params, "risk"), RISK_OPTIONS),
  );
  const [requirements, setRequirements] = useState<Requirement[]>(() =>
    filterKnown(parseCsvParam(route.params, "req"), Object.keys(REQUIREMENTS) as Requirement[]),
  );
  const [outputs, setOutputs] = useState<OutputFormat[]>(() =>
    filterKnown(parseCsvParam(route.params, "out"), OUTPUT_FORMATS),
  );
  const [sort, setSort] = useState<Sort>(() => parseSearchSort(route.params));
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);

  useEffect(() => {
    document.body.classList.toggle("sheet-open", filterOpen);
    return () => document.body.classList.remove("sheet-open");
  }, [filterOpen]);

  useEffect(() => {
    if (route.page !== "search") return;
    setQuery(route.params.get("q") ?? "");
    setCategory(parseSearchCategory(route.params));
    setAgent(parseSearchAgent(route.params));
    setStatuses(filterKnown(parseCsvParam(route.params, "status"), STATUS_OPTIONS));
    setRisks(filterKnown(parseCsvParam(route.params, "risk"), RISK_OPTIONS));
    setRequirements(
      filterKnown(parseCsvParam(route.params, "req"), Object.keys(REQUIREMENTS) as Requirement[]),
    );
    setOutputs(filterKnown(parseCsvParam(route.params, "out"), OUTPUT_FORMATS));
    setSort(parseSearchSort(route.params));
  }, [route.page, paramsKey]);

  useEffect(() => {
    if (route.page !== "search") return;
    const next = localized(
      lang,
      searchHref({
        q: query,
        category,
        agent,
        status: statuses,
        risk: risks,
        req: requirements,
        out: outputs,
        sort,
      }),
    );
    const qs = searchParams.toString();
    const current = `${pathname}${qs ? `?${qs}` : ""}`;
    if (current === next) return;
    router.replace(next, { scroll: false });
  }, [
    route.page,
    query,
    category,
    agent,
    statuses,
    risks,
    requirements,
    outputs,
    sort,
    lang,
    pathname,
    searchParams,
    router,
  ]);

  const matches = useCallback(
    (skill: Skill, ignoreCategory = false) =>
      matchesQuery(skill, query) &&
      (ignoreCategory || category === "全部" || skill.category === category) &&
      (agent === "全部" || skill.compat[agent].status !== "未验证") &&
      (!statuses.length || statuses.includes(skill.status)) &&
      (!risks.length || risks.includes(skill.risk)) &&
      requirements.every((item) => REQUIREMENTS[item](skill)) &&
      (!outputs.length || outputs.some((item) => skill.outputs.includes(item))),
    [query, category, agent, statuses, risks, requirements, outputs],
  );

  const filtered = useMemo(
    () =>
      sortSkills(
        skills.filter((skill) => matches(skill)),
        sort,
      ),
    [skills, matches, sort],
  );

  useEffect(() => {
    setVisibleCount(SEARCH_PAGE_SIZE);
  }, [query, category, agent, statuses, risks, requirements, outputs, sort]);

  const visibleSkills = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const categoryCounts = useMemo(() => {
    const pool = skills.filter((skill) => matches(skill, true));
    return Object.fromEntries(
      CATEGORIES.map((item) => [item, pool.filter((skill) => skill.category === item).length]),
    ) as Record<Category, number>;
  }, [skills, matches]);
  const poolTotal = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0);
  const catalogTotal = Object.values(catalogCounts).reduce((a, b) => a + b, 0);

  const chips: { label: string; clear: () => void }[] = [
    ...(query ? [{ label: `“${query}”`, clear: () => setQuery("") }] : []),
    ...(category !== "全部" ? [{ label: l(category), clear: () => setCategory("全部") }] : []),
    ...(agent !== "全部"
      ? [{ label: t(`兼容 ${agent}`, `Works with ${agent}`), clear: () => setAgent("全部") }]
      : []),
    ...statuses.map((item) => ({
      label: l(item),
      clear: () => setStatuses(toggleIn(statuses, item)),
    })),
    ...risks.map((item) => ({ label: l(item), clear: () => setRisks(toggleIn(risks, item)) })),
    ...requirements.map((item) => ({
      label: l(item),
      clear: () => setRequirements(toggleIn(requirements, item)),
    })),
    ...outputs.map((item) => ({
      label: t(`输出${item}`, `Outputs ${l(item).toLowerCase()}`),
      clear: () => setOutputs(toggleIn(outputs, item)),
    })),
  ];
  const filterCount = chips.length - (query ? 1 : 0);

  function clearAll() {
    setQuery("");
    setCategory("全部");
    setAgent("全部");
    setStatuses([]);
    setRisks([]);
    setRequirements([]);
    setOutputs([]);
  }

  function checkboxGroup<T extends string>(
    title: string,
    options: readonly T[],
    selected: T[],
    set: (next: T[]) => void,
  ) {
    return (
      <fieldset className="filter-group">
        <legend className="filter-label">{title}</legend>
        {options.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => set(toggleIn(selected, item))}
            />
            <span>{l(item)}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <main className="search-page container">
      <div className="search-page-head">
        <div className="page-title">
          <span className="section-kicker">DISCOVER</span>
          <h1>{t("发现值得安装的 Skill", "Discover Skills worth installing")}</h1>
        </div>
        <div className="search-toolbar">
          <div className="search-field">
            <Icon name="search" size={19} />
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("搜索 Skill 或任务", "Search Skills or tasks")}
              aria-label={t("搜索 Skill 或任务", "Search Skills or tasks")}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label={t("清空搜索", "Clear search")}>
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
          <button
            className="filter-trigger"
            onClick={() => setFilterOpen(!filterOpen)}
            aria-expanded={filterOpen}
          >
            <Icon name="filter" size={18} /> {t("筛选", "Filters")}
            {filterCount > 0 && <span className="header-count">{filterCount}</span>}
          </button>
        </div>
      </div>
      <div className="search-layout">
        {filterOpen && (
          <button
            className="sheet-scrim"
            aria-label={t("关闭筛选", "Close filters")}
            onClick={() => setFilterOpen(false)}
          />
        )}
        <aside
          className={filterOpen ? "filters open" : "filters"}
          aria-label={t("筛选条件", "Filters")}
        >
          <div className="sheet-head">
            <strong>{t("筛选", "Filters")}</strong>
            <button
              className="icon-button"
              onClick={() => setFilterOpen(false)}
              aria-label={t("关闭筛选", "Close filters")}
            >
              <Icon name="x" size={17} />
            </button>
          </div>
          <div className="sheet-body">
            <div className="filter-group category-filter-group">
              <div className="filter-label">{t("分类", "Category")}</div>
              {(["全部", ...CATEGORIES] as const).map((item) => (
                <button
                  key={item}
                  className={`category-filter ${category === item ? "active" : ""}`}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  <span>{item === "全部" ? t("全部 Skills", "All Skills") : l(item)}</span>
                  <small>{item === "全部" ? poolTotal : categoryCounts[item]}</small>
                </button>
              ))}
            </div>
            <fieldset className="filter-group">
              <legend className="filter-label">Agent</legend>
              {(["全部", ...AGENTS] as const).map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="agent"
                    checked={agent === item}
                    onChange={() => setAgent(item)}
                  />
                  <span>{item === "全部" ? t("全部 Agent", "All Agents") : item}</span>
                </label>
              ))}
            </fieldset>
            {checkboxGroup(t("验证状态", "Verification"), STATUS_OPTIONS, statuses, setStatuses)}
            {checkboxGroup(t("安全等级", "Risk level"), RISK_OPTIONS, risks, setRisks)}
            {checkboxGroup(
              t("使用要求", "Requirements"),
              Object.keys(REQUIREMENTS) as Requirement[],
              requirements,
              setRequirements,
            )}
            {checkboxGroup(t("输出格式", "Output format"), OUTPUT_FORMATS, outputs, setOutputs)}
          </div>
          <div className="sheet-foot">
            <button className="secondary" onClick={clearAll}>
              {t("清除", "Clear")}
            </button>
            <button className="primary" onClick={() => setFilterOpen(false)}>
              {t(`查看 ${filtered.length} 个结果`, `Show ${filtered.length} results`)}
            </button>
          </div>
        </aside>
        <section className="results" aria-live="polite">
          <div className="results-top">
            <span>
              {filtered.length
                ? t(
                    `已显示 ${visibleSkills.length} / ${filtered.length} · 目录 ${catalogTotal}`,
                    `Showing ${visibleSkills.length} / ${filtered.length} · catalog ${catalogTotal}`,
                  )
                : t(
                    `0 个结果 · 目录共 ${catalogTotal} 个`,
                    `0 results · ${catalogTotal} in catalog`,
                  )}
            </span>
            <MenuSelect
              className="sort-select"
              value={sort}
              options={SORTS}
              onChange={setSort}
              ariaLabel={t("排序", "Sort")}
              getLabel={(item) => l(item)}
            />
          </div>
          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map((chip) => (
                <button key={chip.label} onClick={chip.clear}>
                  {chip.label} <Icon name="x" size={12} />
                </button>
              ))}
              <button className="clear-all" onClick={clearAll}>
                {t("清除全部", "Clear all")}
              </button>
            </div>
          )}
          {filtered.length ? (
            <>
              <div className="result-list">
                {visibleSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    selected={compareIds.includes(skill.id)}
                    onOpen={() => go(skillHref(skill.id))}
                    onCompare={() => toggleCompare(skill.id)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="results-more">
                  <button
                    className="secondary"
                    onClick={() =>
                      setVisibleCount((count) => Math.min(count + SEARCH_PAGE_SIZE, filtered.length))
                    }
                  >
                    {t(
                      `加载更多（剩余 ${filtered.length - visibleSkills.length}）`,
                      `Load more (${filtered.length - visibleSkills.length} left)`,
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="search" size={25} />
              </span>
              <h3>{t("没有找到完全匹配的 Skill", "No exact matches")}</h3>
              <p>
                {t(
                  "试试更简短的任务描述，或清除部分筛选条件。",
                  "Try a shorter task description or clear some filters.",
                )}
              </p>
              <button className="secondary" onClick={clearAll}>
                {t("清除全部条件", "Clear all filters")}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
