# Compare「添加 Skill」可搜索下拉 — 设计说明

**Date**: 2026-11-19  
**Status**: Implemented（合并进 discover-compare-dropdown-title）  
**Approach**: A — 独立 Combobox（仅对比页添加槽）

## 背景

对比页 `add-slot` 使用原生 `<select>` 列出未入对比的 Skill。候选项多时难以定位；系统面板也无法对齐站内样式。

## 目标

- 用自定义触发器 + 面板替换原生 select
- 支持关键字搜索，匹配 **Skill 名称** 与 **owner/repo**
- 选中后行为与现网一致：`toggleCompare(id)`，最多 3 个，已选项不出现在候选

## 非目标

- 不改对比表结构 / 维度行
- 面板内不做分类筛选、不展示长描述
- 本轮不改发现页「综合推荐」排序下拉（可后续复用样式）
- 不引入第三方 combobox 库

## 交互

1. 触发器展示占位「选择 Skill…」；点击或 ↓ 打开面板
2. 打开后焦点进入搜索框；placeholder：「搜索名称或仓库」
3. 输入即时过滤；多 token（空格）需全部命中
4. 匹配字段（不区分大小写）：`name`、`owner`、`repo`、拼接串 `owner/repo`
5. 列表行：主文案 `name`，次行 `owner/repo`
6. ↑↓ 移动高亮，Enter 选中并关闭；Esc / 点外侧关闭
7. 无匹配时展示「无匹配 Skill」
8. 选中后清空搜索、关闭面板、触发加入对比

## 视觉

- 触发器：全宽、高度与现 `add-slot select` 接近（约 34px）、细边框、圆角 8px
- 面板：白底 / `var(--surface)`、细边框、轻阴影、圆角对齐卡片
- 选项 hover / active：浅底；行高约 36–40px
- 窄列内面板可略宽于触发器，避免文字裁切

## a11y

- 触发器：`aria-expanded`、`aria-haspopup="listbox"`、可见 label（沿用现有 aria-label）
- 列表：`role="listbox"` / `option`；键盘焦点可见
- 搜索框与列表用 `aria-controls` / `aria-activedescendant`（或等价可访问模式）关联

## 实现落点（预期）

- 组件：如 `src/ui.tsx` 或邻近新增 `CompareSkillPicker`（`'use client'` 仅若后续迁 Next；当前 Vite 原型为客户端应用）
- 替换：`ComparePage` 内 `add-slot` 的 `<select>`
- 样式：`src/index.css` 新增 picker 类，复用现有 token，避免新色板

## 验收

- [ ] 可通过名称或 `owner`/`repo` 关键字过滤
- [ ] 选中加入对比，候选列表即时排除已选项
- [ ] Esc / 外侧点击关闭；键盘可选中
- [ ] 视觉与 add-slot / 卡片体系一致，无原生系统菜单
- [ ] 中英文切换下文案正确
