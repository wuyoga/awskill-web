import type { Metadata } from "next";
import WorkflowsClient from "./workflows-client";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/workflows");
}

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
