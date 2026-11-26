import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/locale";
import { pageMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getTranslations({ locale, namespace: "terms" });
  return pageMetadata(locale, "/terms", {
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);

  const t = await getTranslations("terms");

  return (
    <main className="legal-page container">
      <header className="legal-hero">
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
        <p className="legal-updated">{t("updated")}</p>
      </header>

      <article className="legal-body">
        <section>
          <h2>{t("acceptance.heading")}</h2>
          <p>{t("acceptance.body")}</p>
        </section>

        <section>
          <h2>{t("service.heading")}</h2>
          <p>{t("service.body")}</p>
          <p>{t("service.not")}</p>
        </section>

        <section>
          <h2>{t("demo.heading")}</h2>
          <p>{t("demo.body")}</p>
        </section>

        <section>
          <h2>{t("thirdParty.heading")}</h2>
          <p>{t("thirdParty.body")}</p>
          <p>{t("thirdParty.install")}</p>
        </section>

        <section>
          <h2>{t("reviews.heading")}</h2>
          <p>{t("reviews.body")}</p>
          <p>{t("reviews.disclaimer")}</p>
        </section>

        <section>
          <h2>{t("accounts.heading")}</h2>
          <p>{t("accounts.body")}</p>
        </section>

        <section>
          <h2>{t("acceptable.heading")}</h2>
          <p>{t("acceptable.intro")}</p>
          <ul>
            <li>{t("acceptable.items.scrape")}</li>
            <li>{t("acceptable.items.misrepresent")}</li>
            <li>{t("acceptable.items.malware")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("ip.heading")}</h2>
          <p>{t("ip.body")}</p>
        </section>

        <section>
          <h2>{t("liability.heading")}</h2>
          <p>{t("liability.body")}</p>
        </section>

        <section>
          <h2>{t("changes.heading")}</h2>
          <p>{t("changes.body")}</p>
        </section>

        <section>
          <h2>{t("contact.heading")}</h2>
          <p>
            {t("contact.beforePrivacy")}{" "}
            <Link href="/privacy">{t("contact.privacyLink")}</Link>
            {t("contact.afterPrivacy")}
          </p>
        </section>
      </article>
    </main>
  );
}
