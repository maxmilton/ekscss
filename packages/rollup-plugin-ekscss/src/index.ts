/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { compile, XCSSCompileOptions } from 'ekscss';
import type { Plugin } from 'rollup';
import JoyCon from 'joycon';

export type XCSSConfig = Omit<XCSSCompileOptions, 'from' | 'to'>;

// TODO: Document the const fallbacks e.g., if map==null fall back to rollup output setting

export interface PluginOptions {
  /** An XCSS config object or the path to a config file. */
  config?: XCSSConfig | string;
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
  const joycon = new JoyCon({
    files: [
      '.xcssrc.js',
      '.xcssrc.json',
      'xcss.config.js',
      'xcss.config.json',
      'package.json',
    ],
    packageKey: 'xcss',
  });
  let configData: XCSSConfig;
  let configPath: string | undefined;
  let useSourceMaps: boolean | 'inline' | 'hidden';

  return {
    name: 'ekscss',

    renderStart(outputOptions) {
      useSourceMaps = outputOptions.sourcemap;
    },

    async buildStart() {
      if (!config || typeof config === 'string') {
        // load user defined config or fall back to default file locations
        const result = await joycon.load(config ? [config] : undefined);
        configData = result.data || {};
        configPath = result.path;

        if (!result.path) {
          this.warn('Unable to locate XCSS config');
        }
      } else {
        configData = config || {};
      }
    },

    transform(code, id) {
      if (!filter(id)) return null;

      const compiled = compile(code, {
        from: id,
        // TODO: Remove if we never change the output file name
        // to: id.replace(/\.xcss$/, '.css'),
        globals: configData.globals,
        map: configData.map ?? !!useSourceMaps,
        plugins: configData.plugins,
        rootDir: configData.rootDir,
      });

      for (const warning of compiled.warnings) {
        // TODO: Show warning origin location -- rollup has no way to define file in pos
        // this.warn(warning.message, {
        //   column: warning.column,
        //   line: warning.line,
        // });
        this.warn(warning.message);
      }

      // if (id.endsWith('web-app/src/css/index.xcss')) {
      //   console.log('!! XCSS ID', id);
      //   console.log('!! XCSS MAP', compiled.map);
      // }

      if (this.meta.watchMode === true) {
        for (const dep of compiled.dependencies) {
          this.addWatchFile(dep);
        }

        if (configPath) {
          this.addWatchFile(configPath);

          // // also watch config file's dependencies
          // module.children
          //   .find((mod) => mod.id === require.resolve('joycon'))
          //   ?.children.find((mod) => mod.id === configPath)
          //   ?.children.forEach((mod) => this.addWatchFile(mod.id));
        }
      }

      return {
        code: compiled.css,
        map: compiled.map,
      };
    },

    watchChange(id) {
      if (id === configPath) {
        // delete require.cache[configPath];
        configData = undefined;
        configPath = undefined;
        joycon.clearCache();
      }
    },
  };
}
