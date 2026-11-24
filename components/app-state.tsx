"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { type AppActions } from "@/components/shared";
import { CompareDock } from "@/components/pages/compare-page";
import { useThemeActions } from "@/components/providers";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import {
  compareHref,
  compareSearchMatches,
  parseCompareSkillIds,
  resolveCompareSkillIds,
  sameCompareIds,
} from "@/lib/routes";
import { stripLocale } from "@/i18n/locale";
import type { Skill } from "@/lib/data";

function barePathOf(pathname: string) {
  return stripLocale(pathname).replace(/\/$/, "") || "/";
}

/** Address bar, only while `useSearchParams` has not caught up on a hard load. */
function compareSkillsFromWindow(): string[] | null {
  if (typeof window === "undefined") return null;
  if (barePathOf(window.location.pathname) !== "/compare") return null;
  return parseCompareSkillIds(new URLSearchParams(window.location.search).get("skills"));
}

function resolveCompareSkillsFromQuery(skillsQuery: string): string[] {
  return resolveCompareSkillIds(skillsQuery, compareSkillsFromWindow());
}

type FavoritesCtx = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (skill: Skill) => void;
};

const FavoritesContext = createContext<FavoritesCtx>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

const CompareContext = createContext<AppActions>({
  go: () => {},
  soon: () => {},
  compareIds: [],
  compareHydrated: false,
  toggleCompare: () => {},
  seedCompare: () => {},
});

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const favListeners = new Set<() => void>();
const EMPTY_FAVORITES: string[] = [];
let favStore: string[] = EMPTY_FAVORITES;
let favBootstrapped = false;

function bootstrapFav() {
  if (favBootstrapped || typeof window === "undefined") return;
  favBootstrapped = true;
  const loaded = readJSON<string[]>("awskill:favorites", EMPTY_FAVORITES);
  favStore = loaded.length === 0 ? EMPTY_FAVORITES : loaded;
}

function subscribeFav(listener: () => void) {
  bootstrapFav();
  favListeners.add(listener);
  return () => {
    favListeners.delete(listener);
  };
}

function getFavSnapshot() {
  bootstrapFav();
  return favStore;
}

function setFavStore(next: string[]) {
  favStore = next.length === 0 ? EMPTY_FAVORITES : next;
  localStorage.setItem("awskill:favorites", JSON.stringify(next));
  favListeners.forEach((listener) => listener());
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function useAppActions() {
  return useContext(CompareContext);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const { soon } = useThemeActions();
  const favorites = useSyncExternalStore(subscribeFav, getFavSnapshot, () => EMPTY_FAVORITES);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  /** Block URL writes until we've seeded from `?skills=` (avoids wiping shared links). */
  const [compareHydrated, setCompareHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const barePath = barePathOf(pathname);
  const onCompare = barePath === "/compare";
  const skillsQuery = onCompare ? (searchParams.get("skills") ?? "") : null;

  // Seed from URL when entering /compare or when the share query changes (e.g. back/forward).
  useEffect(() => {
    if (!onCompare || skillsQuery === null) {
      setCompareHydrated(false);
      return;
    }
    const fromUrl = resolveCompareSkillsFromQuery(skillsQuery);
    setCompareIds((current) => {
      if (fromUrl.length > 0) {
        return sameCompareIds(current, fromUrl) ? current : fromUrl;
      }
      // Bare `/compare`: keep in-memory selection (dock → compare) on first enter.
      if (!compareHydrated && current.length > 0) return current;
      return sameCompareIds(current, fromUrl) ? current : fromUrl;
    });
    setCompareHydrated(true);
    // compareHydrated intentionally omitted: only gates the "keep memory on bare enter" branch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed on route/query, not hydrate flips
  }, [onCompare, skillsQuery]);

  // Keep /compare URL in sync with selection — only after seed. Empty selection clears query.
  useEffect(() => {
    if (!onCompare || !compareHydrated) return;
    if (!compareSearchMatches(window.location.search, compareIds)) {
      router.replace(compareHref(compareIds), { scroll: false });
    }
  }, [onCompare, compareHydrated, compareIds, router]);

  const go = useCallback(
    (href: string) => {
      // next-intl router expects locale-free paths (`/skills?q=…`).
      router.push(href);
    },
    [router],
  );

  const notify = useCallback((text: string) => setToast(text), []);

  const seedCompare = useCallback((ids: string[]) => {
    const next = ids.filter(Boolean).slice(0, 3);
    setCompareIds((current) => (sameCompareIds(current, next) ? current : next));
    setCompareHydrated(true);
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setCompareIds((current) => {
        if (current.includes(id)) return current.filter((item) => item !== id);
        if (current.length >= 3) {
          notify(t("compareMax"));
          return current;
        }
        return [...current, id];
      });
    },
    [notify, t],
  );

  const toggleFavorite = useCallback(
    (skill: Skill) => {
      const next = !getFavSnapshot().includes(skill.id);
      setFavStore(
        next
          ? [...getFavSnapshot(), skill.id]
          : getFavSnapshot().filter((id) => id !== skill.id),
      );
      notify(
        next ? t("bookmarked", { name: skill.name }) : t("unbookmarked", { name: skill.name }),
      );
    },
    [notify, t],
  );

  const favoritesValue = useMemo<FavoritesCtx>(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
    }),
    [favorites, toggleFavorite],
  );

  const actions = useMemo<AppActions>(
    () => ({
      go,
      soon,
      compareIds,
      compareHydrated,
      toggleCompare,
      seedCompare,
    }),
    [go, soon, compareIds, compareHydrated, toggleCompare, seedCompare],
  );

  const showCompareDock = compareIds.length > 0 && !onCompare;

  useEffect(() => {
    const shell = document.getElementById("app-shell");
    shell?.classList.toggle("has-compare-dock", showCompareDock);
    return () => shell?.classList.remove("has-compare-dock");
  }, [showCompareDock]);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.getElementById("global-search");
        if (input) input.focus();
        else {
          router.push("/skills");
          window.setTimeout(() => document.getElementById("global-search")?.focus(), 60);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <FavoritesContext.Provider value={favoritesValue}>
      <CompareContext.Provider value={actions}>
        {children}
        {showCompareDock ? <CompareDock actions={actions} /> : null}
        {toast ? (
          <div className="toast" role="status">
            {toast}
          </div>
        ) : null}
      </CompareContext.Provider>
    </FavoritesContext.Provider>
  );
}
