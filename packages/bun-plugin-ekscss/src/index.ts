import * as fs from "node:fs";
import { ConfigLoader } from "@ekscss/config-loader";
import type { BunPlugin } from "bun";
import { type CompileOptions, compile, resolvePlugins } from "ekscss";

export type Config = Omit<CompileOptions, "from" | "to">;

const RE_BAD_VALUES = /UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/;

export const xcss = (config?: string | Config): BunPlugin => ({
  name: "xcss",

  setup(builder) {
    const cl = new ConfigLoader({
      files: [
        "xcss.config.js",
        "xcss.config.mjs",
        "xcss.config.cjs",
        "xcss.config.json",
        "package.json",
      ],
      packageKey: "xcss",
    });
    let configData: Config | undefined;
    let configPath: string | undefined;

    builder.onLoad({ filter: /\.xcss$/ }, async (args) => {
      const code = await fs.promises.readFile(args.path, "utf8");

      if (!configData) {
        if (!config || typeof config === "string") {
          // Load user defined config or fall back to default file locations
          const result = await cl.load(config);
          configData = (result?.data as Config | undefined) ?? {};
          configPath = result?.path;

          if (!configPath) {
            // eslint-disable-next-line no-console
            console.error("Unable to locate XCSS config");
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          configData = config || {};
        }
      }

      if (configData.plugins) {
        configData.plugins = resolvePlugins(configData.plugins);
      }

      const compiled = compile(code, {
        rootDir: configData.rootDir,
        from: args.path,
        // TODO: Get "to" value
        plugins: configData.plugins,
        functions: configData.functions,
        globals: configData.globals,
        map: configData.map ?? (builder.config.sourcemap && builder.config.sourcemap !== "none"),
      });

      for (const warning of compiled.warnings) {
        // eslint-disable-next-line no-console
        console.error(warning);
      }

      if (RE_BAD_VALUES.test(compiled.css)) {
        // eslint-disable-next-line no-console
        console.error("Output may contain unwanted value", args.path);
      }

      let output = compiled.css;

      if (compiled.map) {
        output += `\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
          compiled.map.toString(),
        ).toString("base64")} */`;
      }

      return {
        contents: output,
        loader: "css",
      };
    });
  },
});

export default xcss;
