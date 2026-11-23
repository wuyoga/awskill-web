import type { Metadata } from "next";
import CompareClient from "./compare-client";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/compare");
}

export default function ComparePage() {
  return <CompareClient />;
}
