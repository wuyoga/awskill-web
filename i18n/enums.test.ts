import assert from "node:assert/strict";
import { describe, it } from "node:test";
import en from "./messages/en/enums.json" with { type: "json" };

describe("en enum labels", () => {
  it("keeps distinct states from sharing one English word", () => {
    assert.notEqual(en["待验证"], en["待评估"]);
    assert.notEqual(en["待验证"], en["未验证"]);
    assert.notEqual(en["待评估"], en["未评估"]);
    assert.notEqual(en["部分支持"], en["部分"]);
    assert.notEqual(en["推荐"], en["综合推荐"]);
  });
});
