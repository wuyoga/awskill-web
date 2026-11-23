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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type AppActions } from "@/components/shared";
import { CompareDock } from "@/components/pages/compare-page";
import { useThemeActions } from "@/components/providers";
import { compareHref, parseCsvParam } from "@/lib/routes";
import { useI18n } from "@/lib/i18n";
import { localizeHref, stripLocale } from "@/lib/locale";
import type { Skill } from "@/lib/data";

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
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
  toggleCompare: () => {},
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
  const { lang } = useI18n();
  const { soon } = useThemeActions();
  const favorites = useSyncExternalStore(subscribeFav, getFavSnapshot, () => EMPTY_FAVORITES);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  /** Block URL writes until we've seeded from `?skills=` (avoids wiping shared links). */
  const [compareHydrated, setCompareHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const tt = useCallback((zh: string, en: string) => (lang === "zh" ? zh : en), [lang]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const barePath = stripLocale(pathname);
  const skillsQuery = barePath === "/compare" ? (searchParams.get("skills") ?? "") : null;

  // Seed compare from URL when on /compare (incl. query-only changes)
  useEffect(() => {
    if (barePath !== "/compare" || skillsQuery === null) {
      setCompareHydrated(false);
      return;
    }
    const params = new URLSearchParams();
    if (skillsQuery) params.set("skills", skillsQuery);
    const fromUrl = parseCsvParam(params, "skills").slice(0, 3);
    setCompareIds((current) => (sameIds(current, fromUrl) ? current : fromUrl));
    setCompareHydrated(true);
  }, [barePath, skillsQuery]);

  // Keep /compare URL in sync with selection — only after seed
  useEffect(() => {
    if (barePath !== "/compare" || !compareHydrated) return;
    const next = localizeHref(lang, compareHref(compareIds));
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) {
      router.replace(next, { scroll: false });
    }
  }, [barePath, compareHydrated, compareIds, lang, router]);

  const go = useCallback(
    (href: string) => {
      router.push(localizeHref(lang, href));
    },
    [lang, router],
  );

  const notify = useCallback((text: string) => setToast(text), []);

  const toggleCompare = useCallback(
    (id: string) => {
      setCompareIds((current) => {
        if (current.includes(id)) return current.filter((item) => item !== id);
        if (current.length >= 3) {
          notify(
            tt(
              "最多同时对比 3 个 Skill，请先移出一个。",
              "You can compare up to 3 Skills. Remove one first.",
            ),
          );
          return current;
        }
        return [...current, id];
      });
    },
    [notify, tt],
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
        next
          ? tt(`已收藏 ${skill.name}`, `Bookmarked ${skill.name}`)
          : tt(`已取消收藏 ${skill.name}`, `Removed ${skill.name} from bookmarks`),
      );
    },
    [notify, tt],
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
      toggleCompare,
    }),
    [go, soon, compareIds, toggleCompare],
  );

  const showCompareDock =
    compareIds.length > 0 && (barePath === "/skills" || barePath.startsWith("/skills/"));

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
          router.push(localizeHref(lang, "/skills"));
          window.setTimeout(() => document.getElementById("global-search")?.focus(), 60);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lang, router]);

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
