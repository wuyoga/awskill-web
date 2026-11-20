# 发现页 / 对比页 UI 优化 — 设计说明（合并）

**Date**: 2026-11-19  
**Status**: Implemented  
**Related**: `2026-11-19-compare-searchable-select-design.md`（对比 Combobox 细节仍有效）

## 问题清单

| # | 页面 | 问题 | 处理 |
|---|------|------|------|
| 1 | 发现 Skill | 「综合推荐」为原生 `<select>`，展开面板不可控、与站内风格不一致 | 自定义排序下拉面板（无搜索） |
| 2 | 发现 Skill | Title 区字号/间距偏大，首屏浪费，右侧留白被感知为「空占位」 | 方案 A+轻量 B：收紧标题与间距，搜索更贴近标题 |
| 3 | 对比 | 「添加 Skill」原生 select，候选项多难找 | 独立 Combobox；关键字匹配 **name + owner/repo** |

## 非目标

- 不改对比表维度结构
- 面板内不做分类筛选 / 长描述
- 不引入第三方 combobox 库
- Title 右侧不塞插画/统计/CTA（方案 C 不做）
- 不改产品文案语义（可微调间距与字号；排序/搜索占位用既有 i18n 模式）

## 共享视觉

- 触发器：细边框、圆角 ~8px、高度约 34px、hover/focus/open 态清晰
- 面板：`var(--surface)`、细边框、轻阴影、圆角对齐卡片
- 选项行：~36–40px；hover / active 浅底；当前项可勾选或字重强调
- Token：只用现有 CSS 变量，不另立色板

## 1. 排序下拉（发现页）

- 替换 `.results-top` 内原生 select
- 选项仍为：综合推荐 / 最近验证 / 最多使用 / 最新收录
- 无搜索框；Esc / 外侧关闭；键盘可选

## 2. Title 区（发现页）

- 缩小 `.search-page .page-title` 的 h1（相对当前 clamp 下移一档）
- 压缩 `.page-title` 下边距与 title↔搜索间距
- 保持左对齐文案结构；不新增右侧内容块
- 目标：首屏更容易露出搜索 + 分类 + 卡片上沿

## 3. 添加 Skill Combobox（对比页）

- 见既有 design：触发器「选择 Skill…」→ 面板顶搜索 → 列表 name + owner/repo
- 过滤：不区分大小写；空格多 token 全匹配；字段 name / owner / repo / owner/repo
- 选中 → `toggleCompare`；已选项不在候选；最多 3

## 验收

- [ ] 发现页排序面板为自定义样式，可键盘操作
- [ ] 发现页 title 更紧凑，搜索更近标题
- [ ] 对比页可按名称或仓库搜索并加入对比
- [ ] 中英文文案正常；无原生系统菜单观感
