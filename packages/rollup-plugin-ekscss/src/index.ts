import { ConfigLoader } from "@ekscss/config-loader";
import { createFilter, type FilterPattern } from "@rollup/pluginutils";
import { compile, type CompileOptions, resolvePlugins } from "ekscss";
import type { Plugin } from "rollup";

export type Config = Omit<CompileOptions, "from" | "to">;

// TODO: Document the const fallbacks e.g., if map==null fall back to rollup output setting

export interface PluginOptions {
  /** An XCSS config object or the path to a config file. */
  config?: Config | string;
  /**
   * Files to exclude from processing.
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Files to include in processing.
   * @default /\.xcss$/
   */
  include?: FilterPattern;
}

export default function rollupPlugin({
  config,
  exclude = [],
  include = /\.xcss$/,
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);
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
  let useSourceMaps: boolean | "inline" | "hidden";

  return {
    name: "ekscss",

    renderStart(outputOptions) {
      useSourceMaps = outputOptions.sourcemap;
    },

    async buildStart() {
      if (!config || typeof config === "string") {
        // load user defined config or fall back to default file locations
        const result = await cl.load(config);
        configData = (result?.data as Config | undefined) ?? {};
        configPath = result?.path;

        if (!configPath) {
          this.warn("Unable to locate XCSS config");
        }
      } else {
        configData = config;
      }

      if (configData.plugins) {
        configData.plugins = resolvePlugins(configData.plugins);
      }
    },

    transform(code, id) {
      if (!filter(id)) return null;

      const compiled = compile(code, {
        rootDir: configData.rootDir,
        from: id,
        // TODO: Remove if we never change the output file name
        // to: id.replace(/\.xcss$/, '.css'),
        plugins: configData.plugins,
        functions: configData.functions,
        globals: configData.globals,
        map: configData.map ?? !!useSourceMaps,
      });

      for (const warning of compiled.warnings) {
        // FIXME: Show warning origin location -- rollup has no way to define file in pos

        // this.warn(warning.message, {
        //   column: warning.column,
        //   line: warning.line,
        // });
        this.warn(warning.message);

        /* eslint-disable no-console */
        console.warn("XCSS Warning:", warning.message || warning);

        if (warning.file) {
          console.log(
            "  at",
            [warning.file, warning.line, warning.column]
              .filter(Boolean)
              .join(":"),
          );
        }
        /* eslint-enable no-console */
      }

      if (reBadValue.test(compiled.css)) {
        this.warn("Output may contain unwanted value");
      }

      // if (id.endsWith('web-app/src/css/index.xcss')) {
      //   console.log('!! XCSS ID', id);
      //   console.log('!! XCSS MAP', compiled.map);
      // }

      if (this.meta.watchMode) {
        for (const dep of compiled.dependencies) {
          this.addWatchFile(dep);
        }

        if (configPath) {
          this.addWatchFile(configPath);

          // // also watch config file's dependencies
          // module.children
          //   .find((mod) => mod.id === require.resolve('cl'))
          //   ?.children.find((mod) => mod.id === configPath)
          //   ?.children.forEach((mod) => this.addWatchFile(mod.id));
        }
      }

      return {
        code: compiled.css,
        map: compiled.map?.toString() ?? null,
      };
    },

    watchChange(id) {
      if (id === configPath) {
        // delete require.cache[configPath];
        // @ts-expect-error - Clearing data between builds
        configData = undefined;
        configPath = undefined;
        cl.clearCache();
      }
    },
  };
}
