import type { Metadata } from "next";
import { HomePageClient } from "./home-client";
import { homeMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return homeMetadata(resolveLocale(locale));
}

export default function LocaleHomePage() {
  return <HomePageClient />;
}
