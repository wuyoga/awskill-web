"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { useCallback, useEffect, useState } from "react";

import { CookieConsentBanner } from "@/components/analytics/cookie-consent-banner";
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsent,
  getGaMeasurementId,
  isAnalyticsConsent,
  readAnalyticsConsent,
  updateGtagConsent,
  writeAnalyticsConsent,
} from "@/lib/analytics";

/**
 * Vercel Analytics is cookieless and loads always.
 * GA4 only mounts after explicit accept (and when Measurement ID is set).
 */
export function SiteAnalytics() {
  const gaId = getGaMeasurementId();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readAnalyticsConsent());
    setHydrated(true);

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ consent: AnalyticsConsent | null }>).detail;
      const next = detail?.consent ?? null;
      setConsent(isAnalyticsConsent(next) ? next : null);
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
  }, []);

  const onChoose = useCallback((value: AnalyticsConsent) => {
    writeAnalyticsConsent(value);
    updateGtagConsent(value);
    setConsent(value);
  }, []);

  // Show whenever the visitor has not chosen yet. GA itself still requires a Measurement ID.
  const showBanner = hydrated && consent === null;

  return (
    <>
      <Analytics />
      {gaId && consent === "granted" ? <GoogleAnalytics gaId={gaId} /> : null}
      {showBanner ? <CookieConsentBanner onChoose={onChoose} /> : null}
    </>
  );
}
