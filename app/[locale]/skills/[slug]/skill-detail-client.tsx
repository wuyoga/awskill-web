"use client";

import { useAppActions, useFavorites } from "@/components/app-state";
import { DetailPage } from "@/components/pages/skill-detail-page";
import { NotFound } from "@/components/pages/compare-page";
import type { Skill } from "@/lib/data";

export default function SkillDetailRoute({ skill }: { skill: Skill | null }) {
  const actions = useAppActions();
  const { isFavorite, toggleFavorite } = useFavorites();
  if (!skill) return <NotFound go={actions.go} />;
  return (
    <DetailPage
      key={skill.id}
      skill={skill}
      actions={actions}
      favorite={isFavorite(skill.id)}
      onFavorite={() => toggleFavorite(skill)}
    />
  );
}
