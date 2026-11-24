import type { Metadata } from "next";
import { HomePage } from "@/components/pages/home-page";
import { getHomeCatalog } from "@/lib/data/query";
import { homeMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return homeMetadata(resolveLocale(locale));
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const catalog = getHomeCatalog(resolveLocale(locale));
  return <HomePage {...catalog} />;
}
