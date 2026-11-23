"use client";

import { useParams } from "next/navigation";
import { useAppActions } from "@/components/app-state";
import { WorkflowDetailPage } from "@/components/hubs";
import { NotFound } from "@/components/pages/compare-page";
import { useData } from "@/lib/use-data";

export default function WorkflowDetailRoute() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const { workflows } = useData();
  const actions = useAppActions();
  const workflow = workflows.find((item) => item.id === slug);
  if (!workflow) return <NotFound go={actions.go} />;
  return <WorkflowDetailPage workflow={workflow} actions={actions} />;
}
