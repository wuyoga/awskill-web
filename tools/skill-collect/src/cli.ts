import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeToDraft } from "./merge.ts";
import { collectBenchmark } from "./sources/benchmark.ts";
import { collectGithub } from "./sources/github.ts";

type BenchmarkSeed = { siteKey: string; ref: string };

type SeedSkill = {
  id: string;
  github?: { owner: string; repo: string; path?: string };
  /** Single 对标站 (legacy). */
  benchmark?: BenchmarkSeed;
  /** Multiple 对标站 — preferred. */
  benchmarks?: BenchmarkSeed[];
};

type SeedFile = { skills: SeedSkill[] };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const defaultOutDir = path.join(root, "content/drafts");

function usage(): never {
  console.error(`Usage:
  pnpm collect --seed <seed.json> [--out <dir>] [--id <skill-id>]

Example:
  pnpm collect --seed tools/skill-collect/seeds/demo.json
`);
  process.exit(1);
}

function argValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function benchmarkTargets(item: SeedSkill): BenchmarkSeed[] {
  const list = [...(item.benchmarks ?? [])];
  if (item.benchmark) list.unshift(item.benchmark);
  return list;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) usage();

  const seedPath = argValue(argv, "--seed");
  if (!seedPath) usage();

  const outDir = path.resolve(argValue(argv, "--out") ?? defaultOutDir);
  const onlyId = argValue(argv, "--id");
  const absSeed = path.resolve(seedPath);
  const seed = JSON.parse(await readFile(absSeed, "utf8")) as SeedFile;

  await mkdir(outDir, { recursive: true });

  const targets = seed.skills.filter((s) => !onlyId || s.id === onlyId);
  if (!targets.length) {
    console.error(onlyId ? `No seed entry for id=${onlyId}` : "Seed has no skills");
    process.exit(1);
  }

  const results: string[] = [];

  for (const item of targets) {
    console.log(`→ collecting ${item.id}`);
    const github = item.github
      ? await collectGithub({
          owner: item.github.owner,
          repo: item.github.repo,
          path: item.github.path || undefined,
        })
      : undefined;

    const benchmarks = [];
    for (const b of benchmarkTargets(item)) {
      try {
        console.log(`  · benchmark ${b.siteKey} ${b.ref}`);
        benchmarks.push(await collectBenchmark(b));
      } catch (err) {
        console.warn(`  ! benchmark ${b.siteKey} failed: ${(err as Error).message}`);
      }
    }

    const draft = mergeToDraft({ id: item.id, github, benchmarks });
    const outFile = path.join(outDir, `${item.id}.draft.json`);
    await writeFile(outFile, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
    results.push(outFile);
    console.log(`  wrote ${path.relative(root, outFile)} [${draft.draftStatus}]`);
    for (const note of draft.review.notes) console.log(`  note: ${note}`);
  }

  console.log(`\nDone: ${results.length} draft(s) → ${path.relative(root, outDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
