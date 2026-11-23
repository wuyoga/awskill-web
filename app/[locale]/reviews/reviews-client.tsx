"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useAppActions } from "@/components/app-state";
import { ReviewsPage } from "@/components/hubs";

function ReviewsInner() {
  const actions = useAppActions();
  const searchParams = useSearchParams();
  const route = useMemo(
    () => ({
      page: "reviews",
      params: new URLSearchParams(searchParams.toString()),
    }),
    [searchParams],
  );
  return <ReviewsPage route={route} actions={actions} />;
}

export default function ReviewsRoute() {
  return (
    <Suspense fallback={<main className="container hub-page" />}>
      <ReviewsInner />
    </Suspense>
  );
}
