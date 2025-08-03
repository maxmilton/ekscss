// Copied from https://github.com/egoist/joycon/blob/4c1e87691bfe0b3b5ffc46f5ac546ed4c710a9d2/tests/index.test.js

// TODO: Test caches work as expected.
// TODO: Test cache clearing and invalidation.
// TODO: Test all constructor option variants.
// TODO: Test all methods with/without optional parameters.
// TODO: Test file resolution order etc.
// TODO: Test .ts config file loading in bun and deno.
// TODO: Write node specific tests.
// TODO: Write deno specific tests.

import { describe, expect, test } from "bun:test";
import path from "node:path";
import { ConfigLoader } from "../src/index.ts";

const fixture = (name: string) => path.join(import.meta.dir, "fixtures", name);

describe("ConfigLoader", () => {
  test("is a class", () => {
    expect.assertions(2);
    expect(ConfigLoader).toBeFunction();
    expect(ConfigLoader).toBeClass();
  });

  describe("constructor", () => {
    test("expects 1 parameter", () => {
      expect.assertions(1);
      expect(ConfigLoader).toHaveParameters(1, 0);
    });
  });
});

describe("clearCache", () => {
  test("is a function", () => {
    expect.assertions(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.clearCache).toBeFunction();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.clearCache).not.toBeClass();
  });

  test("expects 0 parameters", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.clearCache).toHaveParameters(0, 0);
  });

  test("returns undefined", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(new ConfigLoader({ files: ["foo.json"] }).clearCache()).toBeUndefined();
  });
});

describe("resolve", () => {
  test("is a function", () => {
    expect.assertions(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.resolve).toBeFunction();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.resolve).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.resolve).toHaveParameters(1, 0);
  });

  // TODO: The following tests were copied almost verbatim from joycon but
  // should be refactored e.g., naming and clarity of what is being tested.

  test("has json file", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["foo.json"],
    }).resolve(fixture("has-json-file"));
    expect(result).toBeString();
    expect(result?.endsWith("foo.json")).toBe(true);
  });

  test("resolves next file", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["bar.json", "foo.json"],
    }).resolve(fixture("has-json-file"));
    expect(result).toBeString();
    expect(result?.endsWith("foo.json")).toBe(true);
  });

  test("returns null when not found", async () => {
    expect.assertions(1);
    const result = await new ConfigLoader({
      files: ["hehe.json"],
    }).resolve(fixture("has-json-file"));
    expect(result).toBeNull();
  });

  test("package.json but packageKey does not exist", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["package.json", "foo.json"],
      packageKey: "name",
    }).resolve(fixture("package-json-no-key"));
    expect(result).toBeString();
    expect(result?.endsWith("foo.json")).toBe(true);
  });

  test("package.json", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["package.json", "foo.json"],
      packageKey: "what",
    }).resolve(fixture("package-json"));
    expect(result).toBeString();
    expect(result?.endsWith("package.json")).toBe(true);
  });
});

describe("load", () => {
  test("is a function", () => {
    expect.assertions(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.load).toBeFunction();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.load).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ConfigLoader.prototype.load).toHaveParameters(1, 0);
  });

  // TODO: The following tests were copied almost verbatim from joycon but
  // should be refactored e.g., naming and clarity of what is being tested.

  test("has json file", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["foo.json"],
      cwd: fixture("has-json-file"),
    }).load();
    expect(result).toBeObject();
    expect(result?.data).toEqual({ foo: "foo" });
  });

  test("resolves next file", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["bar.json", "foo.json"],
      cwd: fixture("has-json-file"),
    }).load();
    expect(result).toBeObject();
    expect(result?.data).toEqual({ foo: "foo" });
  });

  test("returns null when not found", async () => {
    expect.assertions(1);
    const result = await new ConfigLoader({
      files: ["hehe.json"],
      cwd: fixture("has-json-file"),
    }).load();
    expect(result).toBeNull();
  });

  test("package.json but packageKey does not exist", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["package.json", "foo.json"],
      cwd: fixture("package-json-no-key"),
      packageKey: "name",
    }).load();
    expect(result).toBeObject();
    expect(result?.data).toEqual({ foo: true });
  });

  test("package.json", async () => {
    expect.assertions(2);
    const result = await new ConfigLoader({
      files: ["package.json", "foo.json"],
      cwd: fixture("package-json"),
      packageKey: "what",
    }).load();
    expect(result).toBeObject();
    expect(result?.data).toEqual("is this");
  });
});
