import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLocaleFromPathname,
  localeRedirectPath,
  localizeHref,
  shouldSkipLocaleRedirect,
  stripLocale,
  swapLocaleInHref,
} from "./locale.ts";

describe("stripLocale / getLocaleFromPathname", () => {
  it("strips zh and en prefixes", () => {
    assert.equal(stripLocale("/zh"), "/");
    assert.equal(stripLocale("/en/skills"), "/skills");
    assert.equal(stripLocale("/zh/skills/frontend-design"), "/skills/frontend-design");
    assert.equal(getLocaleFromPathname("/en/compare"), "en");
    assert.equal(getLocaleFromPathname("/skills"), null);
  });
});

describe("localizeHref", () => {
  it("prefixes bare paths and is idempotent", () => {
    assert.equal(localizeHref("zh", "/skills"), "/zh/skills");
    assert.equal(localizeHref("en", "/zh/skills"), "/zh/skills");
    assert.equal(localizeHref("en", "/"), "/en");
  });

  it("preserves query and hash", () => {
    assert.equal(localizeHref("zh", "/compare?skills=a,b#top"), "/zh/compare?skills=a,b#top");
  });
});

describe("swapLocaleInHref", () => {
  it("swaps locale and keeps query/hash", () => {
    assert.equal(swapLocaleInHref("/zh/skills?q=ui#x", "en"), "/en/skills?q=ui#x");
    assert.equal(swapLocaleInHref("/en", "zh"), "/zh");
  });
});

describe("localeRedirectPath", () => {
  it("skips assets and SEO files", () => {
    assert.equal(shouldSkipLocaleRedirect("/favicon.ico"), true);
    assert.equal(shouldSkipLocaleRedirect("/sitemap.xml"), true);
    assert.equal(shouldSkipLocaleRedirect("/_next/static/x.js"), true);
    assert.equal(localeRedirectPath("/favicon.ico"), null);
  });

  it("redirects root and bare paths to /zh", () => {
    assert.equal(localeRedirectPath("/"), "/zh");
    assert.equal(localeRedirectPath("/skills"), "/zh/skills");
    assert.equal(localeRedirectPath("/zh/skills"), null);
    assert.equal(localeRedirectPath("/en/compare"), null);
  });
});
