# awskill 页面功能测试报告（Chrome DevTools MCP）

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-11-24 |
| 环境 | `http://127.0.0.1:13001`（`pnpm dev` / Next.js 16.2 Turbopack） |
| 工具 | chrome-devtools-mcp（`navigate` / `snapshot` / `click` / `fill` / `evaluate_script` / `screenshot`） |
| 范围 | MVP 已实现公开页 PAGE-01～PAGE-10（含 zh/en）；不含登录/收藏页/提交等未建页 |
| 默认语言 | `/zh`；英文抽测详情与语言切换 |

---

## 1. 总览

| 结论 | 数量 |
| --- | --- |
| 通过（页面可打开 + 关键静态/SSR 内容正确） | 10 / 10 路由 |
| 阻断缺陷（P0） | 2 |
| 高优缺陷（P1） | 3 |
| 观察项 / 环境噪音 | 3 |

**一句话**：各 PAGE 路由均可 200 打开，详情信息架构与演示数据标注基本到位；**分享对比链接无法还原对比项**，且大量依赖 `router.push` / 客户端 `onClick` 的交互在本轮自动化中失败（与仓内已有「改 Link 规避 go()」记录一致）。

---

## 2. 路由验收矩阵

| ID | 路由 | HTTP / 标题 | 功能检查 | 结果 |
| --- | --- | --- | --- | --- |
| PAGE-01 | `/` → `/zh` | 308/落地首页正常 | 主张文案、四 Agent、精选 Skill、分类入口、演示声明 | **Pass**（搜索提交见缺陷） |
| PAGE-02 | `/zh/skills` | 200「发现 Skill」 | `?q=` / `?category=` URL 状态、筛选侧栏、分页「加载更多」、i18n 保留 query | **Pass**（客户端勾选筛选项见缺陷） |
| PAGE-03 | `/zh/skills/frontend-design` | 200 | 方案 B 安装（四 Agent tab 文案）、兼容矩阵、安全可解释、评测入口、演示徽章 | **Pass**（交互切换 Agent / 收藏见缺陷） |
| PAGE-03b | `/zh/skills/agent-browser` | 200 | **过期提示**（Commit 不一致）、**MCP 关联栏**（Playwright / 必需 / env） | **Pass** |
| PAGE-04 | `/zh/compare?skills=a,b(,c)` | 200 | URL 可分享；应从 query 灌入对比列 | **Fail**（空态，见 BUG-01） |
| PAGE-05 | `/zh/reviews` | 200 | 列表、分维度展示（无综合总分）、方法论区块、演示声明 | **Pass** |
| PAGE-06 | `/zh/reviews/frontend-design-vs-baseline` | 200 | 环境绑定、维度表、运行记录、证据入口、独立性声明 | **Pass** |
| PAGE-07 | `/zh/workflows` | 200 | 3 条工作流卡片、步骤预览、组合风险 | **Pass** |
| PAGE-08 | `/zh/workflows/prd-to-frontend` | 200 | 步骤 IO、按 Agent 批量安装命令 | **Pass**（Agent tab 切换未在自动化中验证成功） |
| PAGE-09 | `/zh/agents` | 200 | 四 Agent 卡片、兼容矩阵、安装目录说明 | **Pass** |
| PAGE-10 | `/zh/agents/claude-code` | 200 | 统计、可用 Skill 列表（含完整/部分支持） | **Pass** |
| 共用 | Header / Footer / i18n | — | 主导航 Link 可用；`EN`↔`中` 保留路径与 query | **Pass** |
| 共用 | 主题切换 | — | 顶栏切换 → `data-theme` + `localStorage awskill:dark` | **Pass** |

未测（产品未实现 / 非本里程碑）：`/login`、`/account/favorites`、`/submit`、`/methodology`、`/security` 独立页。

---

## 3. 缺陷清单

### BUG-01 · P0 · 对比页忽略 URL `?skills=`（PAGE-04 / 可分享对比）

- **复现**：打开  
  `http://127.0.0.1:13001/zh/compare?skills=frontend-design,agent-browser`  
  或三技能版本。
- **期望**：根据 query 展示 2～3 列对比；顶栏对比计数同步。
- **实际**：主文案为「还没有加入对比的 Skill」；顶栏仍为「对比（0）」；地址栏 query **仍保留** skills。
- **影响**：分享链接失效，违背「对比列表进 URL / 可分享」。
- **疑似点**：`AppStateProvider` 中 `useSearchParams` 灌种与 `router.replace` 回写竞态；或客户端 searchParams 未读到 query 而 `router.replace` 也未清掉 URL。

### BUG-02 · P0 · 首页搜索 / 热门词 / Agent 条无法跳转发现页（FR-HOME-01）

- **复现**：首页输入 `frontend` 点「搜索」；或点「前端设计」热门词；或点 Agent 条。
- **期望**：进入 `/zh/skills?q=…` 或 `?agent=…`。
- **实际**：停留在 `/zh` 或 `/zh?`；查询未带入。
- **对照**：同页「按任务浏览」分类已改为 `<Link>`，点击 **成功** 进入  
  `/zh/skills?category=开发与工程`（1666 条、侧栏 pressed）。
