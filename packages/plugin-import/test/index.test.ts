// biome-ignore-all lint/suspicious/noTemplateCurlyInString: used in tests

import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import { compile } from "ekscss";
import { importPlugin } from "../src/index.ts";

function tempFile(content: string, ext = ".xcss"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ekscss-plugin-import-"));
  const file = path.join(dir, `fixture${ext}`);
  fs.writeFileSync(file, content);
  return file;
}

describe("importPlugin", () => {
  test("inlines an imported .xcss file with interpolation when map is false", () => {
    expect.assertions(2);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("b{color:${x.foo}}");
    const compiled = compile(`@import "${importedFile}";`, {
      map: false,
      globals: { foo: "red" },
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("b{color:red;}");
    expect(compiled.warnings).toHaveLength(0);
  });

  test("inlines an imported .xcss file with interpolation when map is true", () => {
    expect.assertions(2);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("a{color:red}\nb{color:${x.foo}}");
    const compiled = compile(`@import "${importedFile}";`, {
      map: true,
      globals: { foo: "green" },
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}b{color:green;}");
    expect(compiled.map).toBeDefined();
  });

  test("maps an interpolated .xcss import to the real on-disk source, not the interpolated text", () => {
    expect.assertions(1);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("a{color:red}\nb{color:${x.foo}}\nc{color:blue}");
    const compiled = compile(`@import "${importedFile}";`, {
      map: true,
      globals: { foo: "green" },
      plugins: [importPlugin],
    });
    const cIndex = compiled.css.indexOf("c{");
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 1, column: cIndex });
    // Without the `__raw` fix, resolution falls back to the
    // post-interpolation text (`green` substituted for `${x.foo}`), whose
    // differing length shifts this position onto the wrong line.
    expect(original.line).toBe(3);
  });

  test("encoded map snapshot for an interpolated .xcss import (real plugin, not a mock)", () => {
    expect.assertions(1);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("a{color:red}\nb{color:${x.foo}}\nc{color:blue}");
    const compiled = compile(`@import "${importedFile}";`, {
      map: true,
      globals: { foo: "green" },
      plugins: [importPlugin],
    });
    const map = compiled.map!.toJSON();
    // `importedFile`'s path includes a random mkdtempSync suffix, so it's
    // non-deterministic across runs; normalise every occurrence (in both
    // `sources` and `sourcesContent`, since the outer document's own source
    // text is the `@import "<path>";` statement) so the snapshot is stable.
    // eslint-disable-next-line no-confusing-arrow
    map.sources = map.sources.map((source) =>
      source?.endsWith("fixture.xcss") ? "<tmp>/fixture.xcss" : source,
    );
    if (map.sourcesContent) {
      // eslint-disable-next-line no-confusing-arrow
      map.sourcesContent = map.sourcesContent.map((content) =>
        content == null ? content : content.replaceAll(importedFile, "<tmp>/fixture.xcss"),
      );
    }
    expect(map).toMatchSnapshot();
  });

  test("maps a plain (non-.xcss) imported file correctly, with no interpolation involved", () => {
    expect.assertions(2);
    const importedFile = tempFile("a{color:red}\nb{color:blue}", ".css");
    const compiled = compile(`@import "${importedFile}";`, {
      map: true,
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}b{color:blue;}");
    const bIndex = compiled.css.indexOf("b{");
    const traceMap = new TraceMap(compiled.map!.toJSON());
    const original = originalPositionFor(traceMap, { line: 1, column: bIndex });
    expect(original.line).toBe(2);
  });

  test("does not replace url() imports", () => {
    expect.assertions(2);
    const compiled = compile(
      '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");',
      { plugins: [importPlugin] },
    );
    expect(compiled.css).toBe(
      '@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");',
    );
    expect(compiled.warnings).toHaveLength(0);
  });

  test("warns import-from-invalid for a relative import with no from option", () => {
    expect.assertions(3);
    const importedFile = tempFile("a{color:red}");
    const compiled = compile('@import "./fixture.xcss";', {
      rootDir: path.dirname(importedFile),
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}");
    expect(compiled.warnings).toHaveLength(1);
    expect(compiled.warnings[0].code).toBe("import-from-invalid");
  });

  test("warns import-not-found and leaves the at-rule untouched when the file can't be resolved", () => {
    expect.assertions(3);
    const compiled = compile('@import "/does/not/exist.xcss";', {
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe('@import "/does/not/exist.xcss";');
    expect(compiled.warnings).toHaveLength(1);
    expect(compiled.warnings[0].code).toBe("import-not-found");
  });

  test("only inlines the first import of the same file", () => {
    expect.assertions(2);
    const importedFile = tempFile("a{color:red}");
    const compiled = compile(`@import "${importedFile}"; @import "${importedFile}";`, {
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("a{color:red;}");
    expect(compiled.dependencies).toEqual([importedFile]);
  });

  test("does not interpolate an imported file with a non-.xcss extension", () => {
    expect.assertions(1);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("a{content:'${x.foo}'}", ".css");
    const compiled = compile(`@import "${importedFile}";`, {
      globals: { foo: "bar" },
      plugins: [importPlugin],
    });
    // eslint-disable-next-line no-template-curly-in-string
    expect(compiled.css).toBe("a{content:'${x.foo}';}");
  });

  test("interpolates an imported file with no extension", () => {
    expect.assertions(1);
    // eslint-disable-next-line no-template-curly-in-string
    const importedFile = tempFile("b{color:${x.foo}}", "");
    const compiled = compile(`@import "${importedFile}";`, {
      globals: { foo: "red" },
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("b{color:red;}");
  });

  test("warns import-empty and drops the at-rule for an empty imported file", () => {
    expect.assertions(3);
    const importedFile = tempFile("");
    const compiled = compile(`@import "${importedFile}";`, {
      plugins: [importPlugin],
    });
    expect(compiled.css).toBe("");
    expect(compiled.warnings).toHaveLength(1);
    expect(compiled.warnings[0].code).toBe("import-empty");
  });
});
