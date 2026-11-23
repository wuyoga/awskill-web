import type { Metadata } from "next";
import { workflows } from "@/lib/data";
import { detailMetadata, resolveLocale } from "@/lib/seo";
import WorkflowDetailClient from "./workflow-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug: rawSlug } = await params;
  const locale = resolveLocale(raw);
  const slug = decodeURIComponent(rawSlug);
  const workflow = workflows.find((item) => item.id === slug);
  const title =
    locale === "zh"
      ? `${workflow?.title ?? slug} · 工作流`
      : `${workflow?.title ?? slug} · Workflow`;
  const description =
    workflow?.summary ??
    (locale === "zh" ? "工作流步骤与安装命令。" : "Workflow steps and install commands.");
  return detailMetadata(locale, `/workflows/${encodeURIComponent(slug)}`, { title, description });
}

export default function WorkflowDetailPage() {
  return <WorkflowDetailClient />;
}
