"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AGENTS,
  type AgentName,
  CATEGORIES,
  type Category,
  OUTPUT_FORMATS,
  type OutputFormat,
  type RiskLevel,
  type VerifyStatus,
} from "@/lib/data";
import type { SkillQueryResult } from "@/lib/data/skill-result";
import { useRouter } from "@/i18n/navigation";
import { parseCsvParam, SEARCH_PAGE_MAX, SEARCH_PAGE_SIZE, searchHref, skillHref } from "@/lib/routes";
import { stripLocale, type Locale } from "@/i18n/locale";
import { useEnumLabel } from "@/i18n/format";
import { type AppActions, type Route } from "@/components/shared";
import { Icon, MenuSelect, SkillCard } from "@/components/ui";

const STATUS_OPTIONS: VerifyStatus[] = ["任务已实测", "安装已验证", "待验证"];
const RISK_OPTIONS: RiskLevel[] = ["低风险", "中风险", "未评估"];
const REQUIREMENTS = ["无需 API Key", "免费使用", "无需执行 Shell", "无需访问网络"] as const;
type Requirement = (typeof REQUIREMENTS)[number];
const SORTS = ["综合推荐", "最近验证", "最多使用", "最新收录"] as const;
type Sort = (typeof SORTS)[number];

function toggleIn<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
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

export function SearchPage({
  route,
  actions,
  result,
}: {
  route: Route;
  actions: AppActions;
  result: SkillQueryResult;
}) {
  const { go, compareIds, toggleCompare } = actions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = useLocale() as Locale;
  const t = useTranslations("skills");
  const l = useEnumLabel();
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
    filterKnown(parseCsvParam(route.params, "req"), REQUIREMENTS),
  );
  const [outputs, setOutputs] = useState<OutputFormat[]>(() =>
    filterKnown(parseCsvParam(route.params, "out"), OUTPUT_FORMATS),
  );
  const [sort, setSort] = useState<Sort>(() => parseSearchSort(route.params));
  const [filterOpen, setFilterOpen] = useState(false);

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
      filterKnown(parseCsvParam(route.params, "req"), REQUIREMENTS),
    );
    setOutputs(filterKnown(parseCsvParam(route.params, "out"), OUTPUT_FORMATS));
    setSort(parseSearchSort(route.params));
  }, [route.page, paramsKey]);

  useEffect(() => {
    if (route.page !== "search") return;
    // next-intl router expects locale-free paths; barePath avoids locale thrash.
    const barePath = stripLocale(pathname);
    const next = searchHref({
      q: query,
      category,
      agent,
      status: statuses,
      risk: risks,
      req: requirements,
      out: outputs,
      sort,
    });
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("limit");
    const currentQs = currentParams.toString();
    const current = `${barePath}${currentQs ? `?${currentQs}` : ""}`;
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
    pathname,
    searchParams,
    router,
  ]);

  const {
    items: visibleSkills,
    total,
    poolTotal,
    categoryCounts,
    catalogTotal,
    limit,
  } = result;
  const hasMore = visibleSkills.length < total;

  const chips: { label: string; clear: () => void }[] = [
    ...(query ? [{ label: `“${query}”`, clear: () => setQuery("") }] : []),
    ...(category !== "全部" ? [{ label: l(category), clear: () => setCategory("全部") }] : []),
    ...(agent !== "全部"
      ? [{ label: t("worksWithAgent", { agent }), clear: () => setAgent("全部") }]
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
      label: t("outputPrefix", {
        format: lang === "zh" ? item : l(item).toLowerCase(),
      }),
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
          <h1>{t("title")}</h1>
        </div>
        <div className="search-toolbar">
          <div className="search-field">
            <Icon name="search" size={19} />
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchAriaLabel")}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label={t("clearSearch")}>
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
          <button
            className="filter-trigger"
            onClick={() => setFilterOpen(!filterOpen)}
            aria-expanded={filterOpen}
          >
            <Icon name="filter" size={18} /> {t("filters")}
            {filterCount > 0 && <span className="header-count">{filterCount}</span>}
          </button>
        </div>
      </div>
      <div className="search-layout">
        {filterOpen && (
          <button
            className="sheet-scrim"
            aria-label={t("closeFilters")}
            onClick={() => setFilterOpen(false)}
          />
        )}
        <aside
          className={filterOpen ? "filters open" : "filters"}
          aria-label={t("filterConditions")}
        >
          <div className="sheet-head">
            <strong>{t("filters")}</strong>
            <button
              className="icon-button"
              onClick={() => setFilterOpen(false)}
              aria-label={t("closeFilters")}
            >
              <Icon name="x" size={17} />
            </button>
          </div>
          <div className="sheet-body">
            <div className="filter-group category-filter-group">
              <div className="filter-label">{t("category")}</div>
              {(["全部", ...CATEGORIES] as const).map((item) => (
                <button
                  key={item}
                  className={`category-filter ${category === item ? "active" : ""}`}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  <span>{item === "全部" ? t("allSkills") : l(item)}</span>
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
                  <span>{item === "全部" ? t("allAgents") : item}</span>
                </label>
              ))}
            </fieldset>
            {checkboxGroup(t("verification"), STATUS_OPTIONS, statuses, setStatuses)}
            {checkboxGroup(t("riskLevel"), RISK_OPTIONS, risks, setRisks)}
            {checkboxGroup(
              t("requirements"),
              REQUIREMENTS,
              requirements,
              setRequirements,
            )}
            {checkboxGroup(t("outputFormat"), OUTPUT_FORMATS, outputs, setOutputs)}
          </div>
          <div className="sheet-foot">
            <button className="secondary" onClick={clearAll}>
              {t("clear")}
            </button>
            <button className="primary" onClick={() => setFilterOpen(false)}>
              {t("showResults", { count: total })}
            </button>
          </div>
        </aside>
        <section className="results" aria-live="polite">
          <div className="results-top">
            <span>
              {total
                ? t("showingResults", {
                    visible: visibleSkills.length,
                    total,
                    catalog: catalogTotal,
                  })
                : t("zeroResults", { catalog: catalogTotal })}
            </span>
            <MenuSelect
              className="sort-select"
              value={sort}
              options={SORTS}
              onChange={setSort}
              ariaLabel={t("sort")}
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
                {t("clearAll")}
              </button>
            </div>
          )}
          {total ? (
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
                      router.replace(
                        searchHref({
                          q: query,
                          category,
                          agent,
                          status: statuses,
                          risk: risks,
                          req: requirements,
                          out: outputs,
                          sort,
                          limit: Math.min(SEARCH_PAGE_MAX, limit + SEARCH_PAGE_SIZE),
                        }),
                        { scroll: false },
                      )
                    }
                  >
                    {t("loadMore", { remaining: total - visibleSkills.length })}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="search" size={25} />
              </span>
              <h3>{t("noExactMatches")}</h3>
              <p>{t("tryShorterQuery")}</p>
              <button className="secondary" onClick={clearAll}>
                {t("clearAllFilters")}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}