export {
  compareHref,
  compareSearchMatches,
  parseCompareSkillIds,
  resolveCompareSkillIds,
  sameCompareIds,
} from "./compare-url";

export type SearchHrefParams = {
  q?: string;
  category?: string;
  agent?: string;
  status?: string[];
  risk?: string[];
  req?: string[];
  out?: string[];
  sort?: string;
};

export function parseCsvParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Bare discover path + query (locale added by `go` / `localized`). */
export function searchHref(params: SearchHrefParams = {}) {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.category && params.category !== "全部") query.set("category", params.category);
  if (params.agent && params.agent !== "全部") query.set("agent", params.agent);
  if (params.status?.length) query.set("status", params.status.join(","));
  if (params.risk?.length) query.set("risk", params.risk.join(","));
  if (params.req?.length) query.set("req", params.req.join(","));
  if (params.out?.length) query.set("out", params.out.join(","));
  if (params.sort && params.sort !== "综合推荐") query.set("sort", params.sort);
  const text = query.toString();
  return `/skills${text ? `?${text}` : ""}`;
}

export function skillHref(id: string) {
  return `/skills/${encodeURIComponent(id)}`;
}

export function reviewHref(id: string) {
  return `/reviews/${encodeURIComponent(id)}`;
}

export function reviewsHref(section?: string) {
  if (!section) return "/reviews";
  const query = new URLSearchParams();
  query.set("section", section);
  return `/reviews?${query.toString()}`;
}

export function workflowHref(id: string) {
  return `/workflows/${encodeURIComponent(id)}`;
}

export function agentHref(slug: string) {
  return `/agents/${encodeURIComponent(slug)}`;
}

/** Stable URL slug for an Agent display name. */
export function agentSlug(agent: string) {
  return agent.toLowerCase().replace(/\s+/g, "-");
}
