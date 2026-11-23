import type { Metadata } from "next";
import { reviews } from "@/lib/data";
import { detailMetadata, resolveLocale } from "@/lib/seo";
import ReviewDetailClient from "./review-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const review = reviews.find((item) => item.id === slug);
  const title =
    locale === "zh"
      ? `${review?.title ?? slug} · 评测`
      : `${review?.title ?? slug} · Review`;
  const description =
    review?.summary ??
    (locale === "zh" ? "分维度评测详情。" : "Dimension-based review detail.");
  return detailMetadata(locale, `/reviews/${encodeURIComponent(slug)}`, { title, description });
}

export default function ReviewDetailPage() {
  return <ReviewDetailClient />;
}
