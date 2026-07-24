import { describe, expect, test } from "bun:test";
import { compile } from "ekscss";
import { prefixPlugin } from "../src/index.ts";

describe("prefixPlugin", () => {
  test("adds vendor prefixes for properties that need them", () => {
    expect.assertions(1);
    const compiled = compile("a{user-select:none}", {
      plugins: [prefixPlugin],
    });
    expect(compiled.css).toContain("-webkit-user-select:none;");
  });

  test("does not add vendor prefixes when the plugin isn't used", () => {
    expect.assertions(1);
    const compiled = compile("a{user-select:none}", {
      plugins: [],
    });
    expect(compiled.css).toBe("a{user-select:none;}");
  });
});
