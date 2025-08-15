// TODO: Write more tests
// - Add new file `sourcemap.test.ts` + write tests for source map support
// - Validate "warnings" are generated in expected scenarios and file, line, column are correct
// - Validate "dependencies" are added correctly

import { GenMapping } from "@jridgewell/gen-mapping";
import { describe, expect, mock, test } from "bun:test";
import { compile, onAfterBuild, onBeforeBuild } from "../src/compiler.ts";

const complexCodeFixture = `
  /**
   * block comm
   */

  \${x.color = {
    red: 'coral',
    green: 'seagreen',
    blue: 'deepskyblue',
  }, null}

  body {
    font-size: 20px;
    color: \${x.color.red};
  }

  // inline comm
  \${x.fn.each(x.color, (name, value) => xcss\`
    .\${name} { color: \${value}; }
  \`)}
`;
const complexCodeResult =
  "body{font-size:20px;color:coral;}.red{color:coral;}.green{color:seagreen;}.blue{color:deepskyblue;}";

describe("onBeforeBuild", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(onBeforeBuild).toBeFunction();
    expect(onBeforeBuild).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    expect(onBeforeBuild).toHaveParameters(1, 0);
  });

  test("returns undefined", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(onBeforeBuild(() => {})).toBeUndefined();
  });

  test("runs callback when compile is called", () => {
    expect.assertions(1);
    const spy = mock();
    onBeforeBuild(spy);
    compile("");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("runs callback before compilation", () => {
    expect.assertions(1);
    let order = "";
    onBeforeBuild(() => {
      order += "1";
    });
    // eslint-disable-next-line no-template-curly-in-string
    compile("${(x) => x.fn.foo()}", {
      globals: {
        fn: {
          foo() {
            order += "2";
          },
        },
      },
    });
    expect(order).toBe("12");
  });

  test("runs callback before onAfterBuild", () => {
    expect.assertions(1);
    let order = "";
    onBeforeBuild(() => {
      order += "1";
    });
    onAfterBuild(() => {
      order += "2";
    });
    compile("");
    expect(order).toBe("12");
  });

  test("runs callbacks in order of registration", () => {
    expect.assertions(1);
    let order = "";
    onBeforeBuild(() => {
      order += "1";
    });
    onBeforeBuild(() => {
      order += "2";
    });
    onBeforeBuild(() => {
      order += "3";
    });
    compile("");
    expect(order).toBe("123");
  });
});

describe("onAfterBuild", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(onAfterBuild).toBeFunction();
    expect(onAfterBuild).not.toBeClass();
  });

  test("expects 1 parameter", () => {
    expect.assertions(1);
    expect(onAfterBuild).toHaveParameters(1, 0);
  });

  test("returns undefined", () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    expect(onAfterBuild(() => {})).toBeUndefined();
  });

  test("runs callback when compile is called", () => {
    expect.assertions(1);
    const spy = mock();
    onAfterBuild(spy);
    compile("");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("runs callback before compilation", () => {
    expect.assertions(1);
    let order = "";
    onAfterBuild(() => {
      order += "1";
    });
    // eslint-disable-next-line no-template-curly-in-string
    compile("${(x) => x.fn.foo()}", {
      globals: {
        fn: {
          foo() {
            order += "2";
          },
        },
      },
    });
    expect(order).toBe("21");
  });

  test("runs callback after onBeforeBuild", () => {
    expect.assertions(1);
    let order = "";
    onAfterBuild(() => {
      order += "1";
    });
    onBeforeBuild(() => {
      order += "2";
    });
    compile("");
    expect(order).toBe("21");
  });

  test("runs callbacks in order of registration", () => {
    expect.assertions(1);
    let order = "";
    onAfterBuild(() => {
      order += "1";
    });
    onAfterBuild(() => {
      order += "2";
    });
    onAfterBuild(() => {
      order += "3";
    });
    compile("");
    expect(order).toBe("123");
  });
});

describe("compile", () => {
  test("is a function", () => {
    expect.assertions(2);
    expect(compile).toBeFunction();
    expect(compile).not.toBeClass();
  });

  test("expects 2 parameters (1 optional)", () => {
    expect.assertions(1);
    expect(compile).toHaveParameters(1, 1);
  });

  test("returns expected object shape", () => {
    expect.assertions(1);
    const compiled = compile("");
    expect(compiled).toEqual({
      css: "",
      map: undefined,
      dependencies: [],
      warnings: [],
    });
  });

  test("returns expected result with empty code", () => {
    expect.assertions(2);
    const compiled = compile("");
    expect(compiled.css).toBe("");
    expect(compiled.warnings).toHaveLength(0);
  });

  test("runs with complex code", () => {
    expect.assertions(2);
    const compiled = compile(complexCodeFixture);
    expect(compiled.css).toBe(complexCodeResult);
    expect(compiled.warnings).toHaveLength(0);
  });

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

    test("has _map property as instance of GenMapping", () => {
      expect.assertions(1);
      const compiled = compile("", { map: true });
      // eslint-disable-next-line no-underscore-dangle
      expect(compiled.map?._map).toBeInstanceOf(GenMapping);
    });

    test("has an addMapping method", () => {
      expect.assertions(2);
      const compiled = compile("", { map: true });
      expect(compiled.map).toHaveProperty("addMapping");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(compiled.map?.addMapping).toBeFunction();
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

    // TODO: Test addMapping method expects 1 parameter
    // TODO: Test addMapping method adds mapping to source map
    // TODO: Test toString method expects 0 parameters
    // TODO: Test toString method returns expected string
    // TODO: Test toJSON method expects 0 parameters
    // TODO: Test toJSON method returns expected object shape
  });
});
