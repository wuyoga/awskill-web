/**
 * Merge content/drafts/*.draft.json → src/data/skills.collected.json
 * for local Vite prototype consumption.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanSkill } from "./clean.ts";
import type { Category, SkillBody, SkillDraft } from "./schema.ts";
import { CATEGORIES } from "./schema.ts";

/** Prototype-compatible skill row (matches src/data.ts Skill fields). */
type LocalSkill = Omit<SkillBody, "category" | "icon" | "sourceUpdatedDaysAgo" | "repositoryUrl" | "repositoryPath"> & {
  category: Category;
  icon: string;
  sourceUpdatedDaysAgo: number;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const draftsDir = path.join(root, "content/drafts");
const outFile = path.join(root, "src/data/skills.collected.json");

const ICONS = new Set<string>([
  "arrow",
  "bolt",
  "bookmark",
  "check",
  "chevron",
  "clock",
  "code",
  "copy",
  "external",
  "file",
  "filter",
  "github",
  "grid",
  "menu",
  "moon",
  "plus",
  "search",
  "shield",
  "spark",
  "star",
  "sun",
  "terminal",
  "warning",
  "x",
]);

const DEFAULT_CATEGORY: Category = "Agent 与工具链";

function asCategory(value: string): Category {
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as Category)
    : DEFAULT_CATEGORY;
}

function asIcon(value: string): string {
  return ICONS.has(value) ? value : "spark";
}

function toSkill(draft: SkillDraft): LocalSkill | null {
  const s = draft.skill;
  if (!s?.id || !s.name) return null;
  return {
    id: s.id,
    name: s.name,
    owner: s.owner || "unknown",
    repo: s.repo || s.name,
    category: asCategory(s.category || ""),
    description: s.description || s.name,
    tags: s.tags ?? [],
    keywords: s.keywords?.length ? s.keywords : (s.tags ?? []),
    compat: s.compat,
    risk: s.risk || "未评估",
    riskSummary: s.riskSummary || "待人工安全评估",
    permissions: s.permissions?.length
      ? s.permissions
      : [
          { label: "读取项目文件", level: "待评估", reason: "尚未完成安全评估" },
          { label: "修改项目文件", level: "待评估", reason: "尚未完成安全评估" },
          { label: "执行 Shell", level: "待评估", reason: "尚未完成安全评估" },
          { label: "访问网络", level: "待评估", reason: "尚未完成安全评估" },
          { label: "访问系统凭据", level: "待评估", reason: "尚未完成安全评估" },
          { label: "删除文件", level: "待评估", reason: "尚未完成安全评估" },
        ],
    status: s.status || "待验证",
    needsApiKey: Boolean(s.needsApiKey),
    paid: Boolean(s.paid),
    outputs: s.outputs ?? [],
    stars: s.stars || "0",
    installs: typeof s.installs === "number" ? s.installs : 0,
    addedAt: s.addedAt || draft.collectedAt.slice(0, 10),
    sourceUpdatedDaysAgo: s.sourceUpdatedDaysAgo ?? 0,
    license: s.license || "",
    prerequisites: s.prerequisites || "",
    verifiedCommit: s.verifiedCommit || "",
    latestCommit: s.latestCommit || "",
    useCases: s.useCases ?? [],
    notFor: s.notFor || "",
    skillMd: (s.skillMd || "").slice(0, 8000),
    tone: s.tone || "neutral",
    icon: asIcon(s.icon || "spark"),
  };
}

async function main() {
  const files = (await readdir(draftsDir)).filter((f) => f.endsWith(".draft.json"));
  const byId = new Map<string, LocalSkill>();
  let skipped = 0;

  for (const file of files) {
    try {
      const draft = JSON.parse(await readFile(path.join(draftsDir, file), "utf8")) as SkillDraft;
      const raw = toSkill(draft);
      if (!raw) {
        skipped++;
        continue;
      }
      const skill = cleanSkill(raw, draft) as LocalSkill;
      // later file wins (same id)
      byId.set(skill.id, skill);
    } catch {
      skipped++;
    }
  }

  const skills = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  await mkdir(path.dirname(outFile), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    count: skills.length,
    note: "Collected + heuristic-cleaned for local prototype. Compat/risk are inferred or source-claimed, not lab-verified. Demo.",
    skills,
  };
  await writeFile(outFile, `${JSON.stringify(payload)}\n`, "utf8");

  const byCat: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let withAgent = 0;
  let withOutputs = 0;
  for (const s of skills) {
    byCat[s.category] = (byCat[s.category] ?? 0) + 1;
    byRisk[s.risk] = (byRisk[s.risk] ?? 0) + 1;
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    if (Object.values(s.compat).some((c) => c.status !== "未验证")) withAgent++;
    if (s.outputs.length) withOutputs++;
  }
  console.log(
    `Merged+cleaned ${skills.length} skills → ${path.relative(root, outFile)} (skipped ${skipped})`,
  );
  console.log("category:", JSON.stringify(byCat));
  console.log("risk:", JSON.stringify(byRisk));
  console.log("status:", JSON.stringify(byStatus));
  console.log(`agent-claimed(部分支持): ${withAgent}; with outputs: ${withOutputs}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
