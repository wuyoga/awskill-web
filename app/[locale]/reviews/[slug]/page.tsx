import type { Metadata } from "next";

import { detailMetadata, metaMessages, resolveLocale, reviewDetailCopy } from "@/lib/seo";
import ReviewDetailClient from "./review-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const copy = reviewDetailCopy(locale, slug);
  const meta = metaMessages(locale).reviewDetail;
  const name = copy?.name ?? slug;
  const title = meta.title.replace("{name}", name);
  const description = copy?.description ?? meta.fallbackDescription;
  return detailMetadata(locale, `/reviews/${encodeURIComponent(slug)}`, { title, description });
}

export default function ReviewDetailPage() {
  return <ReviewDetailClient />;
}
