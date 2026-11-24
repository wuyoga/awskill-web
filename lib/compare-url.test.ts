import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareHref,
  compareSearchMatches,
  parseCompareSkillIds,
  resolveCompareSkillIds,
  sameCompareIds,
} from "./compare-url.ts";

describe("parseCompareSkillIds", () => {
  it("parses up to three ids", () => {
    assert.deepEqual(parseCompareSkillIds("a,b,c"), ["a", "b", "c"]);
    assert.deepEqual(parseCompareSkillIds("a, b ,c,d"), ["a", "b", "c"]);
  });

  it("treats empty as no selection", () => {
    assert.deepEqual(parseCompareSkillIds(""), []);
    assert.deepEqual(parseCompareSkillIds(null), []);
    assert.deepEqual(parseCompareSkillIds("  , , "), []);
  });
});

describe("sameCompareIds", () => {
  it("compares order-sensitive lists", () => {
    assert.equal(sameCompareIds(["a", "b"], ["a", "b"]), true);
    assert.equal(sameCompareIds(["a", "b"], ["b", "a"]), false);
    assert.equal(sameCompareIds([], []), true);
  });
});

describe("compareHref", () => {
  it("builds shareable compare URLs", () => {
    assert.equal(compareHref([]), "/compare");
    assert.equal(
      compareHref(["frontend-design", "agent-browser"]),
      "/compare?skills=frontend-design%2Cagent-browser",
    );
  });
});

describe("resolveCompareSkillIds", () => {
  it("keeps the hook selection when both sources have ids", () => {
    assert.deepEqual(resolveCompareSkillIds("a", ["a", "b"]), ["a"]);
    assert.deepEqual(resolveCompareSkillIds("a,b", ["c"]), ["a", "b"]);
  });

  it("uses the address bar only while the hook query is empty", () => {
    assert.deepEqual(resolveCompareSkillIds("", ["a", "b"]), ["a", "b"]);
    assert.deepEqual(resolveCompareSkillIds(null, null), []);
    assert.deepEqual(resolveCompareSkillIds("  ", []), []);
  });
});

describe("compareSearchMatches", () => {
  it("treats encoded and literal commas as the same selection", () => {
    assert.equal(compareSearchMatches("?skills=a,b", ["a", "b"]), true);
    assert.equal(compareSearchMatches("skills=a%2Cb", ["a", "b"]), true);
    assert.equal(compareSearchMatches("", []), true);
    assert.equal(compareSearchMatches("?skills=a,b", ["a"]), false);
  });
});
