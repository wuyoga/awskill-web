import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CollectState = {
  updatedAt: string;
  /** siteKey → ref → draft id */
  bySite: Record<string, Record<string, string>>;
};

export function emptyState(): CollectState {
  return { updatedAt: new Date().toISOString(), bySite: {} };
}

export async function loadState(file: string): Promise<CollectState> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as CollectState;
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      bySite: parsed.bySite ?? {},
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(file: string, state: CollectState): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  state.updatedAt = new Date().toISOString();
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function collectedRefs(state: CollectState, siteKey: string): Set<string> {
  return new Set(Object.keys(state.bySite[siteKey] ?? {}));
}

export function markCollected(
  state: CollectState,
  siteKey: string,
  ref: string,
  draftId: string,
): void {
  if (!state.bySite[siteKey]) state.bySite[siteKey] = {};
  state.bySite[siteKey][ref] = draftId;
}
