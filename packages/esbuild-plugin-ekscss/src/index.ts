// https://esbuild.github.io/plugins/
// https://github.com/fayismahmood/sassEs/blob/master/index.js

import type { Plugin } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { compile, XCSSCompileOptions } from 'ekscss';

export const xcssPlugin = (options: XCSSCompileOptions): Plugin => ({
  name: 'xcss',

  setup(build) {
    build.onResolve({ filter: /\.xcss$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path),
      namespace: 'xcss',
    }));

    build.onLoad({ filter: /.*/, namespace: 'xcss' }, async (args) => {
      const code = await fs.promises.readFile(args.path, 'utf-8');

      const result = compile(code, {
        ...options,
        from: args.path,
      });

      return {
        contents: result.css,
        loader: 'css',
        warnings: result.warnings.map((warn) => ({
          text: warn.message,
          location: {
            file: warn.filename,
            namespace: 'xcss',
            line: warn.start?.line,
            column: warn.start?.column,
          },
          // notes: '',
          detail: warn,
        })),
      };
    });
  },
});

export default xcssPlugin;
