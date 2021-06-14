import { createFilter, FilterPattern } from '@rollup/pluginutils';
import fs from 'fs';
import path from 'path';
import { defaultOptions, PurgeCSS } from 'purgecss';
import type { OutputAsset, Plugin } from 'rollup';

type PurgeCSSOptions = Partial<typeof defaultOptions>;

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
  /** PurgeCSS options. */
  options?: Omit<PurgeCSSOptions, 'css' | 'stdin' | 'stdout'>;
  /**
   * PurgeCSS, which this plugin uses under the hood, does not support source
   * maps. After purging unused CSS your source maps will be invalid. By setting
   * this option to `true` these invalid source maps will be deleted.
   * @default false
   */
  removeInvalidSourceMaps?: boolean;
}

const reMapRef = /\n?\/\*# sourceMappingURL=(.*) \*\//g;

export default function rollupPlugin({
  exclude = [],
  include = /\.css$/,
  options = {},
  removeInvalidSourceMaps,
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
          const purgecssOpts = {
            // default options
            safelist: ['html', 'body'],
            // user defined options
            ...options,
            // enforced options
            content: [
              ...Object.entries(bundle)
                .filter(([key]) => key.endsWith('.html') || key.endsWith('.js'))
                .map(([key, value]) => ({
                  extension: path.extname(key),
                  raw:
                    value.type === 'chunk'
                      ? value.code
                      : value.source.toString(),
                })),
              ...(options.content ? options.content : []),
            ],
            css: [{ raw: asset.source.toString() }],
          };

          // eslint-disable-next-line no-await-in-loop
          const purged = await new PurgeCSS().purge(purgecssOpts);

          let { css } = purged[0];

          if (outputOpts.sourcemap) {
            this.warn('PurgeCSS does not support sourcemaps.');

            if (removeInvalidSourceMaps) {
              let match: RegExpExecArray | null;

              // eslint-disable-next-line no-cond-assign
              while ((match = reMapRef.exec(css)) !== null) {
                try {
                  // eslint-disable-next-line no-await-in-loop
                  await fs.promises.rm(
                    path.join(process.cwd(), outputOpts.dir, match[1]),
                  );
                } catch (err) {
                  /* noop */
                }
              }

              css = css.replace(/\n?\/\*# sourceMappingURL=.*\*\//g, '');
            }
          }

          // eslint-disable-next-line no-await-in-loop
          await fs.promises.writeFile(
            path.join(process.cwd(), outputOpts.dir, filename),
            css,
            'utf8',
          );
        }
      }
    },
  };
}
