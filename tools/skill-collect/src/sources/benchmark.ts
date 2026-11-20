import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchmarkRaw } from "../schema.ts";
import { skillheyAdapter } from "./skillhey.ts";
import { skillShAliasAdapter, skillsShAdapter } from "./skills-sh.ts";

export type BenchmarkTarget = {
  /** Adapter key. `fixture` reads recorded JSON under fixtures/benchmark/. */
  siteKey: string;
  /** Fixture id or remote detail URL (adapter-specific). */
  ref: string;
};

export type BenchmarkAdapter = {
  siteKey: string;
  collect(ref: string, options?: { now?: string }): Promise<BenchmarkRaw>;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(here, "../../fixtures/benchmark");

type FixtureFile = {
  siteKey?: string;
  sourceUrl: string;
  externalId?: string | null;
  name?: string | null;
  owner?: string | null;
  repo?: string | null;
  repositoryUrl?: string | null;
  description?: string | null;
  tags?: string[];
  stars?: string | null;
  installs?: number | null;
  license?: string | null;
  agentsClaimed?: string[];
  raw?: Record<string, unknown>;
};

/** Offline fixture adapter for tests / CI without network. */
export const fixtureAdapter: BenchmarkAdapter = {
  siteKey: "fixture",
  async collect(ref, options = {}) {
    const filePath = path.join(fixturesRoot, `${ref}.json`);
    const text = await readFile(filePath, "utf8");
    const data = JSON.parse(text) as FixtureFile;
    const now = options.now ?? new Date().toISOString();
    return {
      siteKey: data.siteKey ?? "fixture",
      sourceUrl: data.sourceUrl,
      externalId: data.externalId ?? ref,
      name: data.name ?? null,
      owner: data.owner ?? null,
      repo: data.repo ?? null,
      repositoryUrl: data.repositoryUrl ?? null,
      description: data.description ?? null,
      tags: data.tags ?? [],
      stars: data.stars ?? null,
      installs: data.installs ?? null,
      license: data.license ?? null,
      agentsClaimed: data.agentsClaimed ?? [],
      raw: data.raw ?? (data as unknown as Record<string, unknown>),
      fetchedAt: now,
    };
  },
};

const adapters: Record<string, BenchmarkAdapter> = {
  fixture: fixtureAdapter,
  "skills-sh": skillsShAdapter,
  "skill-sh": skillShAliasAdapter,
  skillhey: skillheyAdapter,
};

export function registerBenchmarkAdapter(adapter: BenchmarkAdapter) {
  adapters[adapter.siteKey] = adapter;
}

/** Collect from a 对标站 channel (fixture or registered HTTP adapter). */
export async function collectBenchmark(
  target: BenchmarkTarget,
  options: { now?: string } = {},
): Promise<BenchmarkRaw> {
  const adapter = adapters[target.siteKey];
  if (!adapter) {
    throw new Error(
      `Unknown benchmark siteKey "${target.siteKey}". Registered: ${Object.keys(adapters).join(", ")}`,
    );
  }
  return adapter.collect(target.ref, options);
}
