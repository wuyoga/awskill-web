"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useAppActions } from "@/components/app-state";
import { SearchPage } from "@/components/pages/skills-page";

function SkillsPageInner() {
  const actions = useAppActions();
  const searchParams = useSearchParams();
  const route = useMemo(
    () => ({
      page: "search",
      params: new URLSearchParams(searchParams.toString()),
    }),
    [searchParams],
  );
  return <SearchPage route={route} actions={actions} />;
}

export default function SkillsPage() {
  return (
    <Suspense fallback={<main className="container search-page" />}>
      <SkillsPageInner />
    </Suspense>
  );
}
