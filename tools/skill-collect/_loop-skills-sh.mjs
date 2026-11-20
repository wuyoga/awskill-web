/**
 * Keep collecting skills.sh until sitemap gap is closed (or maxRounds).
 * Usage: node tools/skill-collect/_loop-skills-sh.mjs [--per-site 1500] [--delay-ms 200] [--max-rounds 20]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";

function argValue(argv, name, fallback) {
  const i = argv.indexOf(name);
  if (i === -1) return fallback;
  return argv[i + 1] ?? fallback;
}

const argv = process.argv.slice(2);
const perSite = Number(argValue(argv, "--per-site", "1500"));
const delayMs = argValue(argv, "--delay-ms", "200");
const maxRounds = Number(argValue(argv, "--max-rounds", "20"));

async function missingCount() {
  const state = JSON.parse(fs.readFileSync("content/collect-state.json", "utf8"));
  const collected = new Set(Object.keys(state.bySite["skills-sh"] || {}));
  const sitemaps = [
    "https://www.skills.sh/sitemap-skills-1.xml",
    "https://www.skills.sh/sitemap-skills-2.xml",
  ];
  let total = 0;
  let missing = 0;
  for (const url of sitemaps) {
    const xml = await fetch(url).then((r) => r.text());
    for (const m of xml.matchAll(/<loc>\s*https?:\/\/(?:www\.)?skills\.sh\/(.+?)\s*<\/loc>/gi)) {
      total++;
      if (!collected.has(m[1])) missing++;
    }
  }
  return { total, collected: collected.size, missing };
}

function runBatch() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "collect:batch",
        "--sites",
        "skills-sh",
        "--per-site",
        String(perSite),
        "--delay-ms",
        String(delayMs),
      ],
      { stdio: "inherit", shell: true },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`batch exited ${code}`));
    });
  });
}

for (let round = 1; round <= maxRounds; round++) {
  const before = await missingCount();
  console.log(`\n=== loop round ${round}/${maxRounds} missing=${before.missing}/${before.total} collected=${before.collected} ===`);
  if (before.missing === 0) {
    console.log("skills.sh sitemap fully covered");
    break;
  }
  await runBatch();
  const after = await missingCount();
  console.log(`after round ${round}: missing=${after.missing} collected=${after.collected}`);
  if (after.missing >= before.missing) {
    console.warn("no progress; stopping");
    break;
  }
}
