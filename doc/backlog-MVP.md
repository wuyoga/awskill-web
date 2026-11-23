# awskill MVP 可执行 Backlog

> 版本：v0.1  
> 日期：2026-11-23  
> 组织方式：按 PRD 里程碑 **M0→M5** 镜像；本仓 **P\*** 仅作工程切片对照。  
> 真源：`doc/PRD.md`、`doc/analysis.md`。冲突时以产品文档为准。  
> 状态约定：`todo` · `blocked` · `done` · `pre-done`（工程预完成，内容/CMS 未闭环）

---

## 0. 当前基线

| 项 | 状态 |
|----|------|
| 工程壳 P0（Next、真实路由） | `done` |
| 核心闭环 P1（静态数据） | `pre-done` |
| 决策增强 P2（对比/评测/工作流/Agent/MCP 栏） | `pre-done` |
| 内容底座 P3 ≈ M1 | `todo`（依赖 M0） |
| 分支 | `dev` |
| 采集管线 → JSON 草稿 | 已有；CMS 导入后置 |

**产品主张**：不只看热度，安装前先确认兼容性、安全风险和真实任务表现。

---

## 1. M0 — 需求冻结与技术设计（门禁）

| ID | 任务 | 状态 | 依赖 | PRD / OQ |
|----|------|------|------|----------|
| M0-T1 | 产品负责人补齐「第 3 项」原文，并书面确认是否进 MVP | `blocked` | 产品负责人 | OQ-01（P0 硬阻塞） |
| M0-T2 | 确认是否增加「高风险」；冻结安全等级枚举 | `todo` | 产品+安全 | OQ-02；D-04 |
| M0-T3 | 冻结评测证据可见性（公开 / 登录 / 分级） | `todo` | 产品+法务/安全 | OQ-05 |
| M0-T4 | 确认首发真实 Skill / 评测 / 工作流数量与质量门槛 | `todo` | 内容负责人 | OQ-03 |
| M0-T5 | 定义安全等级、权限字典、评测方法手册 | `todo` | M0-T2, M0-T3 | M0；PAGE-14/15 |
| M0-T6 | 确认认证边界、提醒渠道、投稿方式 | `todo` | 产品 | OQ-07 前置；M4 边界 |
| M0-T7 | 输出 Next + Strapi + PG + Meilisearch 部署拓扑 | `todo` | — | M0 |
| M0-T8 | Strapi 内容模型 + 角色权限矩阵评审签字 | `todo` | M0-T2～T5 | M0 退出标准 |
| M0-T9 | 安装量口径书面结论（避免伪统计） | `todo` | 产品+数据 | OQ-04（P1，建议 M2 前） |
| M0-T10 | 英文是否与中文同步首发 | `todo` | 产品 | OQ-06（P1；前端双语已有） |

**退出标准**：全部 P0 的 OQ 有负责人与结论；数据模型能支撑一条真实 Skill 完整闭环。

**排期规则**

- OQ-01 未结论 → **禁止**把任何推测写入已承诺范围或实现。
- OQ-02 / OQ-03 / OQ-05 未结 → **不得**开 M1 内容模型定稿与真实内容排期。
- 本仓 P0–P2 **不替代** M0 退出。

---

## 2. M1 / 本仓 P3 — 内容底座与真实数据闭环

| ID | 任务 | 状态 | 依赖 | PRD / 工程 |
|----|------|------|------|------------|
| M1-T1 | 正式环境：Strapi + PostgreSQL + 媒体存储 | `todo` | M0-T7 | M1 |
| M1-T2 | 建模型：Skill / Agent / Compat / Permission / Review / Workflow / MCP | `todo` | M0-T8；OQ-02/05 | §5；D-01～D-08 |
| M1-T3 | 配置角色：编辑 / 评测员 / 审核 / 管理员 | `todo` | M1-T1 | M1 |
| M1-T4 | 本站 `lib/strapi/*` 封装；页面禁止裸 fetch Strapi | `todo` | M1-T1 | code-conventions；P3 DoD |
| M1-T5 | 至少 1 条真实 Skill：草稿→审核→发布 | `todo` | M1-T2～T4；OQ-03 | M1 退出；P3 DoD |
| M1-T6 | 仓库同步 + Commit 不一致 → 过期提示（D-05） | `todo` | M1-T5 | M1 |
| M1-T7 | Meilisearch 索引；发布/下架事件同步（或书面延期） | `todo` | M1-T5 | §6；P3 DoD |
| M1-T8 | 搜索索引一致性校验（定期全量） | `todo` | M1-T7 | M1 |
| M1-T9 | 采集 `ready_for_cms` → Strapi 导入 | `todo` | M1-T2；`doc/采集工作流.md` | 草稿管线已有 |
| M1-T10 | 前端关键读路径切 CMS；静态数据降级或演示标注 | `todo` | M1-T4～T5 | P3；数据诚实 |
| M1-T11 | （可选）评估 collected JSON 体积 / 惰加载 | `todo` | — | 进度记录 |
| M1-T12 | A′ 补丁审阅与一键写回（draft/CMS）：只应用 `pass` + `auto_apply_ok` | `todo` | M1-T9；§3b | 验证写回策略 |

