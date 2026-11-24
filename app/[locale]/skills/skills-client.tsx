"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useAppActions } from "@/components/app-state";
import { SearchPage } from "@/components/pages/skills-page";
import type { SkillQueryResult } from "@/lib/data/skill-result";

function SkillsPageInner({ result }: { result: SkillQueryResult }) {
  const actions = useAppActions();
  const searchParams = useSearchParams();
  const route = useMemo(
    () => ({
      page: "search",
      params: new URLSearchParams(searchParams.toString()),
    }),
    [searchParams],
  );
  return <SearchPage route={route} actions={actions} result={result} />;
}

export default function SkillsPage({ result }: { result: SkillQueryResult }) {
  return (
    <Suspense fallback={<main className="container search-page" />}>
      <SkillsPageInner result={result} />
    </Suspense>
  );
}
