/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { compile, XCSSCompileOptions, XCSSGlobals } from 'ekscss';
import { resolve } from 'path';
import type { Plugin } from 'rollup';

interface PluginOptions extends Omit<XCSSCompileOptions, 'from' | 'globals'> {
  /** XCSS config or the path to a config file. */
  config?: string | { globals: XCSSGlobals };
  /**
   * Files to exclude from processing.
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Files to include in processing.
   * @default [/\.xcss$/]
   */
  include?: FilterPattern;
}

export default function rollupPlugin({
  config,
  exclude = [],
  include = [/\.xcss$/],
  plugins,
  rootDir = process.cwd(),
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);

  let _config = config;

  if (typeof config === 'string') {
    const mod = require(resolve(rootDir, config));
    _config = mod.default || mod;
  }

  return {
    name: 'ekscss',

    // resolveId(source, importer, opts) {
    //   // xx
    // },

    // load(id) {
    //   // xx
    // },

    transform(code, id) {
      if (!filter(id)) return null;

      if (typeof config === 'string') {
        this.addWatchFile(config);
      }

      const result = compile(code, {
        to: id.replace(/\.xcss$/, '.css'),
        from: id,
        globals: _config.globals,
        plugins,
        rootDir,
      });

      for (const dep of result.dependencies) {
        this.addWatchFile(dep);
      }

      for (const warning of result.warnings) {
        this.warn(warning);
      }

      return {
        code: result.css,
        map: result.map,
      };
    },
  };
}
