// biome-ignore-all lint/performance/noDynamicNamespaceImportAccess: used in tests

import { expect, test } from "bun:test";
import * as allExports from "../src/index.ts";

const compilerPublicExports: [string, unknown][] = [
  ["onBeforeBuild", Function],
  ["onAfterBuild", Function],
  ["compile", Function],
] as const;
const helperPublicExports: [string, unknown][] = [
  ["accessorsProxy", Function],
  ["ctx", Object],
  ["interpolate", Function],
  ["resolvePlugins", Function],
  ["stylis", Object],
  ["xcss", Function],
] as const;

test.each(compilerPublicExports)('exports public "%s" compiler %p', (name, type) => {
  expect.assertions(2);
  expect(allExports).toHaveProperty(name);
  // @ts-expect-error - FIXME: Tricky type error that's different on cli lint and IDE.
  expect(allExports[name]).toBeInstanceOf(type);
});

test.each(helperPublicExports)('exports public "%s" helper %p', (name, type) => {
  expect.assertions(2);
  expect(allExports).toHaveProperty(name);
  // @ts-expect-error - FIXME: Tricky type error that's different on cli lint and IDE.
  expect(allExports[name]).toBeInstanceOf(type);
});

test("does not export any private internals", () => {
  expect.assertions(2);
  const allPublicExportNames = [
    ...compilerPublicExports.map((x) => x[0]),
    ...helperPublicExports.map((x) => x[0]),
  ];
  const scriptExports = new Set(Object.keys(allExports));
  expect(scriptExports.size).toBeGreaterThanOrEqual(allPublicExportNames.length);
  for (const name of allPublicExportNames) {
    scriptExports.delete(name);
  }
  expect(scriptExports.size).toBe(0);
});

test("default export is undefined", () => {
  expect.assertions(4);

  // Runtime
  expect(allExports).toBeInstanceOf(Object);
  expect(allExports).not.toHaveProperty("default");

  // Build output
  const bundle = require("../dist/index.js"); // eslint-disable-line
  expect(bundle).toBeInstanceOf(Object);
  expect(bundle).not.toHaveProperty("default");
});
