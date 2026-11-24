import type { Metadata } from "next";
import { AgentsPage } from "@/components/hubs";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/agents");
}

export default function AgentsRoute() {
  return <AgentsPage />;
}
