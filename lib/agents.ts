/** First-batch Agents (PRD). Stable keys for UI. */
export const AGENTS = ["Claude Code", "Codex", "Cursor", "Windsurf"] as const;
export type AgentName = (typeof AGENTS)[number];

export const CATEGORIES = [
  "开发与工程",
  "设计与用户体验",
  "测试与安全",
  "数据与研究",
  "内容与文档",
  "视觉与多媒体",
  "营销与增长",
  "产品与业务",
  "生产力与自动化",
  "Agent 与工具链",
] as const;

export const CATEGORY_LABEL_EN: Record<(typeof CATEGORIES)[number], string> = {
  开发与工程: "Engineering",
  设计与用户体验: "Design & UX",
  测试与安全: "Testing & Security",
  数据与研究: "Data & Research",
  内容与文档: "Content & Docs",
  视觉与多媒体: "Visual & Media",
  营销与增长: "Marketing & Growth",
  产品与业务: "Product & Business",
  生产力与自动化: "Productivity & Automation",
  "Agent 与工具链": "Agents & Tooling",
};
