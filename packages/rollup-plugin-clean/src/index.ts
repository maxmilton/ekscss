import { createFilter, FilterPattern } from '@rollup/pluginutils';
import csso from 'csso';
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
    name: 'xcss-clean',

    transform(code, id) {
      if (!filter(id)) return null;

      const minified = csso.minify(code, {
        filename: id,
        sourceMap: true,
      });

      // if (id.endsWith('web-app/src/css/index.xcss')) {
      //   console.log('!! CLEAN ID', id);
      //   console.log('!! CLEAN MAP', minified.map?.toJSON());
      // }

      return {
        code: minified.css,
        // @ts-expect-error - Poorly typed upstream package
        // eslint-disable-next-line
        map: minified.map?.toJSON(),
      };
    },
  };
}
