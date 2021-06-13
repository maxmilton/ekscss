import { createFilter, FilterPattern } from '@rollup/pluginutils';
import fs from 'fs';
import path from 'path';
import { PurgeCSS } from 'purgecss';
import type { OutputAsset, Plugin } from 'rollup';

export interface PluginOptions {
  /**
   * Files to exclude from processing. Note this filters output filenames, not
   * input source filenames!
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Files to include in processing. Note this filters output filenames, not
   * input source filenames!
   * @default /\.css$/
   */
  include?: FilterPattern;
}

export default function rollupPlugin({
  exclude = [],
  include = /\.css$/,
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);

  return {
    name: 'ekscss-purgecss',

    async writeBundle(outputOpts, bundle) {
      if (!outputOpts.dir) {
        this.error('This plugin only works when output.dir is set');
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const filename in bundle) {
        if (filter(filename)) {
          const asset = bundle[filename] as OutputAsset;

          // eslint-disable-next-line no-await-in-loop
          const purged = await new PurgeCSS().purge({
            content: Object.entries(bundle)
              .filter(([key]) => key.endsWith('.html') || key.endsWith('.js'))
              .map(([key, value]) => ({
                extension: path.extname(key),
                raw:
                  value.type === 'chunk' ? value.code : value.source.toString(),
              })),
            css: [{ raw: asset.source.toString() }],
            safelist: [':root', 'html', 'body'],
          });

          // eslint-disable-next-line no-await-in-loop
          await fs.promises.writeFile(
            path.join(process.cwd(), outputOpts.dir, filename),
            purged[0].css,
            'utf8',
          );

          if (outputOpts.sourcemap) {
            this.warn('PurgeCSS does not support sourcemaps.');
          }
        }
      }
    },
  };
}
