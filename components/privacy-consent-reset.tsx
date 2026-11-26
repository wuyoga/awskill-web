"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { clearAnalyticsConsent, updateGtagConsent } from "@/lib/analytics";

export function PrivacyConsentReset() {
  const t = useTranslations("privacy");
  const [done, setDone] = useState(false);

  return (
    <div className="privacy-reset-row">
      <button
        type="button"
        className="secondary privacy-reset"
        onClick={() => {
          clearAnalyticsConsent();
          updateGtagConsent("denied");
          setDone(true);
        }}
      >
        {t("reset")}
      </button>
      {done ? (
        <p className="privacy-reset-done" role="status">
          {t("resetDone")}
        </p>
      ) : null}
    </div>
  );
}
