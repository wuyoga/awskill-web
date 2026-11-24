import type { Metadata } from "next";
import { WorkflowsPage } from "@/components/hubs";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/workflows");
}

export default function WorkflowsRoute() {
  return <WorkflowsPage />;
}
