// https://esbuild.github.io/plugins/

import { ConfigLoader } from "@ekscss/config-loader";
import { compile, type CompileOptions, resolvePlugins } from "ekscss";
import type { PartialMessage, Plugin } from "esbuild";
import * as fs from "fs";

export type Config = Omit<CompileOptions, "from" | "to">;

export const xcss = (config?: string | Config): Plugin => ({
  name: "xcss",

  setup(build) {
    const reBadValue = /UNDEFINED|INVALID|#apply:|null|undefined|NaN|\[object \w+]/;
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

    build.onLoad({ filter: /\.xcss$/ }, async (args) => {
      const code = await fs.promises.readFile(args.path, "utf8");
      const warnings: PartialMessage[] = [];

      if (!configData) {
        if (!config || typeof config === "string") {
          // Load user defined config or fall back to default file locations
          const result = await cl.load(config);
          configData = (result?.data as Config | undefined) ?? {};
          configPath = result?.path;

          if (!configPath) {
            warnings.push({ text: "Unable to locate XCSS config" });
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
        from: args.path,
        // TODO: Get "to" value
        globals: configData.globals,
        map: configData.map ?? !!build.initialOptions.sourcemap,
        plugins: configData.plugins,
        rootDir: configData.rootDir,
      });

      for (const warning of compiled.warnings) {
        warnings.push({
          text: warning.message,
          // @ts-expect-error - FIXME: location* should take undefined -- submit a PR to esbuild
          location: {
            namespace: "xcss",
            file: warning.file,
            line: warning.line,
            column: warning.column,
          },
          detail: warning,
        });
      }

      // TODO: Get the location.line and location.column of matches to make it
      // far easier to debug or even know what's going on for users (otherwise
      // the warning is a bit cryptic!)
      if (reBadValue.test(compiled.css)) {
        warnings.push({
          text: "Output may contain unwanted value",
          location: {
            namespace: "xcss",
            file: args.path,
          },
        });
      }

      let output = compiled.css;

      // XXX: Source maps for CSS are not yet supported in esbuild but adding
      // here anyway in preparation for when they are supported; see:
      // - https://github.com/evanw/esbuild/issues/519
      // - https://github.com/evanw/esbuild/issues/20
      if (compiled.map) {
        output += `\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${
          Buffer.from(
            compiled.map.toString(),
          ).toString("base64")
        } */`;
      }

      const watchFiles = compiled.dependencies;
      if (configPath) watchFiles.push(configPath);

      return {
        contents: output,
        loader: "css",
        warnings,
        watchFiles,
      };
    });
  },
});

export default xcss;
