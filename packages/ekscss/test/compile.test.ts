// TODO: Write more tests
// - Validate "warnings" are generated in expected scenarios and file, line, column are correct
// - Validate "dependencies" are added correctly

// biome-ignore-all lint/suspicious/noTemplateCurlyInString: used in tests

import { describe, expect, mock, test } from "bun:test";
import { compile, onAfterBuild, onBeforeBuild } from "../src/compiler.ts";
import { ctx } from "../src/helpers.ts";

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
  \${fn.each(x.color, (name, value) => xcss\`
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
    compile("${(x, fn) => fn.foo()}", {
      functions: {
        foo() {
          order += "2";
        },
      },
      globals: {},
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
    compile("${(x, fn) => fn.foo()}", {
      functions: {
        foo() {
          order += "2";
        },
      },
      globals: {},
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

  test("resets ctx even when interpolation throws", () => {
    expect.assertions(2);
    // eslint-disable-next-line no-template-curly-in-string
    expect(() => compile("${undefinedVariable}")).toThrow();
    // Without a try/finally around the compile pipeline, a thrown error
    // leaves ctx dangling with this failed compile's state (e.g. rootDir
    // stuck at the value it was set to) instead of reset to undefined.
    expect(ctx.rootDir).toBeUndefined();
  });

  test("a later compile still works correctly after a prior one threw", () => {
    expect.assertions(1);
    try {
      // eslint-disable-next-line no-template-curly-in-string
      compile("${undefinedVariable}");
    } catch {
      // expected
    }
    const compiled = compile(complexCodeFixture);
    expect(compiled.css).toBe(complexCodeResult);
  });

  // See sourcemap.test.ts for source map behavior.
});
