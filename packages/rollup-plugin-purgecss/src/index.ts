import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { PurgeCSS } from 'purgecss';
import type { Plugin } from 'rollup';

export interface PluginOptions {
  /**
   * Files to exclude from processing.
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Files to include in processing.
   * @default /\.x?css$/
   */
  include?: FilterPattern;
}

export default function rollupPlugin({
  exclude = [],
  include = /\.x?css$/,
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);

  return {
    name: 'xcss-purge',

    async transform(code, id) {
      if (!filter(id)) return null;

      this.error('This plugin currently does nothing');

      // REF: https://github.com/FullHuman/purgecss/blob/master/packages/rollup-plugin-purgecss/src/index.ts

      // @ts-expect-error - TODO: Remove comment
      const purgedcss = await new PurgeCSS().purge({
        content: [
          { extension: '.html', raw: 'FIXME' },
          { extension: '.js', raw: 'FIXME' },
        ],
        css: [{ raw: code }],
        safelist: ['html', 'body'],
      });

      // @ts-expect-error - TODO: Remove comment
      return {
        code: purgedcss[0].css,
        map: { mappings: '' },
      };
    },
  };
}
