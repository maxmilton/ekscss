import * as colors from 'colorette';
// import { performance } from 'perf_hooks';
import { compile, XCSSCompileOptions, XCSSGlobals } from 'ekscss';
import type { Preprocessor, PreprocessorGroup } from './types';

interface PluginOptions extends Omit<XCSSCompileOptions, 'from' | 'globals'> {
  /**
   * An XCSS globals object or the full path to a file with a default export
   * containing the globals.
   */
  globals?: XCSSGlobals | string;
}

export const style = ({
  globals,
  plugins,
  rootDir,
}: PluginOptions = {}): Preprocessor => {
  let xcssGlobals = globals;

  if (typeof xcssGlobals === 'string') {
    const mod = require(xcssGlobals);
    xcssGlobals = (mod.default || mod) as XCSSGlobals;
  }

  return ({ attributes, content, filename }) => {
    if (attributes.lang !== 'xcss') return;

    // console.log('[XCSS|SVELTE] ID', colors.cyan(filename || ''));
    // console.log('[XCSS|SVELTE] CODE', content);

    // const t0 = performance.now();
    const result = compile(content, {
      from: filename,
      // @ts-expect-error - FIXME: TS doesn't detect string xcssGlobals was reassigned
      globals: xcssGlobals,
      plugins,
      rootDir,
    });
    // const t1 = performance.now();
    // console.log(
    //   `[XCSS|SVELTE] compile ${colors.blue(
    //     // @ts-expect-error
    //     Number.parseFloat(t1 - t0).toPrecision(2),
    //   )}ms`,
    // );

    for (const warning of result.warnings) {
      console.warn(colors.bold(colors.yellow('WARNING:')), warning.message);
      // console.warn(warning.message);
      // console.warn(Object.assign(new Error(warning.message), warning));
      // console.warn(Object.assign(new Warning(warning.message), warning));
    }

    // console.log('[XCSS|SVELTE] CSS', result.css);
    // console.log('[XCSS|SVELTE] dependencies', result.dependencies);

    return {
      code: result.css,
      dependencies: result.dependencies,
      // map: result.map,
    };
  };
};

export default (opts: PluginOptions): PreprocessorGroup => ({
  style: style(opts),
});
