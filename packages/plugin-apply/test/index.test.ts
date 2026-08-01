import { describe, expect, test } from "bun:test";
import { compile } from "ekscss";
import { applyPlugin } from "../src/index.ts";

describe("applyPlugin", () => {
  test("inlines the declarations of a referenced ruleset", () => {
    expect.assertions(2);
    const compiled = compile("a{color:red}b{#apply: a;}", {
      plugins: [applyPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}b{color:red;}");
    expect(compiled.warnings).toHaveLength(0);
  });

  test("inlines declarations from multiple comma-separated selectors", () => {
    expect.assertions(2);
    const compiled = compile("a{color:red}b{font-size:1rem}c{#apply: a, b;}", {
      plugins: [applyPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}b{font-size:1rem;}c{color:red;font-size:1rem;}");
    expect(compiled.warnings).toHaveLength(0);
  });

  test("matches a selector containing special characters when quoted", () => {
    expect.assertions(2);
    const compiled = compile('.btn:hover{color:blue}c{#apply: ".btn:hover";}', {
      plugins: [applyPlugin],
    });
    expect(compiled.css).toBe(".btn:hover{color:blue;}c{color:blue;}");
    expect(compiled.warnings).toHaveLength(0);
  });

  test("pushes an apply-no-match warning when the target selector doesn't exist", () => {
    expect.assertions(3);
    const compiled = compile("b{#apply: a;}", {
      plugins: [applyPlugin],
    });
    const codes = compiled.warnings.map((w) => w.code);
    expect(codes).toContain("apply-no-match");
    expect(compiled.warnings.find((w) => w.code === "apply-no-match")?.message).toContain("a");
    expect(compiled.css).toBe("");
  });

  test("pushes an apply-empty warning and removes the declaration when the result is empty", () => {
    expect.assertions(3);
    const compiled = compile("a{}b{#apply: a;}", {
      plugins: [applyPlugin],
    });
    expect(compiled.css).toBe("");
    expect(compiled.warnings).toHaveLength(1);
    expect(compiled.warnings[0]?.code).toBe("apply-empty");
  });

  test("does not leak applyRefs between separate compile calls", () => {
    expect.assertions(2);
    compile("a{color:red}", { plugins: [applyPlugin] });
    const compiled = compile("b{#apply: a;}", { plugins: [applyPlugin] });
    expect(compiled.css).toBe("");
    expect(compiled.warnings.map((w) => w.code)).toContain("apply-no-match");
  });
});
