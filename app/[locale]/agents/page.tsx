import type { Metadata } from "next";
import { AgentsPage } from "@/components/hubs";
import { catalogSize } from "@/lib/data/catalog";
import { topSkillsByInstalls } from "@/lib/data/query";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/agents");
}

export default async function AgentsRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolved = resolveLocale(locale);
  return (
    <AgentsPage matrixSkills={topSkillsByInstalls(resolved, 24)} catalogTotal={catalogSize()} />
  );
}
