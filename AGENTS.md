<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Target stack is Next.js **16.x** (App Router). APIs and conventions may differ from training data. After the Next scaffold lands, read guides under `node_modules/next/dist/docs/` before writing framework code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo quick facts (awskill-web)

- **Product**: awskill（Agent Workflow Skills）— 中文 AI Agent Skill 评测与发现；域名 `awskill.com`
- **Docs (source of truth)**: `doc/PRD.md`（做什么）、`doc/analysis.md`（为什么）、`doc/README.md`（索引）。`AGENTS.md` 只是 Agent 摘要，产品细节以 `doc/` 为准。
- **Current code**: Next.js **16.2** App Router + React **19.2** + Tailwind CSS **v4**；静态数据在 `lib/data*`；路由 `app/[locale]/…`（`/zh` · `/en`）
- **Target stack**: 同上前端；后续 Strapi + PostgreSQL + Meilisearch
- **Package manager**: **pnpm**（本仓锁定；勿擅自改 npm/yarn）。构建脚本审批在 `pnpm-workspace.yaml` → `allowBuilds`（必须是 `true`/`false`，禁止占位字符串；见 `code-conventions`）
- **First Agents**: Claude Code、Codex、Cursor、Windsurf
- **Default locale**: 简体中文；英文为完整可切换版本

## Cursor (this repo)

| Kind | Path | Role |
|------|------|------|
| Rules | `code-conventions` | 工程硬约束、目录、RSC、env |
| | `product-guardrails` | PRD/决策硬约束；演示数据与未决项 |
| | `change-scope` | 样式任务边界；评审建议 ≠ 实现许可 |
| | `workflow` | 阶段 DoD、验收；P*↔PRD M* |
| | `progress-log` | `doc/进度记录.md` 模板 |
| | `figma-honesty` | 不编造节点、不提交 MCP 临时图（涉及 Figma 时） |

Progress: 每个可复述工作单元倒序追加 `doc/进度记录.md`。  
Daily: 只打开本仓窗口。

## Commands

| Command | Notes |
|---------|--------|
| `pnpm dev` | Next → `http://localhost:13001` |
| `pnpm build` / `pnpm start` | 生产构建与启动 |
| `pnpm lint` | ESLint（`app` / `components` / `lib`） |
| `pnpm collect` / `merge:local` | 采集管线 → `lib/data/skills.collected.json` |

## Must follow

1. 产品范围与验收以 `doc/PRD.md` 需求编号 / 里程碑 **M*** 为准；决策变更同步 `doc/analysis.md`。本仓 **P*** 只是工程切片（见 `workflow`）。
2. 遵循 `.cursor/rules/*.mdc`；冲突时：**产品文档 > 本仓 rules**。
3. **样式/视角任务**：只动外观；**评审建议 ≠ 实现许可**（见 `change-scope`）。
4. 目录与数据：`app` / `components` / `lib`；静态阶段走 `lib/data*`，接 CMS 后只经 `lib/strapi/*`。
5. 优先「可运行的 Next + 真实路由 + 静态数据」，再接 Strapi/Meilisearch（见 `workflow`）。
