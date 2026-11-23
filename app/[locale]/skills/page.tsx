import type { Metadata } from "next";
import SkillsClient from "./skills-client";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/skills");
}

export default function SkillsPage() {
  return <SkillsClient />;
}