**退出标准**：CMS 发布后可在搜索找到真实内容；源仓库更新能使验证状态显示过期。

```
M0 退出 ──► M1-T1 ──► M1-T2/T3 ──► M1-T4 ──► M1-T5
                                              ├─► M1-T6
                                              ├─► M1-T7 ──► M1-T8
                                              ├─► M1-T9/T10
                                              └─► V 验证 ──► M1-T12（A′ 写回）
```

---

## 3. M2 / M3 — 工程预完成对照与剩余缺口

| 里程碑 | PRD 范围 | 本仓状态 | 剩余缺口 |
|--------|----------|----------|----------|
| M2 | 首页 / 搜索 / 详情兼容+安全+安装 B / 本地收藏 / SEO·i18n | `pre-done` | 真实 CMS 数据；Commit 过期（M1-T6）；统计口径（OQ-04）；空态/错误页清单化 |
| M3 | 对比 / 评测 / 工作流批量安装 / Agent / MCP 关联栏 | `pre-done` | 真实内容；脱敏证据（OQ-05）；禁止演示冒充生产；**不**建独立 MCP 目录（D-07） |

接 CMS 后对 `pre-done` 页面做**真实数据回归**，不重复从零实现页面壳。

---

## 3b. Skill 验证任务包（可交给其他 Agent）

用途：对指定 Skill 独立验证；验证 Agent **只读源仓 + 写报告**，不直接改 CMS/草稿库。

### 写回策略：A′（已确认）

| 阶段 | 谁 | 做什么 |
|------|----|--------|
| 验证 | 测试 Agent | 产出报告 + **机器可读建议补丁**；不写库 |
| 写回 | 内容负责人 / 一键应用任务 | 审补丁 → 应用 `pass` 且 `auto_apply_ok=true`；人工处理 fail / needs_review |

验证**可建议更新**（写在补丁里，默认不落库）：commit/过期、安装命令文案、权限线索、站内页不一致字段。  
**不得在验证回合直接定论落库**：风险等级终稿、compat 终态、评测维度结论、证据公开策略（OQ 未结时尤其禁止）。

### 输入（发起方填写）

```yaml
skill_id_or_slug: ""
repository_url: ""
target_commit: ""
agents: [claude-code, codex, cursor, windsurf]
locale_pages: [/zh/skills/<slug>]
draft_or_cms: draft | cms | production_candidate
```

### 验证项

| 编号 | 项 | 通过条件 |
|------|-----|----------|
| V-01 | 来源与身份 | 仓库可访问；命名一致；记录 head vs target commit |
| V-02 | 安装（方案 B） | 每目标 Agent：目录/格式/安装/卸载完整且匹配约定 |
| V-03 | 兼容性（D-01） | Skill×Agent 独立记录；有证据或显式「未验证」 |
| V-04 | 安全权限（D-04） | 等级 + 权限事实 + 原因；未评估须标注 |
| V-05 | 结论新鲜度（D-05） | 绑定环境/版本；commit 不一致 → 过期或需重验 |
| V-06 | 评测维度（D-03） | 「已实测」按维度展示；禁止模糊综合总分 |
| V-07 | 证据脱敏 | 无密钥/隐私；不确定 → needs_review |
| V-08 | 非目标守门 | 无在线执行、无综合排名、不越权承诺四 Agent 外安装 |
| V-09 | 站内页对照 | 页与验证结果一致；演示须有演示标注 |
| V-10 | 工作流关联 | 若属 Workflow：步骤 IO、组合风险、整体验证可追溯 |

### 建议补丁 schema（随报告附带）

```json
{
  "skill": "<slug>",
  "patches": [
    {
      "field": "verifiedCommit",
      "value": "<sha>",
      "evidence": "<url-or-note>",
      "from_check": "V-05",
      "auto_apply_ok": true
    }
  ]
}
```

### 回报格式（验证 Agent 原样返回）

