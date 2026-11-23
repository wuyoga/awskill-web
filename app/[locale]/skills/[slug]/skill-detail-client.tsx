"use client";

import { useParams } from "next/navigation";
import { useAppActions, useFavorites } from "@/components/app-state";
import { DetailPage } from "@/components/pages/skill-detail-page";
import { NotFound } from "@/components/pages/compare-page";
import { useData } from "@/lib/use-data";

export default function SkillDetailRoute() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const { getSkill } = useData();
  const actions = useAppActions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const skill = getSkill(slug);
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