- **疑似点**：仍走 `go()` → `router.push`；与进度记录中「避免 onClick+router.push」同一类问题。

### BUG-03 · P1 · Skill 发现页：勾选筛选项不反映到 URL / 列表

- **复现**：在 `/zh/skills?q=frontend` 勾选「任务已实测」。
- **实际**：控件呈 checked，但 URL 无 `status=`，结果仍约「24 / 140」，列表中仍大量「待验证」。
- **对照**：经 Link 带入的 `category=` 初始筛选正常。

### BUG-04 · P1 · 详情页 Agent 安装 Tab / 收藏在自动化点击下无状态变化

- **复现**：`/zh/skills/agent-browser` 点击 Cursor Tab、收藏按钮（含 `element.click()`）。
- **实际**：原生 click 事件可监听到，但 Tab 仍停在 Claude Code，安装命令未切换；`localStorage awskill:favorites` 未写入。
- **对照**：同页主题切换可写 `awskill:dark`。详情 **SSR 内容**（过期提示、MCP、安全说明）正确。
- **说明**：仓内曾有真实浏览器验证「首页 Compare」通过的记录；本轮 MCP 会话中多项 client handler 未生效，**建议人工在本机 Chrome 复核**；若本机也失败则按 hydration / 事件绑定排查。

### BUG-05 · P1 · 加入对比（列表/详情）顶栏计数不增

- **复现**：列表或详情点「加入对比」。
- **实际**：顶栏保持「对比（0）」；与 BUG-01 叠加导致对比闭环不可用。

---

## 4. 环境 / 观察项（非产品逻辑）

| ID | 现象 | 说明 |
| --- | --- | --- |
| OBS-01 | `GET /__nextjs_font/geist-latin.woff2` → **403** | 字体资源失败；可能影响排版回退，不影响路由。 |
| OBS-02 | `ws://…/_next/webpack-hmr` handshake **ERR_INVALID_HTTP_RESPONSE** | Dev HMR 噪音；与功能结论分开看。 |
| OBS-03 | Agent 中心矩阵后半多为采集草稿「未验证」；统计数字偏演示口径 | 有「原型演示 / 采集草稿」标注则符合诚实原则；上线前需与真实验证数对齐。 |

---

## 5. 按决策 / PRD 抽查（内容层）

| 决策 | 抽查 | 结果 |
| --- | --- | --- |
| D-01 兼容按 Skill×Agent | 详情兼容表 + Agent 矩阵 | OK |
| D-02 方案 B 安装 | 详情安装面板四 Agent 命令/目录/卸载 | 静态 OK；Tab 切换自动化 Fail |
| D-03 无综合总分 | 评测中心「分维度结果 · 不合成总分」 | OK |
| D-04 安全可解释 | 权限项 + 原因文案 | OK |
| D-05 Commit 过期提示 | `agent-browser` 验证 Commit ≠ 最新 | OK |
| D-06 本地收藏 | 点击后 localStorage | 本轮 Fail（BUG-04） |
| D-07 MCP 仅详情关联 | `agent-browser` MCP 栏；无独立 MCP 导航 | OK |
| D-08 工作流独立对象 | 步骤 / IO / 组合风险 / 批量安装 | OK |
| D-09 中文默认 + 双语路径 | `/`→`/zh`；切换保留 query | OK |

---

## 6. 建议修复优先级

1. **立即**：修对比 URL 灌种（BUG-01），并加「打开分享链接应看到 N 列」的手工/ e2e 用例。  
2. **立即**：首页搜索与热门入口改为与分类卡片一致的 **Link / 表单 action**，少依赖 `go()`（BUG-02）。  
3. **高优**：排查 `router.push/replace` 与页面级 client 组件 hydration（BUG-03～05）；收藏与 Agent Tab 用真实 Chrome 回归。  
4. **低优**：修复 Geist 字体 403（OBS-01）。

---

## 8. 修复回访（同日）

| 缺陷 | 状态 | 验证 |
| --- | --- | --- |
| BUG-01 对比 `?skills=` | **已修** | `localhost:13001/zh/compare?skills=frontend-design,agent-browser` 显示两列，顶栏「对比（2）」 |
| BUG-02 首页搜索/热门 | **已修** | 热门改为 `<a>`；搜索 `go()` 经 next-intl router → `/zh/skills?q=browser` |
| BUG-03 筛选 URL | **已修** | 勾选「任务已实测」→ URL 含 `status=`，结果 1/1 |
| BUG-04 Agent Tab / 收藏 | **已修**（在 localhost） | Cursor Tab 命令含 `--agent cursor`；`awskill:favorites` 写入 |
| BUG-05 加入对比 | **已修**（在 localhost） | 顶栏「对比（1）」+ `has-compare-dock` |
| OBS 跨源 | **缓解** | `next.config.ts` → `allowedDevOrigins: ['127.0.0.1','localhost']`；自动化优先 `localhost` |

---

## 7. 测试资产

- 基址：`http://127.0.0.1:13001`
- 样例 slug：`frontend-design`、`agent-browser`、`frontend-design-vs-baseline`、`prd-to-frontend`、`claude-code`
- 本报告路径：`doc/测试报告-chrome-devtools-2026-11-24.md`
