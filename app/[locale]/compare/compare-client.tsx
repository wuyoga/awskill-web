"use client";

import { Suspense, useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useAppActions } from "@/components/app-state";
import { ComparePage } from "@/components/pages/compare-page";
import type { Skill } from "@/lib/data";
import { parseCompareSkillIds, sameCompareIds } from "@/lib/routes";

function CompareInner({
  initialSkills,
  compared,
}: {
  initialSkills: string;
  compared: Skill[];
}) {
  const actions = useAppActions();
  const { compareIds, compareHydrated, seedCompare } = actions;
  const searchParams = useSearchParams();
  const skillsParam = searchParams.get("skills") ?? initialSkills;

  const urlIds = useMemo(() => {
    const fromParam = parseCompareSkillIds(skillsParam);
    if (fromParam.length) return fromParam;
    if (typeof window === "undefined") return parseCompareSkillIds(initialSkills);
    return parseCompareSkillIds(
      new URLSearchParams(window.location.search).get("skills") ?? initialSkills,
    );
  }, [skillsParam, initialSkills]);

  // One-shot seed only before hydrate — never overwrite user removals/adds.
  // Empty URL: leave in-memory selection (dock → bare /compare) to app-state.
  useLayoutEffect(() => {
    if (compareHydrated || !urlIds.length) return;
    if (!sameCompareIds(compareIds, urlIds)) seedCompare(urlIds);
  }, [urlIds, compareIds, compareHydrated, seedCompare]);

  return <ComparePage actions={actions} urlIds={urlIds} compared={compared} />;
}

export default function CompareRoute({
  initialSkills = "",
  compared = [],
}: {
  initialSkills?: string;
  compared?: Skill[];
}) {
  return (
    <Suspense fallback={<main className="container compare-page" />}>
      <CompareInner initialSkills={initialSkills} compared={compared} />
    </Suspense>
  );
}
