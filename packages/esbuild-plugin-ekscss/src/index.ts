/* eslint-disable no-restricted-syntax */
// https://esbuild.github.io/plugins/

import { compile, XCSSCompileOptions } from 'ekscss';
import type { Plugin } from 'esbuild';
import fs from 'fs';
import JoyCon from 'joycon';
// import path from 'path';

// TODO: Warnings never seem to show on the console

export type XCSSConfig = Omit<XCSSCompileOptions, 'from' | 'to'>;

export const xcss = (config?: string | XCSSConfig): Plugin => ({
  name: 'xcss',

  setup(build) {
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

    // build.onResolve({ filter: /\.xcss$/ }, (args) => ({
    //   path: path.resolve(args.resolveDir, args.path),
    //   namespace: 'xcss',
    // }));

    // build.onLoad({ filter: /.*/, namespace: 'xcss' }, async (args) => {
    build.onLoad({ filter: /\.xcss$/ }, async (args) => {
      const code = await fs.promises.readFile(args.path, 'utf-8');
      const warnings = [];

      if (!configData) {
        if (!config || typeof config === 'string') {
          // load user defined config or fall back to default file locations
          const result = await joycon.load(config ? [config] : undefined);
          configData = result.data || {};
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

      const watchFiles = compiled.dependencies;
      if (configPath) watchFiles.push(configPath);

      return {
        contents: compiled.css,
        loader: 'css',
        warnings,
        watchFiles,
      };
    });
  },
});

export default xcss;
