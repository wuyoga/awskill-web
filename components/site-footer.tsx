"use client";

import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-mark";
import { useThemeActions } from "@/components/providers";
import { Link } from "@/i18n/navigation";
import { reviewsHref, searchHref } from "@/lib/routes";

export function SiteFooter() {
  const t = useTranslations("footer");
  const { soon } = useThemeActions();

  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand">
            <BrandMark />
            <span>awskill</span>
          </div>
          <p>{t("tagline")}</p>
          <small>Agent Workflow Skills</small>
        </div>
        <div>
          <strong>{t("discover")}</strong>
          <Link href={searchHref()}>{t("allSkills")}</Link>
          <Link href={reviewsHref()}>{t("latestReviews")}</Link>
          <Link href="/workflows">{t("workflows")}</Link>
          <Link href="/agents">{t("agentCompatibility")}</Link>
        </div>
        <div>
          <strong>{t("resources")}</strong>
          <Link href={reviewsHref("method")}>{t("reviewMethod")}</Link>
          <button type="button" onClick={() => soon(t("securityGuide"))}>
            {t("securityGuide")}
          </button>
          <button type="button" onClick={() => soon(t("agentGuideSoon"))}>
            {t("agentGuide")}
          </button>
        </div>
        <div>
          <strong>{t("about")}</strong>
          <button type="button" onClick={() => soon(t("aboutAwskill"))}>
            {t("aboutAwskill")}
          </button>
          <button type="button" onClick={() => soon(t("submitSkill"))}>
            {t("submitSkill")}
          </button>
          <button type="button" onClick={() => soon(t("contact"))}>
            {t("contact")}
          </button>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{t("copyright")}</span>
        <span>
          <Link href="/privacy">{t("privacy")}</Link>
          {" · "}
          <Link href="/terms">{t("terms")}</Link>
        </span>
      </div>
    </footer>
  );
}
