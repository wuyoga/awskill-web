"use client";

import { useAppActions } from "@/components/app-state";
import { WorkflowsPage } from "@/components/hubs";

export default function WorkflowsRoute() {
  const actions = useAppActions();
  return <WorkflowsPage actions={actions} />;
}
