import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LOCALE_HEADER, htmlLang, isLocale, type Locale } from "@/lib/locale";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const raw = headerList.get(LOCALE_HEADER);
  const locale: Locale = raw && isLocale(raw) ? raw : "zh";

  return (
    <html lang={htmlLang(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
