import { createFilter, FilterPattern } from '@rollup/pluginutils';
// import colors from 'colorette';
// import { performance } from 'perf_hooks';
import type { Plugin } from 'rollup';

interface PluginOptions {
  /** Files to exclude from processing. */
  exclude?: FilterPattern;
  /** Files to include in processing. */
  include?: FilterPattern;
  whitelist?: ReadonlyArray<string | RegExp> | string | RegExp;
}

// export const defaultWhitelist = ['body', 'html'];

export default function rollupPlugin({
  exclude = [],
  // whitelist = defaultWhitelist,
  // FIXME: Figure out a better way to support sapper rather than main.css
  // include = [/\.xcss(\.js)?$/, /src\/css\/main\.css$/],
  include = [/\.xcss?$/, /src\/css\/main\.css$/],
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);

  return {
    name: 'xcss-purge',

    transform(code, id) {
      if (!filter(id)) return;

      return { code };
    },
  };
}
