# Agent 卡片页脚布局 Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** `/agents` 四张 Agent 卡片页脚：左「查看详情」文字链、右「浏览 Skills」primary 实心钮；对齐稳定、主次清晰。

**Architecture:** 只改 `components/hubs.tsx` 页脚控件 class + `app/globals.css` 中 `.agent-card-actions` 样式；路由/文案/其它卡片区块不动。详情页若共用该类，仅统一无副作用 flex，不改其信息架构。

**Tech Stack:** Next.js App Router、现有 CSS 变量、`.primary` 按钮体系

**Spec:** `docs/superpowers/specs/2026-11-23-agents-card-actions-layout-design.md`

## Global Constraints

- 不改文案语义、路由、`go(...)` 行为
- 不改指标 / 覆盖条 / 矩阵
- 不新增色板；不窄屏堆叠
- 验收 URL：`http://localhost:13001/zh/agents`

---

### Task 1: hubs 页脚控件角色

**Files:** `components/hubs.tsx`

- [x] 去掉 `.agent-card-actions` 上的 inline `display/gap/flexWrap`
- [x] 「查看详情」加文字链 class（如 `agent-card-link`），保留箭头与 `go(agentHref(...))`
- [x] 「浏览 Skills」改为 `className="primary"`，保留 `go(searchHref({ agent }))`

### Task 2: CSS 对齐与样式

**Files:** `app/globals.css`

- [x] `.agent-card-actions`：`display:flex; align-items:center; gap:8px`；必要时 `justify-content:space-between` 落实左链右钮
- [x] `.agent-card-link`：`--text-2`、无描边底框、`min-height` 对齐 `.primary`、hover 下划线或色变
- [x] 确认详情页共用时无副作用（仅 flex 统一）

### Task 3: 验收与进度

- [x] `pnpm lint`；手测 `/zh/agents`（详情 / Skills 筛选跳转）
- [x] 勾选 design 验收项；追加 `doc/进度记录.md`
- [x] 将 design Status 改为 Implemented
