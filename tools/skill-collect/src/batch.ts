import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverSkillhey, discoverSkillsSh, draftIdFor, mergeSeedRefs } from "./discover.ts";
import { mergeToDraft } from "./merge.ts";
import type { CollectState } from "./state.ts";
import type { SkillDraft } from "./schema.ts";
import { collectBenchmark } from "./sources/benchmark.ts";
import { collectGithub } from "./sources/github.ts";
import { collectedRefs, loadState, markCollected, saveState } from "./state.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const defaultOutDir = path.join(root, "content/drafts");
const defaultState = path.join(root, "content/collect-state.json");

function usage(): never {
  console.error(`Usage:
  pnpm collect:batch [--per-site 500] [--out content/drafts] [--state content/collect-state.json]
                     [--sites skills-sh,skillhey] [--delay-ms 300] [--github]
                     [--refs slug1,slug2] [--no-follow-links] [--refresh]

  --refs            Prefer these refs for the site(s) in --sites (skillhey: slug; skills-sh: owner/repo/skill).
                    Useful for noindex collection pages missing from sitemap (e.g. handraw-style).
  --no-follow-links Do not enqueue SkillHey child /skills/{slug} links found on collected pages.
  --refresh         Re-fetch refs already in collect-state (up to --per-site; with --refs, only those).
                    New snapshot replaces same siteKey+externalId in the draft. Discovery of missing
                    refs still uses a separate --per-site budget.

Skips refs already recorded in collect-state (unless --refresh).
`);
  process.exit(1);
}

function argValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadDraft(file: string): Promise<SkillDraft | null> {
  if (!(await exists(file))) return null;
  return JSON.parse(await readFile(file, "utf8")) as SkillDraft;
}

/** Mark refs already present in draft JSON so re-runs skip them. */
async function bootstrapStateFromDrafts(outDir: string, state: CollectState): Promise<number> {
  let n = 0;
  const files = (await readdir(outDir)).filter((f) => f.endsWith(".draft.json"));
  for (const file of files) {
    try {
      const draft = JSON.parse(await readFile(path.join(outDir, file), "utf8")) as SkillDraft;
      const id = draft.skill.id;
      const list = [
        ...(draft.sources.benchmarks ?? []),
        ...(draft.sources.benchmark ? [draft.sources.benchmark] : []),
      ];
      for (const b of list) {
        if (b.siteKey === "fixture") continue;
        const ref = b.externalId ?? "";
        if (!ref) continue;
        if (!state.bySite[b.siteKey]?.[ref]) {
          markCollected(state, b.siteKey, ref, id);
          n++;
        }
      }
    } catch {
      // ignore bad draft
    }
  }
  return n;
}

