"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { useThemeActions } from "@/components/providers";
import { useI18n } from "@/lib/i18n";
import { localized, reviewsHref, searchHref } from "@/lib/routes";

export function SiteFooter() {
  const { t, lang } = useI18n();
  const { soon } = useThemeActions();

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
          <Link href={localized(lang, searchHref())}>{t("全部 Skills", "All Skills")}</Link>
          <Link href={localized(lang, reviewsHref())}>{t("最新评测", "Latest reviews")}</Link>
          <Link href={localized(lang, "/workflows")}>{t("工作流", "Workflows")}</Link>
          <Link href={localized(lang, "/agents")}>{t("Agent 兼容性", "Agent compatibility")}</Link>
        </div>
        <div>
          <strong>{t("资源", "Resources")}</strong>
          <Link href={localized(lang, reviewsHref("method"))}>{t("评测标准", "Review method")}</Link>
          <button type="button" onClick={() => soon("安全指南", "Security guide")}>
            {t("安全指南", "Security guide")}
          </button>
          <button type="button" onClick={() => soon("Agent 入门指南", "Agent starter guide")}>
            {t("Agent 入门", "Agent guide")}
          </button>
        </div>
        <div>
          <strong>{t("关于", "About")}</strong>
          <button type="button" onClick={() => soon("关于 awskill", "About awskill")}>
            {t("关于 awskill", "About awskill")}
          </button>
          <button type="button" onClick={() => soon("提交 Skill", "Submit a Skill")}>
            {t("提交 Skill", "Submit a Skill")}
          </button>
          <button type="button" onClick={() => soon("联系我们", "Contact")}>
            {t("联系我们", "Contact")}
          </button>
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
          <button type="button" onClick={() => soon("隐私政策", "Privacy policy")}>
            {t("隐私", "Privacy")}
          </button>{" "}
          ·{" "}
          <button type="button" onClick={() => soon("服务条款", "Terms of service")}>
            {t("条款", "Terms")}
          </button>
        </span>
      </div>
    </footer>
  );
}
