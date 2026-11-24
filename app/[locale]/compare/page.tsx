import type { Metadata } from "next";
import CompareClient from "./compare-client";
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
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.skills;
  const initialSkills = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  return <CompareClient initialSkills={initialSkills} />;
}
