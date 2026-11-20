# Discover / Compare dropdown & title Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** 自定义发现页排序面板、收紧发现页 title、对比页可搜索添加 Skill。

**Architecture:** 在 `src/ui.tsx` 增加 `MenuSelect`（无搜索）与 `SearchableSkillSelect`（名称+仓库搜索）；发现/对比页替换原生 select；CSS 用现有 token。

**Tech Stack:** React 19、Vite 原型、`src/index.css` tokens

## Global Constraints

- 不引入第三方 combobox 库
- 不新增 Title 右侧插画/统计
- 搜索字段：name + owner + repo + owner/repo
- 对比最多 3；已选项不在候选

---

### Task 1: MenuSelect + SearchableSkillSelect

- [ ] 在 `src/ui.tsx` 实现两个组件（外侧点击关闭、Esc、键盘）
- [ ] `src/index.css` 增加 `.menu-select` / `.skill-picker` 样式

### Task 2: 接入发现页排序 + title

- [ ] `SearchPage` 用 `MenuSelect` 替换 sort `<select>`
- [ ] `.search-page .page-title` 收紧字号与间距（A+轻量 B）

### Task 3: 接入对比页

- [ ] `ComparePage` add-slot 用 `SearchableSkillSelect` 替换 `<select>`

### Task 4: 验收与进度

- [ ] 手测 / lint；追加 `doc/进度记录.md`
