import type { Metadata } from "next";
import AgentsClient from "./agents-client";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/agents");
}

export default function AgentsPage() {
  return <AgentsClient />;
}
