import type { Metadata } from "next";

import { getDetailSkill } from "@/lib/data/query";
import { detailMetadata, metaMessages, resolveLocale, skillDetailCopy } from "@/lib/seo";
import SkillDetailClient from "./skill-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const copy = skillDetailCopy(locale, slug);
  const meta = metaMessages(locale).skillDetail;
  const name = copy?.name ?? slug;
  const title = meta.title.replace("{name}", name);
  const description = copy?.description ?? meta.fallbackDescription;
  return detailMetadata(locale, `/skills/${encodeURIComponent(slug)}`, { title, description });
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const skill = getDetailSkill(resolveLocale(raw), slug) ?? null;
  return <SkillDetailClient skill={skill} />;
}
