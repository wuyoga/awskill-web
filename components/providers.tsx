"use client";

import {
  createContext,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppStateProvider } from "@/components/app-state";
import { I18nProvider, type Lang } from "@/lib/i18n";
import { htmlLang, swapLocaleInHref, type Locale } from "@/lib/locale";

type ThemeCtx = { dark: boolean; toggleTheme: () => void; soon: (zh: string, en: string) => void };
const ThemeContext = createContext<ThemeCtx>({
  dark: false,
  toggleTheme: () => {},
  soon: () => {},
});

export function useThemeActions() {
  return useContext(ThemeContext);
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const darkListeners = new Set<() => void>();
let darkStore = false;
let prefsBootstrapped = false;

function bootstrapPrefs() {
  if (prefsBootstrapped || typeof window === "undefined") return;
  prefsBootstrapped = true;
  darkStore = readJSON(
    "awskill:dark",
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
}

function subscribeDark(listener: () => void) {
  bootstrapPrefs();
  darkListeners.add(listener);
  return () => {
    darkListeners.delete(listener);
  };
}

function getDarkSnapshot() {
  bootstrapPrefs();
  return darkStore;
}

function setDarkStore(next: boolean) {
  darkStore = next;
  localStorage.setItem("awskill:dark", JSON.stringify(next));
  darkListeners.forEach((listener) => listener());
}

function LocaleAwareProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dark = useSyncExternalStore(subscribeDark, getDarkSnapshot, () => false);
  const [toast, setToast] = useState<string | null>(null);
  const lang = locale as Lang;

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setLang = useCallback(
    (next: Lang) => {
      const qs = searchParams.toString();
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const href = swapLocaleInHref(`${pathname}${qs ? `?${qs}` : ""}${hash}`, next);
      router.push(href);
    },
    [pathname, router, searchParams],
  );

  const toggleTheme = useCallback(() => setDarkStore(!getDarkSnapshot()), []);

  const soon = useCallback(
    (zh: string, en: string) => {
      setToast(
        lang === "zh"
          ? `“${zh}”将在正式版开放，原型阶段暂不可用。`
          : `“${en}” will be available at launch; it's disabled in this prototype.`,
      );
    },
    [lang],
  );

  const themeValue = useMemo(
    () => ({
      dark,
      toggleTheme,
      soon,
    }),
    [dark, soon, toggleTheme],
  );

  return (
    <I18nProvider value={{ lang, setLang }}>
      <ThemeContext.Provider value={themeValue}>
        <AppStateProvider>
          {children}
          {toast ? (
            <div className="toast" role="status">
              {toast}
            </div>
          ) : null}
        </AppStateProvider>
      </ThemeContext.Provider>
    </I18nProvider>
  );
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LocaleAwareProviders locale={locale}>{children}</LocaleAwareProviders>
    </Suspense>
  );
}
