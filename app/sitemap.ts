import type { MetadataRoute } from "next";
import { AGENTS, prototypeSkills, reviews, workflows } from "@/lib/data";
import { LOCALES } from "@/lib/locale";
import { agentSlug } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS = ["/", "/skills", "/compare", "/reviews", "/workflows", "/agents"] as const;

function localeEntries(barePath: string, lastModified: Date): MetadataRoute.Sitemap {
  const path = barePath === "/" ? "" : barePath;
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    alternates: {
      languages: {
        "zh-CN": `${SITE_URL}/zh${path}`,
        en: `${SITE_URL}/en${path}`,
        "x-default": `${SITE_URL}/zh${path}`,
      },
    },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const barePaths = [
    ...STATIC_PATHS,
    ...prototypeSkills.map((skill) => `/skills/${encodeURIComponent(skill.id)}`),
    ...reviews.map((review) => `/reviews/${encodeURIComponent(review.id)}`),
    ...workflows.map((workflow) => `/workflows/${encodeURIComponent(workflow.id)}`),
    ...AGENTS.map((agent) => `/agents/${encodeURIComponent(agentSlug(agent))}`),
  ];

  return barePaths.flatMap((bare) => localeEntries(bare, now));
}
