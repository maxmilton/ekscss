// biome-ignore-all lint/suspicious/noTemplateCurlyInString: used in tests

import { describe, expect, test } from "bun:test";
import path from "node:path";
import { eachMapping, originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import * as stylis from "stylis";
import { compile } from "../src/compiler.ts";
import { ctx } from "../src/helpers.ts";
import type { Element, Middleware } from "../src/types.ts";

/**
 * Minimal stand-in for `@ekscss/plugin-import`, purpose-built for these
 * tests. It only inlines from an in-memory `imports` map (no filesystem),
 * setting the same `__from`/`__code`/`__raw`/`__ast` fields the real
 * plugin sets so `sourcemap.ts`'s nested `@import` handling can be exercised
 * without a cross-package dependency on plugin-import or fixture files on
 * disk. Recurses naturally for chained imports (an imported file's own
 * `@import`s are resolved through the same `callback` chain), and mirrors
 * the real plugin's dedup behavior (only the first occurrence of a given
 * path inlines).
 */
function makeImportPlugin(imports: Record<string, string>): Middleware {
  return (element, _index, _children, callback) => {
    if (element.type !== stylis.IMPORT || element.return) return;

    const importPath = stylis.tokenize(element.value)[3].replace(/^["']/, "").replace(/["']$/, "");
    if (!Object.hasOwn(imports, importPath)) return;

    const el = element as Element;

    if (ctx.dependencies.includes(importPath)) {
      el.value = "";
      return;
    }

    const importedCode = imports[importPath];
    const ast = stylis.compile(importedCode);

    el.return = stylis.serialize(ast, callback);
    // eslint-disable-next-line no-underscore-dangle
    el.__from = importPath;
    // eslint-disable-next-line no-underscore-dangle
    el.__raw = importedCode;
    // eslint-disable-next-line no-underscore-dangle
    el.__code = importedCode;
    // eslint-disable-next-line no-underscore-dangle
    el.__ast = ast;

    ctx.dependencies.push(importPath);
  };
}

describe("source map", () => {
  test("returns source map when map option is true", () => {
    expect.assertions(2);
    const compiled = compile("", { map: true });
    expect(compiled.map).toBeDefined();
    expect(compiled.warnings).toHaveLength(0);
  });

  test("does not return source map when map option is false", () => {
    expect.assertions(2);
    const compiled = compile("", { map: false });
    expect(compiled.map).toBeUndefined();
    expect(compiled.warnings).toHaveLength(0);
  });

  test("is an object", () => {
    expect.assertions(1);
    const compiled = compile("", { map: true });
    expect(compiled.map).toBeObject();
  });

  test("has an addMapping method", () => {
    expect.assertions(2);
    const compiled = compile("", { map: true });
    expect(compiled.map).toHaveProperty("addMapping");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(compiled.map?.addMapping).toBeFunction();
  });

  test("has a shift method", () => {
    expect.assertions(2);
    const compiled = compile("", { map: true });
    expect(compiled.map).toHaveProperty("shift");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(compiled.map?.shift).toBeFunction();
  });

  test("has a toString method", () => {
    expect.assertions(2);
    const compiled = compile("", { map: true });
    expect(compiled.map).toHaveProperty("toString");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(compiled.map?.toString).toBeFunction();
  });

  test("has a toJSON method", () => {
    expect.assertions(2);
    const compiled = compile("", { map: true });
    expect(compiled.map).toHaveProperty("toJSON");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(compiled.map?.toJSON).toBeFunction();
  });

  test("shift offsets every mapping's generated line", () => {
    expect.assertions(1);
    const compiled = compile("a{color:red}", { map: true });
    compiled.map!.shift(2);
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 3, column: 0 });
    expect(original.line).toBe(1);
  });

  test("shift composes across multiple calls", () => {
    expect.assertions(1);
    const compiled = compile("a{color:red}", { map: true });
    compiled.map!.shift(1);
    compiled.map!.shift(2);
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 4, column: 0 });
    expect(original.line).toBe(1);
  });

  test("shift offset survives a later addMapping call", () => {
    expect.assertions(1);
    const compiled = compile("a{color:red}", { map: true });
    compiled.map!.shift(2);
    compiled.map!.addMapping({
      generated: { line: 10, column: 0 },
      source: "synthetic.css",
      original: { line: 1, column: 0 },
      name: "synthetic",
    });
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 3, column: 0 });
    expect(original.line).toBe(1);
  });

  test("addMapping adds a mapping reflected in toJSON/toString", () => {
    expect.assertions(1);
    const compiled = compile("a{color:red}", { map: true });
    compiled.map!.addMapping({
      generated: { line: 5, column: 0 },
      source: "synthetic.css",
      original: { line: 9, column: 0 },
      name: "synthetic",
    });
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 5, column: 0 });
    expect(original).toMatchObject({ source: "synthetic.css", line: 9 });
  });

  test("tracks multi-line generated positions across a newline embedded in a parenthesized value", () => {
    expect.assertions(2);
    // Whitespace outside parens is collapsed by stylis, but literal newlines
    // inside parens (e.g. a hand-formatted multi-line function value) are
    // preserved verbatim in the generated output.
    const src = "a{grid-template-columns:minmax(\n1fr,\n2fr\n)}\nb{color:red}";
    const compiled = compile(src, { map: true });
    const traceMap = new TraceMap(compiled.map!.toJSON());

    expect(compiled.css).toInclude("\n");

    let sawMultiLineMapping = false;
    eachMapping(traceMap, (mapping) => {
      if (mapping.generatedLine > 1) sawMultiLineMapping = true;
    });
    expect(sawMultiLineMapping).toBeTrue();
  });

  test("maps positions after a multi-line interpolated expression back to the original source", () => {
    expect.assertions(1);
    // eslint-disable-next-line no-template-curly-in-string
    const src = "a{color:red}\nb{color:${\n  x.foo\n}}\nc{color:blue}";
    const compiled = compile(src, { map: true, globals: { foo: "green" } });
    const cIndex = compiled.css.indexOf("c{");
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 1, column: cIndex });
    expect(original.line).toBe(5);
  });

  test("still maps correctly when an expression calls xcss recursively (fn.each/fn.map idiom)", () => {
    // NOTE: JS evaluates a tagged template's expressions (here, the nested
    // `xcss` calls inside fn.each's callback) before invoking the outer
    // `xcss()` call itself, so the outer call's own position tracking always
    // runs last and isn't clobbered by the inner ones — this asserts that
    // stays true, while the re-entrancy guard in xcss() (helpers.ts) avoids
    // the inner calls doing redundant indexOf scans of the whole outer
    // source for every loop iteration.
    expect.assertions(2);
    const src =
      // eslint-disable-next-line no-template-curly-in-string
      "a{color:red}\n${fn.each(x.colors, (name, value) => xcss`.${name}{color:${value}}`)}\nz{color:black}";
    const compiled = compile(src, {
      map: true,
      globals: { colors: { red: "coral", green: "seagreen", blue: "deepskyblue" } },
    });
    const zIndex = compiled.css.indexOf("z{");
    const traceMap = new TraceMap(compiled.map!.toJSON());

    const firstOriginal = originalPositionFor(traceMap, { line: 1, column: 0 });
    const lastOriginal = originalPositionFor(traceMap, { line: 1, column: zIndex });

    expect(firstOriginal.line).toBe(1);
    expect(lastOriginal.line).toBe(3);
  });

  test("resolves correctly across many interpolations spread over multiple rules", () => {
    expect.assertions(3);
    /* eslint-disable no-template-curly-in-string */
    const src = [
      "a{--c1:${x.c1};--c2:${x.c2};--c3:${x.c3}}",
      "b{--c4:${x.c4};--c5:${x.c5};--c6:${x.c6}}",
      "c{--c7:${x.c7};--c8:${x.c8};--c9:${x.c9}}",
      "d{--c10:${x.c10};--c11:${x.c11};--c12:${x.c12}}",
    ].join("\n");
    /* eslint-enable no-template-curly-in-string */
    const compiled = compile(src, {
      map: true,
      globals: {
        c1: "aaaaaaaaaa",
        c2: "b",
        c3: "cc",
        c4: "ddddd",
        c5: "e",
        c6: "ffffffff",
        c7: "g",
        c8: "hhh",
        c9: "iiiiiiiiiiii",
        c10: "j",
        c11: "kk",
        c12: "l",
      },
    });
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const aIndex = compiled.css.indexOf("a{");
    const cIndex = compiled.css.indexOf("c{");
    const dIndex = compiled.css.indexOf("d{");

    expect(originalPositionFor(traceMap, { line: 1, column: aIndex }).line).toBe(1);
    expect(originalPositionFor(traceMap, { line: 1, column: cIndex }).line).toBe(3);
    expect(originalPositionFor(traceMap, { line: 1, column: dIndex }).line).toBe(4);
  });

  test("does not corrupt tracking when two expressions are adjacent with no literal between them", () => {
    expect.assertions(2);
    // eslint-disable-next-line no-template-curly-in-string
    const src = "x{color:${x.a}${x.b}}\ny{color:green}";
    const compiled = compile(src, { map: true, globals: { a: "red", b: "blue" } });

    expect(compiled.css).toBe("x{color:redblue;}y{color:green;}");

    const traceMap = new TraceMap(compiled.map!.toJSON());
    const yIndex = compiled.css.indexOf("y{");
    const original = originalPositionFor(traceMap, { line: 1, column: yIndex });
    expect(original.line).toBe(2);
  });

  test("does not corrupt tracking when an expression resolves to a falsy value", () => {
    expect.assertions(2);
    // eslint-disable-next-line no-template-curly-in-string
    const src = "x{color:${null}red}\ny{color:green}";
    const compiled = compile(src, { map: true });

    expect(compiled.css).toBe("x{color:red;}y{color:green;}");

    const traceMap = new TraceMap(compiled.map!.toJSON());
    const yIndex = compiled.css.indexOf("y{");
    const original = originalPositionFor(traceMap, { line: 1, column: yIndex });
    expect(original.line).toBe(2);
  });

  test("still maps correctly with doubly-nested xcss recursion (loop inside a loop)", () => {
    expect.assertions(2);
    const src =
      // eslint-disable-next-line no-template-curly-in-string
      "a{color:red}\n${fn.each(x.groups, (gname, colors) => xcss`${fn.each(colors, (name, value) => xcss`.${gname}-${name}{color:${value}}`)}`)}\nz{color:black}";
    const compiled = compile(src, {
      map: true,
      globals: {
        groups: {
          warm: { red: "coral", orange: "coral" },
          cool: { blue: "deepskyblue" },
        },
      },
    });
    const zIndex = compiled.css.indexOf("z{");
    const traceMap = new TraceMap(compiled.map!.toJSON());

    const firstOriginal = originalPositionFor(traceMap, { line: 1, column: 0 });
    const lastOriginal = originalPositionFor(traceMap, { line: 1, column: zIndex });

    expect(firstOriginal.line).toBe(1);
    expect(lastOriginal.line).toBe(3);
  });

  describe("@import", () => {
    test("maps positions inside an @import'd file to that file's own source", () => {
      expect.assertions(1);
      const importedCode = "b{color:blue}\nc{color:green}";
      const plugin = makeImportPlugin({ "/virtual/foo.css": importedCode });

      const compiled = compile('@import "/virtual/foo.css";\na{color:red}', {
        map: true,
        rootDir: "/virtual",
        plugins: [plugin],
      });

      const cIndex = compiled.css.indexOf("c{");
      const traceMap = new TraceMap(compiled.map!.toJSON());
      const original = originalPositionFor(traceMap, { line: 1, column: cIndex });

      expect(original).toMatchObject({ source: "foo.css", line: 2 });
    });

    test("resolves a nested @import's own sourceMappingURL via remapping", () => {
      expect.assertions(1);
      const refMap = {
        version: 3,
        sources: ["foo.scss"],
        names: [],
        // Single segment: generated (line 1, col 0) -> original (foo.scss, line 1, col 0).
        mappings: "AAAA",
      };
      const base64 = Buffer.from(JSON.stringify(refMap)).toString("base64");
      const importedCode = `b{color:blue}\n/*# sourceMappingURL=data:application/json;base64,${base64}*/`;
      const plugin = makeImportPlugin({ "/virtual/foo.css": importedCode });

      const compiled = compile('@import "/virtual/foo.css";\na{color:red}', {
        map: true,
        rootDir: "/virtual",
        plugins: [plugin],
      });

      const bIndex = compiled.css.indexOf("b{");
      const traceMap = new TraceMap(compiled.map!.toJSON());
      const original = originalPositionFor(traceMap, { line: 1, column: bIndex });

      expect(original.source).toBe(path.normalize("foo.scss"));
    });

    test("maps positions from multiple distinct imports and the trailing file content correctly", () => {
      expect.assertions(3);
      const plugin = makeImportPlugin({
        "/virtual/a.css": "a1{color:red}\na2{color:orange}",
        "/virtual/b.css": "b1{color:blue}\nb2{color:navy}",
      });

      const compiled = compile(
        '@import "/virtual/a.css";\n@import "/virtual/b.css";\nc{color:green}',
        { map: true, rootDir: "/virtual", plugins: [plugin] },
      );

      const traceMap = new TraceMap(compiled.map!.toJSON());
      const a2Index = compiled.css.indexOf("a2{");
      const b2Index = compiled.css.indexOf("b2{");
      const cIndex = compiled.css.indexOf("c{");

      expect(originalPositionFor(traceMap, { line: 1, column: a2Index })).toMatchObject({
        source: "a.css",
        line: 2,
      });
      expect(originalPositionFor(traceMap, { line: 1, column: b2Index })).toMatchObject({
        source: "b.css",
        line: 2,
      });
      expect(originalPositionFor(traceMap, { line: 1, column: cIndex }).line).toBe(3);
    });

    test("threads source/original resolution through a three-level deep @import chain", () => {
      expect.assertions(1);
      const plugin = makeImportPlugin({
        "/virtual/a.css": '@import "/virtual/b.css";\na{color:red}',
        "/virtual/b.css": '@import "/virtual/c.css";\nb{color:blue}',
        "/virtual/c.css": "c1{color:green}\nc2{color:lime}",
      });

      const compiled = compile('@import "/virtual/a.css";', {
        map: true,
        rootDir: "/virtual",
        plugins: [plugin],
      });

      const c2Index = compiled.css.indexOf("c2{");
      const traceMap = new TraceMap(compiled.map!.toJSON());
      const original = originalPositionFor(traceMap, { line: 1, column: c2Index });

      expect(original).toMatchObject({ source: "c.css", line: 2 });
    });

    test("does not produce a bogus mapping for a duplicate @import (dedup keeps only the first)", () => {
      expect.assertions(2);
      const plugin = makeImportPlugin({ "/virtual/a.css": "a{color:red}" });

      const compiled = compile(
        '@import "/virtual/a.css";\n@import "/virtual/a.css";\nb{color:blue}',
        { map: true, rootDir: "/virtual", plugins: [plugin] },
      );

      expect(compiled.css).toBe("a{color:red;}b{color:blue;}");

      const traceMap = new TraceMap(compiled.map!.toJSON());
      const bIndex = compiled.css.indexOf("b{");
      const original = originalPositionFor(traceMap, { line: 1, column: bIndex });
      expect(original.line).toBe(3);
    });

    test("a malformed sourceMappingURL on an imported file produces a warning instead of crashing", () => {
      expect.assertions(3);
      const importedCode = "b{color:blue}\n/*# sourceMappingURL=./does-not-exist.map */";
      const plugin = makeImportPlugin({ "/virtual/foo.css": importedCode });

      const compiled = compile('@import "/virtual/foo.css";\na{color:red}', {
        map: true,
        rootDir: "/virtual",
        plugins: [plugin],
      });

      expect(compiled.map).toBeDefined();
      expect(compiled.warnings.some((w) => w.code === "sourcemap-ref-invalid")).toBeTrue();

      const bIndex = compiled.css.indexOf("b{");
      const traceMap = new TraceMap(compiled.map!.toJSON());
      const original = originalPositionFor(traceMap, { line: 1, column: bIndex });
      expect(original).toMatchObject({ source: "foo.css", line: 1 });
    });
  });

  describe("snapshots", () => {
    test("encoded map for a simple compile with no interpolation or imports", () => {
      expect.assertions(1);
      const compiled = compile("a{color:red}\nb{color:blue}", { map: true });
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });

    test("encoded map for interpolated expressions spread over multiple rules", () => {
      expect.assertions(1);
      /* eslint-disable no-template-curly-in-string */
      const src = [
        "a{--c1:${x.c1};--c2:${x.c2};--c3:${x.c3}}",
        "b{--c4:${x.c4};--c5:${x.c5};--c6:${x.c6}}",
        "c{--c7:${x.c7};--c8:${x.c8};--c9:${x.c9}}",
      ].join("\n");
      /* eslint-enable no-template-curly-in-string */
      const compiled = compile(src, {
        map: true,
        globals: {
          c1: "aaaaaaaaaa",
          c2: "b",
          c3: "cc",
          c4: "ddddd",
          c5: "e",
          c6: "ffffffff",
          c7: "g",
          c8: "hhh",
          c9: "iiiiiiiiiiii",
        },
      });
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });

    test("encoded map across an @import chain from multiple distinct files", () => {
      expect.assertions(1);
      const plugin = makeImportPlugin({
        "/virtual/a.css": "a1{color:red}\na2{color:orange}",
        "/virtual/b.css": "b1{color:blue}\nb2{color:navy}",
      });
      const compiled = compile(
        '@import "/virtual/a.css";\n@import "/virtual/b.css";\nc{color:green}',
        { map: true, rootDir: "/virtual", plugins: [plugin] },
      );
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });

    test("encoded map when a nested @import's own sourceMappingURL is remapped", () => {
      expect.assertions(1);
      const refMap = {
        version: 3,
        sources: ["foo.scss"],
        names: [],
        mappings: "AAAA",
      };
      const base64 = Buffer.from(JSON.stringify(refMap)).toString("base64");
      const importedCode = `b{color:blue}\n/*# sourceMappingURL=data:application/json;base64,${base64}*/`;
      const plugin = makeImportPlugin({ "/virtual/foo.css": importedCode });
      const compiled = compile('@import "/virtual/foo.css";\na{color:red}', {
        map: true,
        rootDir: "/virtual",
        plugins: [plugin],
      });
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });

    test("encoded map after shift prepends a banner offset", () => {
      expect.assertions(1);
      const compiled = compile("a{color:red}\nb{color:blue}", { map: true });
      compiled.map!.shift(2);
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });

    test("encoded map after addMapping following shift keeps both", () => {
      expect.assertions(1);
      const compiled = compile("a{color:red}", { map: true });
      compiled.map!.shift(2);
      compiled.map!.addMapping({
        generated: { line: 10, column: 0 },
        source: "synthetic.css",
        original: { line: 1, column: 0 },
        name: "synthetic",
      });
      expect(compiled.map!.toJSON()).toMatchSnapshot();
    });
  });
});
