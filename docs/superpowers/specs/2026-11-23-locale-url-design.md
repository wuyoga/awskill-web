# Design: Locale URL prefixes (`/zh` · `/en`)

Approved 2026-11-23.

## Decision

Both locales use path prefixes. Chinese default redirects:

- `/zh/...`, `/en/...`
- `/` and unprefixed legacy paths → **308** `/zh/...` (query preserved)
- Language toggle swaps prefix only; no `?lang=`
- No `Accept-Language` auto-redirect (SEO-safe)

## Implementation notes

- App Router: `app/[locale]/...`
- Helpers: `lib/locale.ts`, bare `lib/routes.ts` + `go()` / `localized()`
- SEO: `lib/seo.ts` alternates; `app/sitemap.ts`, `app/robots.ts`
