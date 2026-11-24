import type { Metadata } from "next";
import SkillsClient from "./skills-client";
import { querySkills, toSearchParams } from "@/lib/data/query";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/skills");
}

export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const result = querySkills(resolveLocale(locale), toSearchParams(sp));
  return <SkillsClient result={result} />;
}
