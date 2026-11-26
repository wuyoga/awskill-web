"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { AnalyticsConsent } from "@/lib/analytics";

type Props = {
  onChoose: (value: AnalyticsConsent) => void;
};

export function CookieConsentBanner({ onChoose }: Props) {
  const t = useTranslations("consent");

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
      <div className="cookie-consent-inner">
        <p id="cookie-consent-title" className="cookie-consent-copy">
          {t("message")}{" "}
          <Link href="/privacy" className="cookie-consent-privacy">
            {t("privacy")}
          </Link>
        </p>
        <div className="cookie-consent-actions">
          <button type="button" className="cookie-consent-reject" onClick={() => onChoose("denied")}>
            {t("reject")}
          </button>
          <button type="button" className="cookie-consent-accept" onClick={() => onChoose("granted")}>
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
