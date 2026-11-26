import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { LOCALES, isLocale } from "@/i18n/locale";
import { homeMetadata, resolveLocale } from "@/lib/seo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  return homeMetadata(resolveLocale(raw));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw) || !routing.locales.includes(raw)) notFound();

  setRequestLocale(raw);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={raw} messages={messages}>
      <Providers locale={raw}>
        <div className="app-shell" id="app-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
        <SiteAnalytics />
      </Providers>
    </NextIntlClientProvider>
  );
}
