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

// TODO: It actually makes much more sense to run csso once all the CSS files
// are bundled into one... move csso into @ekscss/rollup-plugin-css
//  ↳ This plugin should be about removing unused styles!

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

      const purgedcss = await new PurgeCSS().purge({
        content: [
          { extension: '.html', raw: 'FIXME' },
          { extension: '.js', raw: 'FIXME' },
        ],
        css: [{ raw: code }],
        safelist: ['html', 'body'],
      });

      return {
        code: purgedcss[0].css,
        map: { mappings: '' },
      };
    },
  };
}
