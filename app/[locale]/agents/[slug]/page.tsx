import type { Metadata } from "next";
import { AGENTS } from "@/lib/data";
import { agentSlug } from "@/lib/routes";
import { detailMetadata, resolveLocale } from "@/lib/seo";
import AgentDetailClient from "./agent-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const agent = AGENTS.find((item) => agentSlug(item) === slug.toLowerCase());
  const name = agent ?? slug;
  const title =
    locale === "zh" ? `${name} · Agent` : `${name} · Agent`;
  const description =
    locale === "zh"
      ? `${name} 的安装差异、覆盖与相关 Skill。`
      : `Install differences, coverage and related Skills for ${name}.`;
  return detailMetadata(locale, `/agents/${encodeURIComponent(slug)}`, { title, description });
}

export default function AgentDetailPage() {
  return <AgentDetailClient />;
}
