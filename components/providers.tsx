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
import { useTranslations } from "next-intl";
import { AppStateProvider } from "@/components/app-state";
import { htmlLang, swapLocaleInHref, type Locale } from "@/i18n/locale";

type ThemeCtx = {
  dark: boolean;
  toggleTheme: () => void;
  /** Show "coming soon" toast; `feature` is already localized display text. */
  soon: (feature: string) => void;
  setLang: (next: Locale) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  dark: false,
  toggleTheme: () => {},
  soon: () => {},
  setLang: () => {},
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
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") {
    darkStore = attr === "dark";
    return;
  }
  darkStore = readJSON(
    "awskill:dark",
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
}

function subscribeDark(listener: () => void) {
  bootstrapPrefs();
  darkListeners.add(listener);
  const onExternal = () => {
    darkStore = document.documentElement.dataset.theme === "dark";
    listener();
  };
  window.addEventListener("awskill-theme", onExternal);
  return () => {
    darkListeners.delete(listener);
    window.removeEventListener("awskill-theme", onExternal);
  };
}

function getDarkSnapshot() {
  bootstrapPrefs();
  return darkStore;
}

function setDarkStore(next: boolean) {
  darkStore = next;
  document.documentElement.dataset.theme = next ? "dark" : "light";
  try {
    localStorage.setItem("awskill:dark", JSON.stringify(next));
  } catch {
    /* private mode */
  }
  darkListeners.forEach((listener) => listener());
}

function LocaleAwareProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dark = useSyncExternalStore(subscribeDark, getDarkSnapshot, () => false);
  const [toast, setToast] = useState<string | null>(null);
  const tCommon = useTranslations("common");

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setLang = useCallback((next: Locale) => {
    const href = swapLocaleInHref(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
      next,
    );
    window.location.assign(href);
  }, []);

  const toggleTheme = useCallback(() => setDarkStore(!getDarkSnapshot()), []);

  const soon = useCallback(
    (feature: string) => {
      setToast(tCommon("soonToast", { feature }));
    },
    [tCommon],
  );

  const themeValue = useMemo(
    () => ({
      dark,
      toggleTheme,
      soon,
      setLang,
    }),
    [dark, soon, toggleTheme, setLang],
  );

  return (
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
  );
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LocaleAwareProviders locale={locale}>{children}</LocaleAwareProviders>
    </Suspense>
  );
}
