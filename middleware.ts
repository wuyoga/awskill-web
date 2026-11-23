import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_HEADER,
  isLocale,
  localeRedirectPath,
  shouldSkipLocaleRedirect,
} from "@/lib/locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipLocaleRedirect(pathname)) {
    return NextResponse.next();
  }

  const redirectTo = localeRedirectPath(pathname);
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url, 308);
  }

  const first = pathname.split("/").filter(Boolean)[0];
  if (first && isLocale(first)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, first);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
