import type { Metadata } from "next";

import { detailMetadata, metaMessages, resolveLocale, workflowDetailCopy } from "@/lib/seo";
import WorkflowDetailClient from "./workflow-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const copy = workflowDetailCopy(locale, slug);
  const meta = metaMessages(locale).workflowDetail;
  const name = copy?.name ?? slug;
  const title = meta.title.replace("{name}", name);
  const description = copy?.description ?? meta.fallbackDescription;
  return detailMetadata(locale, `/workflows/${encodeURIComponent(slug)}`, { title, description });
}

export default function WorkflowDetailPage() {
  return <WorkflowDetailClient />;
}
