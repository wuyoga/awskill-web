export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Strip `/zh` or `/en` prefix; returns path starting with `/` (or `/`). */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(zh|en)(?=\/|$)/);
  if (!match) return pathname || "/";
  const rest = pathname.slice(match[0].length);
  return rest && rest.length > 0 ? rest : "/";
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && isLocale(seg) ? seg : null;
}

/**
 * Prefix an app-relative href with locale.
 * Idempotent if already prefixed with zh|en.
 * Preserves query and hash.
 */
export function localizeHref(locale: Locale, href: string): string {
  if (!href.startsWith("/")) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const qIndex = withoutHash.indexOf("?");
  const search = qIndex >= 0 ? withoutHash.slice(qIndex) : "";
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;

  if (getLocaleFromPathname(path)) {
    return `${path}${search}${hash}`;
  }

  const bare = path === "/" ? "" : path;
  return `/${locale}${bare}${search}${hash}`;
}

/** Swap locale segment; keeps bare path + query + hash. */
export function swapLocaleInHref(href: string, next: Locale): string {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const qIndex = withoutHash.indexOf("?");
  const search = qIndex >= 0 ? withoutHash.slice(qIndex) : "";
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;

  const bare = stripLocale(path);
  const barePart = bare === "/" ? "" : bare;
  return `/${next}${barePart}${search}${hash}`;
}

export function htmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}

/** Request header set by middleware for SSR `<html lang>`. */
export const LOCALE_HEADER = "x-awskill-locale";

const PUBLIC_FILE = /\.[^/]+$/;

/** Paths that skip locale redirect (assets, SEO files, Next internals). */
export function shouldSkipLocaleRedirect(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  );
}

/**
 * If pathname lacks a locale prefix, return the `/zh…` target pathname.
 * Query/hash are the caller's responsibility (middleware clones nextUrl).
 */
export function localeRedirectPath(pathname: string): string | null {
  if (shouldSkipLocaleRedirect(pathname)) return null;
  const first = pathname.split("/").filter(Boolean)[0];
  if (first && isLocale(first)) return null;
  return pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
}

