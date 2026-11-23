# P0 Vite→Next 脚手架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 本仓主路径改为 Next.js 16 App Router；`pnpm dev` 开 `:3000`；真实路由可访问首页；hash 不再作正式导航。

**Architecture:** 就地迁移（`dev` 分支）。新建 `app/` / `components/` / `lib/`。P0 只交付壳 + 首页；完整页面迁回留给 P1/P2。原型 CSS token 原样迁入 `app/globals.css`。`src/` Vite 入口曾作 `dev:vite` 过渡；**后续已移除**（见进度记录 2026-11-23 chore）。

**Tech Stack:** Next.js 16.x、React 19、TypeScript strict、Tailwind CSS v4（`@tailwindcss/postcss`）、pnpm

---

### Task 1: 依赖与工程配置

- [x] 安装 `next@16`、`@tailwindcss/postcss`、eslint 相关（若需要）
- [x] 改写 `package.json` scripts：`dev`/`build`/`start`/`lint`；`dev:vite` 保留
- [x] 新增 `next.config.ts`、`postcss.config.mjs`；更新 `tsconfig.json`（paths `@/*` → 根；include `app`）
- [x] `.gitignore` 增加 `.next/`

### Task 2: App 壳与首页

- [x] `app/layout.tsx`：metadata、html lang、globals、Providers
- [x] `app/page.tsx`：首页（产品主张 + CTA 链到后续路由占位）
- [x] `components/site-header.tsx` / `site-footer.tsx`：`next/link` 真实路径
- [x] `lib/i18n.tsx`：迁移期客户端可切换中英文（URL 策略待决，进度注明）
- [x] 占位路由：`/skills` `/compare` `/reviews` `/workflows` `/agents`（简单 “即将迁入” 页即可，保证 Header 可点）

### Task 3: 验收

- [x] `pnpm build` 通过
- [x] `pnpm dev` → `http://localhost:3000/` 可见首页壳
- [x] 倒序追加 `doc/进度记录.md`
