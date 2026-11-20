import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AGENTS,
  type AgentName,
  BASELINE,
  CATEGORIES,
  type Category,
  catalogCounts,
  categoryMeta,
  installFor,
  isStale,
  lastVerifiedDays,
  needsNetwork,
  needsShell,
  OUTPUT_FORMATS,
  type OutputFormat,
  permissionLevel,
  type RiskLevel,
  type Skill,
  type VerifyStatus,
} from "./data";
import {
  AgentsPage,
  ReviewDetailPage,
  ReviewsPage,
  WorkflowDetailPage,
  WorkflowsPage,
} from "./hubs";
import { I18nProvider, type Lang, useI18n } from "./i18n";
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
  BrandMark,
  compatTone,
  CopyBlock,
  Icon,
  MenuSelect,
  Notice,
  RiskPill,
  SearchableSkillSelect,
  SkillCard,
  StatusPill,
} from "./ui";
import { searchIndex, useData } from "./useData";

/* ---------- Routing (hash based so links are shareable and Back works) ---------- */

function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const [page = "", id] = path.split("/").map(decodeURIComponent);
  return { page: page || "home", id, params: new URLSearchParams(query) };
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const SHORTCUT = isMac ? "⌘ K" : "Ctrl K";

/* ---------- Layout ---------- */

function Header({
  route,
  actions,
  dark,
  onToggleTheme,
}: {
  route: Route;
  actions: AppActions;
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const { go, soon, compareIds } = actions;
  const { t, lang, setLang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routeKey = `${route.page}/${route.id ?? ""}`;
  useEffect(() => setMobileOpen(false), [routeKey]);

  const section = ["search", "skill", "compare"].includes(route.page)
    ? "search"
    : route.page === "review"
      ? "reviews"
      : route.page === "workflow"
        ? "workflows"
        : route.page;
  const links: [string, string, string][] = [
    ["search", t("发现 Skill", "Discover"), "#/search"],
    ["reviews", t("评测", "Reviews"), "#/reviews"],
    ["workflows", t("工作流", "Workflows"), "#/workflows"],
    ["agents", "Agent", "#/agents"],
  ];
  function open(href: string) {
    setMobileOpen(false);
    go(href);
  }
  return (
    <header className={`site-header ${mobileOpen ? "menu-open" : ""}`}>
      <div className="header-inner">
        <button className="brand" onClick={() => open("#/")}>
          <BrandMark />
          <span>awskill</span>
        </button>
        <nav
          className={mobileOpen ? "nav-links open" : "nav-links"}
          aria-label={t("主导航", "Main")}
        >
          {links.map(([key, label, href]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              aria-current={section === key ? "page" : undefined}
              onClick={() => open(href)}
            >
              {label}
            </button>
          ))}
          <div className="mobile-menu-actions">
            <button className="secondary" onClick={() => soon("提交 Skill", "Submit a Skill")}>
              {t("提交 Skill", "Submit a Skill")}
            </button>
            <button className="primary" onClick={() => soon("登录", "Sign in")}>
              {t("登录", "Sign in")}
            </button>
          </div>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button lang-toggle"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            aria-label={t("Switch to English", "切换到中文")}
            title={t("Switch to English", "切换到中文")}
          >
            {lang === "zh" ? "EN" : "中"}
          </button>
          <button
            className="icon-button"
            onClick={onToggleTheme}
            aria-label={t("切换主题", "Toggle theme")}
          >
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <button
            className="text-button compare-link"
            onClick={() => open("#/compare")}
            aria-label={t(`对比（${compareIds.length}）`, `Compare (${compareIds.length})`)}
          >
            <span className="compare-link-label">{t("对比", "Compare")}</span>
            <Icon name="grid" size={17} />
            {compareIds.length > 0 && <span className="header-count">{compareIds.length}</span>}
          </button>
          <button
            className="text-button desktop-only"
            onClick={() => soon("提交 Skill", "Submit a Skill")}
          >
            {t("提交 Skill", "Submit a Skill")}
          </button>
          <button className="primary small desktop-only" onClick={() => soon("登录", "Sign in")}>
            {t("登录", "Sign in")}
          </button>
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("菜单", "Menu")}
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? "x" : "menu"} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <button
          className="menu-scrim"
          aria-label={t("关闭菜单", "Close menu")}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}

/* ---------- Home ---------- */

function HomePage({ actions }: { actions: AppActions }) {
  const { go, compareIds, toggleCompare } = actions;
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
    <>
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
              <kbd className="shortcut">{SHORTCUT}</kbd>
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
            <button className="link-button" onClick={() => go("#/search")}>
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
              <button className="secondary" onClick={() => go("#/reviews?section=method")}>
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
      <Footer actions={actions} />
    </>
  );
}

