/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import csso from 'csso';
import path from 'path';
import type { Plugin } from 'rollup';
import { SourceMapConsumer, SourceMapGenerator, SourceNode } from 'source-map';

export interface PluginOptions {
  /**
   * Files to exclude from processing.
   *
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Files to include in processing.
   *
   * @default /\.x?css$/
   */
  include?: FilterPattern;
  /** Minify CSS with `csso`. */
  minify?: boolean;
  /**
   * Name of combined CSS file to emit.
   *
   * When not defined the asset name will be inferred from `rollup#output.name`
   * or `rollup#output.file`.
   */
  name?: string;
}

export default function rollupPlugin({
  exclude = [],
  name,
  include = /\.x?css$/,
  minify,
}: PluginOptions = {}): Plugin {
  const filter = createFilter(include, exclude);
  const styles = new Map();
  const sourcemaps = new Map();
  let useSourceMaps: boolean | 'inline' | 'hidden';

  return {
    name: 'ekscss-css',

    renderStart(outputOptions) {
      useSourceMaps = outputOptions.sourcemap;
    },

    transform(code, id) {
      if (!filter(id)) return null;

      styles.set(id, code);

      if (useSourceMaps) {
        sourcemaps.set(id, this.getCombinedSourcemap());
      }

      return {
        code: '',
        map: { mappings: '' },
      };
    },

    async generateBundle(outputOpts) {
      if (!styles.size) return;

      let css = '';

      for (const id of styles.keys()) {
        css += styles.get(id) || '';
      }

      if (!css) return;

      const inferredName = name
        || outputOpts.name
        || (outputOpts.file && path.basename(outputOpts.file));

      if (!inferredName) {
        this.error(
          'Unable to infer output CSS asset name; add "name" to plugin options or rollup output options',
        );
      }

      const assetName = inferredName.replace(path.extname(inferredName), '');
      const combinedCss = `${css}`;
      let minifiedMap: SourceMapGenerator | null | undefined;

      if (minify) {
        const minified = csso.minify(css, {
          filename: assetName,
          sourceMap: !!outputOpts.sourcemap,
        });

        css = minified.css;
        minifiedMap = minified.map as SourceMapGenerator;
      }

      const assetFileId = this.emitFile({
        name: `${assetName}.css`,
        source: css,
        type: 'asset',
      });

      if (outputOpts.sourcemap) {
        const mapNodes = [];

        for (const id of sourcemaps.keys()) {
          // eslint-disable-next-line no-await-in-loop
          const consumer = await new SourceMapConsumer(sourcemaps.get(id));
          const node = SourceNode.fromStringWithSourceMap(
            styles.get(id),
            consumer,
          );
          mapNodes.push(node);
        }

        if (minifiedMap) {
          mapNodes.push(
            SourceNode.fromStringWithSourceMap(
              combinedCss,
              await new SourceMapConsumer(minifiedMap.toJSON()),
            ),
          );
        }

        const rootMapNode = new SourceNode(null, null, null, mapNodes);
        const map = rootMapNode.toStringWithSourceMap({
          file: `${assetName}.css`,
        });

        if (outputOpts.sourcemap === 'inline') {
          css += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
            map.map.toString(),
            'utf8',
          ).toString('base64')} */`;
        } else {
          const assetFileName = this.getFileName(assetFileId);

          this.emitFile({
            fileName: `${assetFileName}.map`,
            source: map.map.toString(),
            type: 'asset',
          });

          if (outputOpts.sourcemap !== 'hidden') {
            css += `\n/*# sourceMappingURL=${assetFileName}.map */`;

            // FIXME: Can't getFileName before setting CSS source; Overwriting
            // like this causes a warning: The emitted file "app-c3ca2dbc.css"
            // overwrites a previously emitted file of the same name.
            this.emitFile({
              fileName: assetFileName,
              source: css,
              type: 'asset',
            });
            //  ↳ Can't getFileName before setAssetSource :(
            // this.setAssetSource(assetFileId, css);
          }
        }
      }
    },
  };
}
