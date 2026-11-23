"use client";

import { HomePage as HomePageView } from "@/components/pages/home-page";
import { useAppActions } from "@/components/app-state";

export function HomePage() {
  const actions = useAppActions();
  return <HomePageView actions={actions} />;
}
