# Agent 卡片页脚「查看详情 / 浏览 Skills」布局优化 — 设计说明

**Date**: 2026-11-23  
**Status**: Implemented  
**Scope**: PAGE-09 `/agents` Agent 列表卡片页脚  
**Approach**: 方案 1 — 微调现状（左链右钮）

## 问题

Agent 中心卡片页脚两个入口视觉权重接近、垂直对齐不稳，主次不清且显得拥挤。

## 决策摘要

| 项 | 选择 |
|----|------|
| 目标 | 轻主次 + 对齐一起做 |
| 主 CTA | 「浏览 Skills」（进带该 Agent 筛选的 Skills 列表） |
| 次入口 | 「查看详情」（进 `/agents/[slug]`） |
| 排布 | 左链右钮（接近现状，修对齐与样式） |
| 窄屏堆叠 | 不做（方案 2 仅作后续备选） |

两条路径职责不同，均保留；用视觉权重区分，不合并、不删入口。

## 非目标

- 不改文案语义、路由、数据字段
- 不改卡片其它区块（指标、覆盖条、矩阵区）
- 不新增色板 / 不另立按钮体系
- 不做窄屏上下堆叠
- 不把评审建议扩成新信息架构

## 结构

每张 `.agent-card` 的 `.agent-card-actions`：

1. **左**：「查看详情」— 文字链样式 + 箭头图标（可聚焦控件，保留现有 `go(agentHref(...))`）
2. **右**：「浏览 Skills」— 站内 primary 实心按钮（保留现有 `go(searchHref({ agent }))`）

## 布局与样式

- `display: flex; align-items: center; gap: 8px`
- 去掉干扰垂直对齐的 inline `flexWrap`（本方案不依赖换行）
- 行高与主按钮 `min-height` 对齐，四卡页脚基线一致
- 文字链：次要文字色；hover 用下划线或色变；**无**描边底框
- 主按钮：复用全站 primary（与 Header「登录」同类）
- Token：只用现有 CSS 变量

## 实现落点

- `components/hubs.tsx` — Agent 卡片 `agent-card-actions` 的 class / 控件角色
- 对应 CSS（hub / agent-card 相关）— 页脚 flex、文字链样式；收敛该处 inline style

详情页若共用 `.agent-card-actions`，仅允许无副作用的样式统一；不借机改详情顶栏信息架构。

## a11y

- 两个入口均可键盘聚焦与激活
- 文字链保留足够点击热区（不只靠装饰箭头）

## 验收

- [x] 四张卡片：左「查看详情」文字链、右「浏览 Skills」实心钮，垂直居中对齐
- [x] 点击分别进入 Agent 详情 / 带该 Agent 的 Skills 列表（行为与现网一致）
- [x] 中英文切换不出现页脚换行错位（英文略紧可接受）
- [x] `pnpm lint` 通过；手测 `http://localhost:13001/zh/agents`

## 后续备选（本次不做）

方案 2：桌面同本设计；极窄卡片内改为上链下全宽主按钮。仅当手测英文/窄卡仍挤时再开。