/* ---------- Search ---------- */

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

const SEARCH_PAGE_SIZE = 24;

function SearchPage({ route, actions }: { route: Route; actions: AppActions }) {
  const { go, compareIds, toggleCompare } = actions;
  const { t, l } = useI18n();
  const { skills } = useData();
  const initialCategory = route.params.get("category");
  const initialAgent = route.params.get("agent");
  const [query, setQuery] = useState(route.params.get("q") ?? "");
  const [category, setCategory] = useState<Category | "全部">(
    CATEGORIES.includes(initialCategory as Category) ? (initialCategory as Category) : "全部",
  );
  const [agent, setAgent] = useState<AgentName | "全部">(
    AGENTS.includes(initialAgent as AgentName) ? (initialAgent as AgentName) : "全部",
  );
  const [statuses, setStatuses] = useState<VerifyStatus[]>([]);
  const [risks, setRisks] = useState<RiskLevel[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [outputs, setOutputs] = useState<OutputFormat[]>([]);
  const [sort, setSort] = useState<Sort>("综合推荐");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);

  useEffect(() => {
    document.body.classList.toggle("sheet-open", filterOpen);
    return () => document.body.classList.remove("sheet-open");
  }, [filterOpen]);

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
    <>
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
    <Footer actions={actions} />
    </>
  );
}

/* ---------- Skill detail ---------- */

