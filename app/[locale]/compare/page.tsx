import type { Metadata } from "next";
import CompareClient from "./compare-client";
import { getSkillsByIds } from "@/lib/data/query";
import { parseCompareSkillIds } from "@/lib/routes";
import { hubMetadata, resolveLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return hubMetadata(resolveLocale(locale), "/compare");
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const raw = sp.skills;
  const initialSkills = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  const compared = getSkillsByIds(resolveLocale(locale), parseCompareSkillIds(initialSkills));
  return <CompareClient initialSkills={initialSkills} compared={compared} />;
}
