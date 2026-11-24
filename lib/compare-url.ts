/** Parse `?skills=a,b,c` (max 3) for compare share links. */
export function parseCompareSkillIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function sameCompareIds(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Hook query wins when it already has ids.
 * `windowSkills` is only a fill-in for a hard load where `useSearchParams` is still empty.
 */
export function resolveCompareSkillIds(
  skillsQuery: string | null | undefined,
  windowSkills: readonly string[] | null,
): string[] {
  const fromParams = parseCompareSkillIds(skillsQuery);
  if (fromParams.length > 0) return fromParams;
  if (windowSkills && windowSkills.length > 0) return windowSkills.slice(0, 3);
  return fromParams;
}

/** Compare the selection in a query string to ids, ignoring comma encoding. */
export function compareSearchMatches(search: string, ids: readonly string[]): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const fromUrl = parseCompareSkillIds(new URLSearchParams(query).get("skills"));
  const next = ids.filter(Boolean).slice(0, 3);
  return sameCompareIds(fromUrl, next);
}

export function compareHref(ids: string[]) {
  const skills = ids.filter(Boolean).slice(0, 3);
  if (!skills.length) return "/compare";
  const query = new URLSearchParams();
  query.set("skills", skills.join(","));
  return `/compare?${query.toString()}`;
}
