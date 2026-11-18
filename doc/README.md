# awskill 产品文档

本目录用于沉淀 awskill 从高保真原型走向正式产品的分析依据、产品需求和后续开发任务。

## 文档索引

| 文档 | 用途 |
| --- | --- |
| [analysis.md](./analysis.md) | 记录背景、现状盘点、需求推导、关键决策、风险与待确认事项 |
| [PRD.md](./PRD.md) | 定义正式产品范围、功能需求、数据模型、非功能要求、里程碑和验收标准 |
| [进度记录.md](./进度记录.md) | AI/人工开发进度（倒序追加；模板见 `.cursor/rules/progress-log.mdc`） |

## AI 开发约束

根目录 `AGENTS.md` + `.cursor/rules/*.mdc`：

| 规则 | 用途 |
| --- | --- |
| `code-conventions` | 工程硬约束、目录、RSC、env、Vite→Next 迁移 |
| `product-guardrails` | PRD/决策 D-01～D-09、演示数据诚实、全部 OQ-* |
| `workflow` | P0～P3 DoD；与 PRD M0–M5 对照；验收 |
| `progress-log` | 进度记录模板 |
| `figma-honesty` | Figma 读稿诚实性（按需，非 always） |

冲突优先级：**产品文档 > 本仓 rules**。对外排期/验收以 PRD **M*** 为准；本仓 **P*** 仅为工程切片。

## 使用约定

1. `analysis.md` 解释“为什么这样设计”，产品决策变化时应同步更新决策记录。
2. `PRD.md` 解释“要做什么、做到什么程度”，后续 Issue、Sprint 和验收均应引用其中的需求编号。
3. 原型中的数量、评测结论和时间均为演示数据，不得直接作为正式上线数据。
4. 文档未确认项不能被默认视为需求；其中“第 3 项”必须由产品负责人补充原文后才能排期。
5. 每个可复述开发单元结束后追加 [进度记录.md](./进度记录.md)。

## 当前基线

- 产品：awskill（Agent Workflow Skills）
- 域名：awskill.com
- 当前实现：React 19 + Vite 8 + Tailwind CSS 4 高保真原型
- 目标架构：Next.js 16 + Strapi CMS + PostgreSQL + Meilisearch
- 包管理：pnpm
- 开发分支：`dev`
- 首批 Agent：Claude Code、Codex、Cursor、Windsurf
- 文档状态：初版，可用于技术方案设计和 MVP 任务拆分
