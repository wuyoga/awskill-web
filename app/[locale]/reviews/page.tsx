import type { Metadata } from "next";
import ReviewsClient from "./reviews-client";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/reviews");
}

export default function ReviewsPage() {
  return <ReviewsClient />;
}
