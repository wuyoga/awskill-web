"use client";

import { useAppActions } from "@/components/app-state";
import { AgentsPage } from "@/components/hubs";

export default function AgentsRoute() {
  const actions = useAppActions();
  return <AgentsPage actions={actions} />;
}
