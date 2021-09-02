/* eslint-disable no-restricted-syntax */
// https://esbuild.github.io/plugins/

import { compile, XCSSCompileOptions } from 'ekscss';
import type { Plugin } from 'esbuild';
import fs from 'fs';
import JoyCon from 'joycon';

export type XCSSConfig = Omit<XCSSCompileOptions, 'from' | 'to'>;

export const xcss = (config?: string | XCSSConfig): Plugin => ({
  name: 'xcss',

  setup(build) {
    const joycon = new JoyCon({
      files: [
        '.xcssrc.cjs',
        '.xcssrc.js',
        '.xcssrc.json',
        'xcss.config.cjs',
        'xcss.config.js',
        'xcss.config.json',
        'package.json',
      ],
      packageKey: 'xcss',
    });
    let configData: XCSSConfig;
    let configPath: string | undefined;

    // @ts-expect-error - FIXME: warnings[].location* should take undefined
    build.onLoad({ filter: /\.xcss$/ }, async (args) => {
      const code = await fs.promises.readFile(args.path, 'utf-8');
      const warnings = [];

      if (!configData) {
        if (!config || typeof config === 'string') {
          // load user defined config or fall back to default file locations
          const result = await joycon.load(config ? [config] : undefined);
          configData = (result.data as XCSSConfig) || {};
          configPath = result.path;

          if (!result.path) {
            warnings.push({ text: 'Unable to locate XCSS config' });
          }
        } else {
          configData = config || {};
        }
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
          location: {
            namespace: 'xcss',
            file: warning.file,
            line: warning.line,
            column: warning.column,
          },
          detail: warning,
        });
      }

      let output = compiled.css;

      // XXX: Source maps for CSS are not yet supported in esbuild but adding
      // here anyway in preparation for when they are supported; see:
      // - https://github.com/evanw/esbuild/issues/519
      // - https://github.com/evanw/esbuild/issues/20
      if (compiled.map) {
        output += `\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
          compiled.map.toString(),
        ).toString('base64')} */`;
      }

      const watchFiles = compiled.dependencies;
      if (configPath) watchFiles.push(configPath);

      return {
        contents: output,
        loader: 'css',
        warnings,
        watchFiles,
      };
    });
  },
});

export default xcss;
