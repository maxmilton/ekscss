// biome-ignore-all lint/performance/noDynamicNamespaceImportAccess: used in tests

import { expect, test } from "bun:test";
import * as allExports from "../src/index.ts";

const compilerPublicExports = [
  ["onBeforeBuild", "Function"],
  ["onAfterBuild", "Function"],
  ["compile", "Function"],
] as const satisfies readonly [name: string, type: string][];
const helperPublicExports = [
  ["accessorsProxy", "Function"],
  ["ctx", "Object"],
  ["interpolate", "Function"],
  ["resolvePlugins", "Function"],
  ["stylis", "Module"],
  ["xcss", "Function"],
] as const satisfies readonly [name: string, type: string][];

test.each(compilerPublicExports)('exports public "%s" compiler %s', (name, type) => {
  expect.assertions(2);
  expect(allExports).toHaveProperty(name);
  expect(allExports[name]).toHaveObjectType(`[object ${type}]`);
});

test.each(helperPublicExports)('exports public "%s" helper %s', (name, type) => {
  expect.assertions(2);
  expect(allExports).toHaveProperty(name);
  expect(allExports[name]).toHaveObjectType(`[object ${type}]`);
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
  expect(allExports).toHaveObjectType("[object Module]");
  expect(allExports).not.toHaveProperty("default");

  // Build output
  const bundle = require("../dist/index.js"); // eslint-disable-line
  expect(bundle).toHaveObjectType("[object Object]");
  expect(bundle).not.toHaveProperty("default");
});
