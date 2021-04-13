/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import csso from 'csso';
import path from 'path';
import type { Plugin } from 'rollup';
import { SourceMapConsumer, SourceNode } from 'source-map';

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
    name: 'xcss-css',

    renderStart(outputOptions) {
      useSourceMaps = outputOptions.sourcemap;
    },

    transform(code, id) {
      if (!filter(id)) return null;

      styles.set(id, code);

      if (useSourceMaps) {
        sourcemaps.set(id, this.getCombinedSourcemap());
      }

      // if (id.endsWith('web-app/src/components/Debug.xcss')) {
      // if (id.endsWith('web-app/src/css/index.xcss')) {
      //   console.log('!! ROLLUP CSS ID', id);
      //   console.log('!! ROLLUP CSS MAP', sourcemaps.get(id));
      //   // console.log('!! MODULE INFO', this.getModuleInfo(id));
      // }

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
      let minifiedMap;

      if (minify) {
        const minified = csso.minify(css, {
          filename: assetName,
          sourceMap: !!outputOpts.sourcemap,
        });

        css = minified.css;
        minifiedMap = minified.map;
      }

      if (outputOpts.sourcemap) {
        const mapNodes = [];

        for (const id of sourcemaps.keys()) {
          const consumer = await new SourceMapConsumer(sourcemaps.get(id));
          const node = SourceNode.fromStringWithSourceMap(
            styles.get(id),
            consumer,
          );
          mapNodes.push(node);
        }

        if (minifiedMap) {
          mapNodes.push(
            SourceNode.fromStringWithSourceMap(combinedCss, minifiedMap),
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
          this.emitFile({
            name: `${assetName}.css.map`,
            source: map.map.toString(),
            type: 'asset',
          });

          if (outputOpts.sourcemap !== 'hidden') {
            css += `\n/*# sourceMappingURL=${assetName}.css.map */`;
          }
        }
      }

      this.emitFile({
        name: `${assetName}.css`,
        source: css,
        type: 'asset',
      });
    },
  };
}
