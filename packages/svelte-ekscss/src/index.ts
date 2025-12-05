/* eslint-disable no-console */

import { ConfigLoader } from "@ekscss/config-loader";
import { type CompileOptions, compile, resolvePlugins } from "ekscss";
import * as colors from "kleur/colors";
import type { Preprocessor, PreprocessorGroup } from "svelte/compiler";

export type Config = Omit<CompileOptions, "from" | "to">;

interface PluginOptions {
  /** An XCSS config object or the path to a config file. */
  config?: Config | string;
}

export const style = ({ config }: PluginOptions = {}): Preprocessor => {
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
  let configData: Config;
  let configPath: string | undefined;

  return async ({ attributes, content, filename }) => {
    if (attributes.lang !== "xcss") return;

    // NOTE: Svelte has no way to identify when the config was changed when
    // watching during dev mode, so to update the config the whole svelte
    // processes must be manually restarted

    if (!config || typeof config === "string") {
      // Load user defined config or fall back to default file locations
      const result = await cl.load(config);
      configData = (result?.data as Config | undefined) ?? {};
      configPath = result?.path;

      if (!configPath) {
        console.warn(colors.yellow("Warning:"), "Unable to locate XCSS config");
      }
    } else {
      configData = config;
    }

    if (configData.plugins) {
      configData.plugins = resolvePlugins(configData.plugins);
    }

    const compiled = compile(content, {
      rootDir: configData.rootDir,
      from: filename,
      plugins: configData.plugins,
      functions: configData.functions,
      globals: configData.globals,
      map: configData.map,
    });

    for (const warning of compiled.warnings) {
      console.warn(colors.yellow("Warning:"), warning.message || warning);

      if (warning.file) {
        console.log(
          "  at",
          colors.dim([warning.file, warning.line, warning.column].filter(Boolean).join(":")),
        );
      }
    }

    if (reBadValue.test(compiled.css)) {
      console.warn(colors.yellow("Warning:"), "XCSS output may contain unwanted value");
    }

    const { css, dependencies, map } = compiled;
    if (configPath) dependencies.push(configPath);

    // eslint-disable-next-line consistent-return
    return {
      code: css,
      dependencies,
      ...(map && { map: map.toString() }),
    };
  };
};

const preprocessor = (opts: PluginOptions): PreprocessorGroup => ({
  name: "ekscss",
  style: style(opts),
});

export default preprocessor;