function parseRefs(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function childSlugsFromRaw(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const childSlugs = (raw as { childSlugs?: unknown }).childSlugs;
  if (!Array.isArray(childSlugs)) return [];
  return childSlugs.filter((s): s is string => typeof s === "string" && Boolean(s.trim()));
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) usage();

  const perSite = Number(argValue(argv, "--per-site") ?? "500");
  const outDir = path.resolve(argValue(argv, "--out") ?? defaultOutDir);
  const stateFile = path.resolve(argValue(argv, "--state") ?? defaultState);
  const delayMs = Number(argValue(argv, "--delay-ms") ?? "300");
  const wantGithub = argv.includes("--github") || Boolean(process.env.GITHUB_TOKEN);
  const followLinks = !argv.includes("--no-follow-links");
  const refresh = argv.includes("--refresh");
  const seedRefs = parseRefs(argValue(argv, "--refs"));
  const sites = (argValue(argv, "--sites") ?? "skills-sh,skillhey")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!Number.isFinite(perSite) || perSite <= 0) {
    console.error("--per-site must be a positive number");
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const state = await loadState(stateFile);
  const bootstrapped = await bootstrapStateFromDrafts(outDir, state);
  if (bootstrapped) {
    console.log(`bootstrap: marked ${bootstrapped} ref(s) from existing drafts`);
    await saveState(stateFile, state);
  }

  type Job = { siteKey: string; ref: string; force?: boolean; preferredId?: string };
  const jobs: Job[] = [];
  const queued = new Set<string>();

  const jobKey = (siteKey: string, ref: string) => `${siteKey}::${ref}`;

  const enqueue = (
    siteKey: string,
    ref: string,
    options: { force?: boolean; preferredId?: string } = {},
  ): boolean => {
    const key = jobKey(siteKey, ref);
    if (queued.has(key)) return false;
    if (!options.force && state.bySite[siteKey]?.[ref]) return false;
    queued.add(key);
    jobs.push({
      siteKey,
      ref,
      force: options.force,
      preferredId: options.preferredId,
    });
    return true;
  };

  for (const site of sites) {
    const key = site === "skill-sh" ? "skills-sh" : site;
    let refreshQueued = 0;

    if (refresh) {
      const collected = Object.keys(state.bySite[key] ?? {});
      // With --refs + --refresh: re-fetch listed refs even if not yet in state.
      const toRefresh = (seedRefs.length ? seedRefs : collected).slice(0, perSite);
      for (const ref of toRefresh) {
        const preferredId = state.bySite[key]?.[ref];
        // Keep state row until write succeeds; force skips the "already collected" guard.
        if (enqueue(key, ref, { force: true, preferredId })) refreshQueued++;
      }
      console.log(`refresh ${site}: queued ${refreshQueued} (of ${toRefresh.length} candidates)`);
    }

    // Exclude in-state refs AND anything already queued (e.g. refresh), so discover budget
    // is spent on truly missing sitemap entries.
    const excludeNow = new Set(collectedRefs(state, key));
    for (const job of jobs) {
      if (job.siteKey === key) excludeNow.add(job.ref);
    }
    console.log(`discover ${site} (need ${perSite} new, already have ${excludeNow.size})`);
    let discovered: string[] = [];
    if (site === "skills-sh" || site === "skill-sh") {
      discovered = await discoverSkillsSh(perSite, excludeNow);
    } else if (site === "skillhey") {
      discovered = await discoverSkillhey(perSite, excludeNow);
    } else {
      console.warn(`unknown site ${site}, skip`);
      continue;
    }
    // Seed refs only apply when a single site is targeted, or always for skillhey when mixed.
    // Skip seeds under --refresh (already handled above).
    const seedsForSite =
      refresh || (sites.length > 1 && key !== "skillhey") ? [] : seedRefs;
    const refs = mergeSeedRefs(seedsForSite, discovered, excludeNow, perSite + seedsForSite.length);
    console.log(`  queued ${refs.length}${seedsForSite.length ? ` (seeds ${seedsForSite.length})` : ""}`);
    for (const ref of refs) enqueue(key, ref);
  }

  // Ensure --refs land even when sitemap discovery returned nothing (e.g. noindex pages).
  if (seedRefs.length && !refresh) {
    for (const site of sites) {
      const key = site === "skill-sh" ? "skills-sh" : site;
      if (sites.length > 1 && key !== "skillhey") continue;
      for (const ref of seedRefs) {
        if (state.bySite[key]?.[ref]) {
          console.log(`  seed already collected: ${key} ${ref}`);
          continue;
        }
        if (enqueue(key, ref)) console.log(`  seed queued: ${key} ${ref}`);
      }
    }
  }

  let wrote = 0;
  let skipped = 0;
  let failed = 0;
  let followed = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]!;
    const already = state.bySite[job.siteKey]?.[job.ref];
    if (already && !job.force) {
      skipped++;
      continue;
    }

    const id = job.preferredId || already || draftIdFor(job.siteKey, job.ref);
    const outFile = path.join(outDir, `${id}.draft.json`);
    process.stdout.write(`[${i + 1}/${jobs.length}] ${job.siteKey} ${job.ref} → ${id}\n`);

    try {
      const benchmark = await collectBenchmark({ siteKey: job.siteKey, ref: job.ref });
      let github;
      if (wantGithub && benchmark.owner && benchmark.repo) {
        try {
          github = await collectGithub({
            owner: benchmark.owner,
            repo: benchmark.repo,
            path: undefined,
          });
        } catch (err) {
          console.warn(`  github skip: ${(err as Error).message}`);
        }
      }

      const existing = await loadDraft(outFile);
      const benchmarks = [
        ...(existing?.sources.benchmarks ?? (existing?.sources.benchmark ? [existing.sources.benchmark] : [])),
        benchmark,
      ];
      // Last wins for same siteKey+externalId (so --refresh replaces stale snapshots).
      const byKey = new Map<string, (typeof benchmarks)[number]>();
      for (const b of benchmarks) {
        byKey.set(`${b.siteKey}::${b.externalId ?? b.sourceUrl}`, b);
      }
      const deduped = [...byKey.values()];

      const draft = mergeToDraft({
        id,
        github: github ?? existing?.sources.github,
        benchmarks: deduped,
      });
      await writeFile(outFile, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
      markCollected(state, job.siteKey, job.ref, id);
      wrote++;

      if (followLinks && job.siteKey === "skillhey") {
        // Cap per page so listing/nav pages don't enqueue the whole catalog.
        const children = childSlugsFromRaw(benchmark.raw).slice(0, 40);
        let added = 0;
        for (const child of children) {
          if (enqueue("skillhey", child)) {
            added++;
            followed++;
          }
        }
        if (added) process.stdout.write(`  follow +${added} child slug(s)\n`);
      }

      // persist progress frequently so resume works after interrupt
      if (wrote % 10 === 0) await saveState(stateFile, state);
    } catch (err) {
      failed++;
      console.warn(`  FAIL: ${(err as Error).message}`);
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  await saveState(stateFile, state);
  console.log(
    `\nDone. wrote=${wrote} skipped=${skipped} failed=${failed} followed=${followed} state=${path.relative(root, stateFile)}`,
  );
  for (const site of sites) {
    const n = Object.keys(state.bySite[site === "skill-sh" ? "skills-sh" : site] ?? {}).length;
    console.log(`  ${site} collected total: ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
