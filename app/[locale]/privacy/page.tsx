import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PrivacyConsentReset } from "@/components/privacy-consent-reset";
import { isLocale } from "@/i18n/locale";
import { pageMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getTranslations({ locale, namespace: "privacy" });
  return pageMetadata(locale, "/privacy", {
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);

  const t = await getTranslations("privacy");

  return (
    <main className="legal-page container">
      <header className="legal-hero">
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
        <p className="legal-updated">{t("updated")}</p>
      </header>

      <article className="legal-body">
        <section>
          <h2>{t("overview.heading")}</h2>
          <p>{t("overview.body")}</p>
        </section>

        <section>
          <h2>{t("collect.heading")}</h2>
          <p>{t("collect.intro")}</p>
          <ul>
            <li>{t("collect.ga")}</li>
            <li>{t("collect.vercel")}</li>
            <li>{t("collect.favorites")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("consent.heading")}</h2>
          <p>{t("consent.eea")}</p>
          <p>{t("consent.other")}</p>
        </section>

        <section>
          <h2>{t("use.heading")}</h2>
          <p>{t("use.body")}</p>
          <p>{t("use.ads")}</p>
        </section>

        <section>
          <h2>{t("retention.heading")}</h2>
          <p>{t("retention.body")}</p>
          <p>{t("retention.processors")}</p>
        </section>

        <section>
          <h2>{t("rights.heading")}</h2>
          <p>{t("rights.body")}</p>
          <p>{t("rights.contact")}</p>
          <PrivacyConsentReset />
        </section>
      </article>
    </main>
  );
}
