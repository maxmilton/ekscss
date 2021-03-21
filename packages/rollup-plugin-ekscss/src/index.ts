/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { compile, XCSSCompileOptions, XCSSGlobals } from 'ekscss';
import { resolve } from 'path';
import type { Plugin } from 'rollup';

export interface PluginOptions
  extends Omit<XCSSCompileOptions, 'from' | 'globals'> {
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

  // const cache_emit = new Map();

  return {
    name: 'ekscss',

    // resolveId(importee) {
    //   if (cache_emit.has(importee)) return importee;
    // },

    // load(id) {
    //   return cache_emit.get(id) || null;
    // },

    transform(code, id) {
      if (!filter(id)) return null;

      const result = compile(code, {
        // to: id.replace(/\.xcss$/, '.css'),
        from: id,
        globals: _config.globals,
        plugins,
        rootDir,
      });

      if (typeof config === 'string') {
        this.addWatchFile(config);
      }
      for (const dep of result.dependencies) {
        this.addWatchFile(dep);
      }

      for (const warning of result.warnings) {
        this.warn(warning);
      }

      // compiled.js.code += `\nimport ${JSON.stringify(fname)};\n`;
      // cache_emit.set(id.replace(/\.xcss$/, '.css'), result.css);

      return {
        code: result.css,
        map: result.map,
      };
    },
  };
}