function DetailPage({
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
  const sections: [string, string][] = [
    ["install", t("安装", "Install")],
    ["usage", t("适用场景", "Use cases")],
    ["compat", t("兼容性", "Compatibility")],
    ["security", t("安全与权限", "Security")],
    ["evaluation", t("任务评测", "Task review")],
    ["skillmd", "SKILL.md"],
  ];
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

  useEffect(() => {
    const ids = ["install", "usage", "compat", "security", "evaluation", "skillmd"];
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
    [t("来源已验证", "Source verified"), true],
    [t("安装已验证", "Install verified"), skill.status !== "待验证"],
    [t("安全已评估", "Security assessed"), skill.risk !== "未评估"],
    [t("任务已实测", "Task-tested"), skill.status === "任务已实测"],
    [t("作者已认证", "Author verified"), false],
  ];

  return (
    <>
    <main className="detail-page">
      <div className="container breadcrumb">
        <button onClick={() => go("#/search")}>Skills</button>
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
                  <span className="verified-badge">
                    <Icon name="check" size={13} /> {t("来源已验证", "Source verified")}
                  </span>
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

          <section className="content-section evaluation-section" id="evaluation">
            <div className="content-heading">
              <span className="number">05</span>
              <div>
                <h2>{t("任务评测", "Task review")}</h2>
                <p>
                  {t(
                    "以下为原型演示数据，不代表正式评测结论。",
                    "Prototype demo data, not an official review conclusion.",
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
                    <button className="link-button" onClick={() => go(`#/review/${review.id}`)}>
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
                <button className="link-button" onClick={() => go("#/reviews")}>
                  {t("浏览已有评测", "Browse reviews")} <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
          </section>

          <section className="content-section" id="skillmd">
            <div className="content-heading">
              <span className="number">06</span>
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
    <Footer actions={actions} />
    </>
  );
}

/* ---------- Compare ---------- */

type Cell = { text: string; tone?: "good" | "warn" | "muted" };

function levelTone(level: string): Cell["tone"] {
  if (level === "未发现") return "good";
  if (level === "需要") return "warn";
  if (level === "待评估") return "muted";
  return undefined;
}

function ComparePage({ actions }: { actions: AppActions }) {
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
    <>
    <main className="compare-page container">
      <div className="breadcrumb">
        <button onClick={() => go("#/search")}>{t("发现 Skill", "Discover")}</button>
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
          <button className="secondary" onClick={() => go("#/search")}>
            {t("去发现 Skill", "Discover Skills")}
          </button>
        </div>
      ) : (
        <div className="compare-table-wrap">
          <div className="compare-head" style={{ "--columns": columns } as React.CSSProperties}>
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
                  style={{ "--columns": columns } as React.CSSProperties}
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
    <Footer actions={actions} />
    </>
  );
}

/* ---------- Shell ---------- */

function CompareDock({ actions }: { actions: AppActions }) {
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
          onClick={() => go("#/compare")}
        >
          {t("开始对比", "Compare")} <Icon name="arrow" size={17} />
        </button>
      </div>
    </div>
  );
}

function NotFound({ go }: { go: (href: string) => void }) {
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
      <button className="secondary" onClick={() => go("#/search")}>
        {t("返回发现 Skill", "Back to Discover")}
      </button>
    </main>
  );
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [lang, setLang] = useState<Lang>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "zh") return fromUrl;
    return readJSON<Lang>("awskill:lang", "zh");
  });
  const [compareIds, setCompareIds] = useState<string[]>(["frontend-design", "agent-browser"]);
  const [favorites, setFavorites] = useState<string[]>(() => readJSON("awskill:favorites", []));
  const [dark, setDark] = useState<boolean>(() =>
    readJSON("awskill:dark", window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false),
  );
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const tt = useCallback((zh: string, en: string) => (lang === "zh" ? zh : en), [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("awskill:dark", JSON.stringify(dark));
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title =
      lang === "zh" ? "awskill · Agent Skill 评测与发现" : "awskill · Agent Skill reviews";
    localStorage.setItem("awskill:lang", JSON.stringify(lang));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("awskill:favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    function onHash() {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const go = useCallback((href: string) => {
    if (window.location.hash === href) window.scrollTo({ top: 0, behavior: "smooth" });
    else window.location.hash = href;
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.getElementById("global-search");
        if (input) input.focus();
        else {
          go("#/search");
          window.setTimeout(() => document.getElementById("global-search")?.focus(), 60);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const toggleCompare = useCallback(
    (id: string) => {
      setCompareIds((current) => {
        if (current.includes(id)) return current.filter((item) => item !== id);
        if (current.length >= 3) {
          notify(
            tt(
              "最多同时对比 3 个 Skill，请先移出一个。",
              "You can compare up to 3 Skills. Remove one first.",
            ),
          );
          return current;
        }
        return [...current, id];
      });
    },
    [notify, tt],
  );

  const actions: AppActions = {
    go,
    soon: (zh, en) =>
      notify(
        tt(
          `“${zh}”将在正式版开放，原型阶段暂不可用。`,
          `“${en}” will be available at launch; it's disabled in this prototype.`,
        ),
      ),
    compareIds,
    toggleCompare,
  };

  const showCompareDock =
    compareIds.length > 0 && (route.page === "search" || route.page === "skill");

  return (
    <I18nProvider value={{ lang, setLang }}>
      <div className={`app-shell${showCompareDock ? " has-compare-dock" : ""}`}>
        <Header route={route} actions={actions} dark={dark} onToggleTheme={() => setDark(!dark)} />
        <Page
          route={route}
          actions={actions}
          favorites={favorites}
          onFavorite={(skill) => {
            const next = !favorites.includes(skill.id);
            setFavorites((current) =>
              next ? [...current, skill.id] : current.filter((id) => id !== skill.id),
            );
            notify(
              next
                ? tt(`已收藏 ${skill.name}`, `Bookmarked ${skill.name}`)
                : tt(`已取消收藏 ${skill.name}`, `Removed ${skill.name} from bookmarks`),
            );
          }}
        />
        {showCompareDock && <CompareDock actions={actions} />}
        {toast && (
          <div className="toast" role="status" key={toast.id}>
            {toast.text}
          </div>
        )}
      </div>
    </I18nProvider>
  );
}

function Page({
  route,
  actions,
  favorites,
  onFavorite,
}: {
  route: Route;
  actions: AppActions;
  favorites: string[];
  onFavorite: (skill: Skill) => void;
}) {
  const { getSkill, reviews, workflows } = useData();
  const { go } = actions;
  switch (route.page) {
    case "home":
      return <HomePage actions={actions} />;
    case "search":
      return <SearchPage key={window.location.hash} route={route} actions={actions} />;
    case "skill": {
      const skill = route.id ? getSkill(route.id) : undefined;
      return skill ? (
        <DetailPage
          key={skill.id}
          skill={skill}
          actions={actions}
          favorite={favorites.includes(skill.id)}
          onFavorite={() => onFavorite(skill)}
        />
      ) : (
        <NotFound go={go} />
      );
    }
    case "compare":
      return <ComparePage actions={actions} />;
    case "reviews":
      return <ReviewsPage route={route} actions={actions} />;
    case "review": {
      const review = reviews.find((item) => item.id === route.id);
      return review ? <ReviewDetailPage review={review} actions={actions} /> : <NotFound go={go} />;
    }
    case "workflows":
      return <WorkflowsPage actions={actions} />;
    case "workflow": {
      const workflow = workflows.find((item) => item.id === route.id);
      return workflow ? (
        <WorkflowDetailPage key={workflow.id} workflow={workflow} actions={actions} />
      ) : (
        <NotFound go={go} />
      );
    }
    case "agents":
      return <AgentsPage actions={actions} />;
    default:
      return <NotFound go={go} />;
  }
}
