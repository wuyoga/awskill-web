/** Analytics helpers — GA4 Measurement ID is public (not a secret). */

export const ANALYTICS_CONSENT_KEY = "awskill:analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "awskill-analytics-consent";

export type AnalyticsConsent = "granted" | "denied";

export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return undefined;
  return id;
}

export function isGaConfigured(): boolean {
  return Boolean(getGaMeasurementId());
}

export function isAnalyticsConsent(value: unknown): value is AnalyticsConsent {
  return value === "granted" || value === "denied";
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return isAnalyticsConsent(raw) ? raw : null;
  } catch {
    /* private mode */
  }
  return null;
}

function emitConsent(value: AnalyticsConsent | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { consent: value } }),
  );
}

export function writeAnalyticsConsent(value: AnalyticsConsent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* private mode */
  }
  emitConsent(value);
}

/** Clears stored choice so the consent banner can show again. */
export function clearAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
  } catch {
    /* private mode */
  }
  emitConsent(null);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Push Consent Mode update after the visitor chooses. */
export function updateGtagConsent(value: AnalyticsConsent): void {
  const granted = value === "granted";
  const payload = {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  } as const;

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", payload);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(["consent", "update", payload]);
}
