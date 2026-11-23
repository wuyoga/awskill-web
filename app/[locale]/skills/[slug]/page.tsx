import type { Metadata } from "next";
import { getSkill } from "@/lib/data";
import { detailMetadata, resolveLocale } from "@/lib/seo";
import SkillDetailClient from "./skill-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const skill = getSkill(slug);
  const title =
    locale === "zh"
      ? `${skill?.name ?? slug} · Skill 详情`
      : `${skill?.name ?? slug} · Skill detail`;
  const description =
    skill?.description ??
    (locale === "zh"
      ? "查看兼容性、安全权限与安装方式。"
      : "Check compatibility, security permissions and install steps.");
  return detailMetadata(locale, `/skills/${encodeURIComponent(slug)}`, { title, description });
}

export default function SkillDetailPage() {
  return <SkillDetailClient />;
}
