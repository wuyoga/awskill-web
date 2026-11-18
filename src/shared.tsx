import { useCallback, useRef, useState } from "react";
import { useI18n } from "./i18n";
import { BrandMark, Icon } from "./ui";

export type Route = { page: string; id?: string; params: URLSearchParams };

export function searchHref(params: { q?: string; category?: string; agent?: string } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
  const text = query.toString();
  return `#/search${text ? `?${text}` : ""}`;
}

export const skillHref = (id: string) => `#/skill/${encodeURIComponent(id)}`;

export type AppActions = {
  go: (href: string) => void;
  soon: (zh: string, en: string) => void;
  compareIds: string[];
  toggleCompare: (id: string) => void;
};

export function Footer({ actions }: { actions: AppActions }) {
  const { go, soon } = actions;
  const { t } = useI18n();
  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand">
            <BrandMark />
            <span>awskill</span>
          </div>
          <p>
            {t(
              "发现、评测并安全使用适合你的 AI Agent Skills。",
              "Discover, evaluate and safely use the AI Agent Skills that fit you.",
            )}
          </p>
          <small>Agent Workflow Skills</small>
        </div>
        <div>
          <strong>{t("发现", "Discover")}</strong>
          <button onClick={() => go("#/search")}>{t("全部 Skills", "All Skills")}</button>
          <button onClick={() => go("#/reviews")}>{t("最新评测", "Latest reviews")}</button>
          <button onClick={() => go("#/workflows")}>{t("工作流", "Workflows")}</button>
          <button onClick={() => go("#/agents")}>{t("Agent 兼容性", "Agent compatibility")}</button>
        </div>
        <div>
          <strong>{t("资源", "Resources")}</strong>
          <button onClick={() => go("#/reviews?section=method")}>
            {t("评测标准", "Review method")}
          </button>
          <button onClick={() => soon("安全指南", "Security guide")}>
            {t("安全指南", "Security guide")}
          </button>
          <button onClick={() => soon("Agent 入门指南", "Agent starter guide")}>
            {t("Agent 入门", "Agent guide")}
          </button>
        </div>
        <div>
          <strong>{t("关于", "About")}</strong>
          <button onClick={() => soon("关于 awskill", "About awskill")}>
            {t("关于 awskill", "About awskill")}
          </button>
          <button onClick={() => soon("提交 Skill", "Submit a Skill")}>
            {t("提交 Skill", "Submit a Skill")}
          </button>
          <button onClick={() => soon("联系我们", "Contact")}>{t("联系我们", "Contact")}</button>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          {t(
            "© 2026 awskill. 独立的 Agent Skill 评测与发现平台。",
            "© 2026 awskill. An independent Agent Skill review and discovery platform.",
          )}
        </span>
        <span>
          <button onClick={() => soon("隐私政策", "Privacy policy")}>{t("隐私", "Privacy")}</button>{" "}
          ·{" "}
          <button onClick={() => soon("服务条款", "Terms of service")}>{t("条款", "Terms")}</button>
        </span>
      </div>
    </footer>
  );
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  }, []);
  return [copied, copy] as const;
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  const { l } = useI18n();
  return (
    <span className={`recommendation ${verdict === "推荐" ? "" : "conditional"}`}>
      <Icon name={verdict === "推荐" ? "check" : "warning"} size={15} /> {l(verdict)}
    </span>
  );
}
