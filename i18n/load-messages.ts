import type { Locale } from "@/i18n/locale";

const NAMESPACES = [
  "common",
  "nav",
  "footer",
  "home",
  "skills",
  "skillDetail",
  "compare",
  "reviews",
  "workflows",
  "agents",
  "privacy",
  "terms",
  "consent",
  "enums",
  "meta",
  "ui",
] as const;

export type MessageNamespace = (typeof NAMESPACES)[number];

export async function loadMessages(locale: Locale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`./messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}
