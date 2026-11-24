import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import {
  getLocaleFromPathname,
  LOCALE_HEADER,
  localeRedirectPath,
  shouldSkipLocaleRedirect,
} from "@/i18n/locale";

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipLocaleRedirect(pathname)) {
    return NextResponse.next();
  }

  // Product requires permanent 308 for bare paths → /zh/...
  const redirectTo = localeRedirectPath(pathname);
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url, 308);
  }

  const locale = getLocaleFromPathname(pathname);
  if (locale) request.headers.set(LOCALE_HEADER, locale);

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
