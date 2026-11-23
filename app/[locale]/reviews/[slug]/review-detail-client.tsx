"use client";

import { useParams } from "next/navigation";
import { useAppActions } from "@/components/app-state";
import { ReviewDetailPage } from "@/components/hubs";
import { NotFound } from "@/components/pages/compare-page";
import { useData } from "@/lib/use-data";

export default function ReviewDetailRoute() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const { reviews } = useData();
  const actions = useAppActions();
  const review = reviews.find((item) => item.id === slug);
  if (!review) return <NotFound go={actions.go} />;
  return <ReviewDetailPage review={review} actions={actions} />;
}