```markdown
## Skill 验证报告
- skill:
- repo:
- verified_at: ISO8601
- target_commit:
- source_head_commit:
- stale: yes|no
- agents_tested: []

### Results
| ID | Result | Evidence | Notes |
|----|--------|----------|-------|
| V-01 | pass\|fail\|skip\|needs_review | | |
| … | | | |

### Compat matrix
| Agent | Status | Evidence | Agent/env version |
|-------|--------|----------|-------------------|

### Permissions / Risk
- risk_level:
- summary:
- permissions: [{key, status, reason}]

### Install (per Agent)
| Agent | install | uninstall | dir/format | OK? |
|-------|---------|-----------|------------|-----|

### Suggested patches
（JSON 或上表等价）

### Blockers / OQ hits
-

### Overall
- verdict: ready_for_cms | needs_fix | reject
- recommended_next:
```

### 派工

- **1 Skill = 1 验证任务**；多 Agent 写在同一 matrix。
- 优先：`ready_for_cms` 草稿或 OQ-03 首发清单。

---

## 4. M4 — 账户与内容增长

| ID | 任务 | 依赖 | PRD |
|----|------|------|-----|
| M4-T1 | GitHub OAuth | M1 退出；M0-T6 | FR-AUTH-01 |
| M4-T2 | 匿名收藏 ↔ 账户收藏幂等合并 | M4-T1；D-06 | FR-AUTH-02 |
| M4-T3 | 收藏管理页 | M4-T2 | PAGE-12 |
| M4-T4 | 站内提醒 + 偏好；去重/重试 | M4-T1；OQ-07 | FR-NOTIFY-01 |
| M4-T5 | 邮件提醒（仅当 OQ-07 需要） | M4-T4 | OQ-07 |
| M4-T6 | Skill 投稿 + 审核状态机 | M0-T6；M1-T3 | FR-SUBMIT-*；PAGE-13 |

**退出标准**：登录后跨设备收藏与可控提醒；投稿不绕过审核公开。

---

## 5. M5 — 上线准备

| ID | 任务 | 依赖 | PRD |
|----|------|------|-----|
| M5-T1 | 清除演示数据/硬编码统计 | M1 真实内容；OQ-04 | MVP 验收 7 |
| M5-T2 | 权限与安全渗透 | M4 写接口 | NFR-04 |
| M5-T3 | WCAG 2.2 AA 关键页 | M2/M3 稳定 | NFR-03 |
| M5-T4 | 搜索质量样本 + 零结果词 | M1-T7 | §6 |
| M5-T5 | 四 Agent 安装 + 跨浏览器/移动回归 | V 任务包批量 | M5 |
| M5-T6 | 监控/告警/备份/恢复/审计 | M0-T7 | NFR-07 |
| M5-T7 | 隐私政策、条款、安全指南、评测标准 | M0-T5 | PAGE-14/15 |
| M5-T8 | 下架/纠错/安全事件响应流程 | — | M5 |

---

## 6. 全图依赖

```
OQ-01 ──► 范围冻结
OQ-02/03/05 ──► M0 退出 ──► M1（Strapi / 真实 Skill / 过期 / 搜索）
                              │
                              ├─► Skill 验证 V（并行）──► A′ 补丁审 → 一键写回
                              ├─► 前端读路径切 CMS（M1-T10）
                              └─► M2/M3 真实数据回归
                                        └─► M4 ──► M5
```

---

## 7. 明确不进本 Backlog（MVP 非目标 / 发布后）

- Skill 在线执行/托管运行
- 独立 MCP 目录与全站 MCP 导航
- 用户评分替代专业评测
- 四个 Agent 之外的安装承诺
- 单一综合分排名
- 付费交易或分成
- 更多 Agent、自动安装客户端、团队收藏夹等（见 PRD §12）

---

## 8. 未决问题速查

| 编号 | 问题 | 优先级 | 截止点 |
|------|------|--------|--------|
| OQ-01 | 「第 3 项」原文 | P0 | M0 结束前 |
| OQ-02 | 是否增加「高风险」 | P0 | 内容模型冻结前 |
| OQ-03 | 首发真实数量 | P0 | M1 排期前 |
| OQ-04 | 安装量口径 | P1 | M2 前 |
| OQ-05 | 评测证据可见性 | P0 | 证据模型冻结前 |
| OQ-06 | 英文是否同步首发 | P1 | M2 前 |
| OQ-07 | 站内提醒是否够 / 是否要邮件 | P1 | M4 前 |

---

## 修订记录

| 日期 | 变更 |
|------|------|
| 2026-11-23 | 初版：M0–M5 backlog；Skill 验证包；写回策略 A′ |
