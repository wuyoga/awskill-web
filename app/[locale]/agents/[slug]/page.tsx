import type { Metadata } from "next";

import { AGENTS } from "@/lib/data";
import { agentSlug } from "@/lib/routes";
import { detailMetadata, metaMessages, resolveLocale } from "@/lib/seo";
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
  const meta = metaMessages(locale).agentDetail;
  const title = meta.title.replace("{name}", name);
  const description = meta.description.replaceAll("{name}", name);
  return detailMetadata(locale, `/agents/${encodeURIComponent(slug)}`, { title, description });
}

export default function AgentDetailPage() {
  return <AgentDetailClient />;
}
