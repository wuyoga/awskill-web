"use client";

import { Suspense } from "react";
import { useAppActions } from "@/components/app-state";
import { ComparePage } from "@/components/pages/compare-page";

function CompareInner() {
  const actions = useAppActions();
  return <ComparePage actions={actions} />;
}

export default function CompareRoute() {
  return (
    <Suspense fallback={<main className="container compare-page" />}>
      <CompareInner />
    </Suspense>
  );
}
