/* eslint-disable no-restricted-syntax */

import { createFilter, FilterPattern } from '@rollup/pluginutils';
import path from 'path';
import type { Plugin } from 'rollup';
import { SourceMapConsumer, SourceNode } from 'source-map';

interface Pluginptions {
  /**
   * Files to exclude from processing.
   * @default []
   */
  exclude?: FilterPattern;
  /**
   * Name of combined CSS file to emit. Without this the file name will be
   * inferred from `rollup#output.name` or from `rollup#output.name` or
   * `rollup#output.file`.
   */
  fileName?: string;
  /**
   * Files to include in processing.
   * @default /\.x?css$/
   */
  include?: FilterPattern;
}

export default function rollupPlugin({
  exclude = [],
  fileName,
  include = /\.x?css$/,
}: Pluginptions = {}): Plugin {
  const filter = createFilter(include, exclude);
  const styles = new Map();
  const sourcemaps = new Map();
  let useSourceMaps: boolean | 'inline' | 'hidden' = false;

  return {
    name: 'css',

    renderStart(outputOptions) {
      useSourceMaps = outputOptions.sourcemap;
    },

    transform(code, id) {
      if (!filter(id)) return undefined;

      styles.set(id, code);
      sourcemaps.set(id, this.getCombinedSourcemap());

      if (
        id === '/home/max/Projects/trackx/packages/web-app/src/css/index.xcss'
      ) {
        console.log('!! ROLLUP ID', id);
        console.log('!! ROLLUP MAP', this.getCombinedSourcemap());

        console.log('!! MODULE INFO', this.getModuleInfo(id));
      }

      return {
        code: '',
        map: { mappings: '' },
      };
    },

    // eslint-disable-next-line sort-keys
    async generateBundle(outputOpts) {
      if (!styles.size) return;

      let css = '';

      for (const id of styles.keys()) {
        css += styles.get(id) || '';
      }

      if (!css) return;

      const inferredName = fileName || outputOpts.name || path.basename(outputOpts.file);
      const name = inferredName.replace(path.extname(inferredName), '');

      if (useSourceMaps) {
        const nodes = [];

        for (const id of sourcemaps.keys()) {
          const consumer = await new SourceMapConsumer(sourcemaps.get(id));
          const node = SourceNode.fromStringWithSourceMap(
            styles.get(id),
            consumer,
          );
          nodes.push(node);
        }

        const rootNode = new SourceNode(null, null, null, nodes);
        const map = rootNode.toStringWithSourceMap({ file: `${name}.css` });

        // TODO: Handle useSourceMaps='inline'

        this.emitFile({
          name: `${name}.css.map`,
          source: map.map.toString(),
          type: 'asset',
        });

        if (useSourceMaps !== 'hidden') {
          css += `\n/*# sourceMappingURL=${name}.css.map */`;
        }
      }

      this.emitFile({
        name: `${name}.css`,
        source: css,
        type: 'asset',
      });
    },
  };
}
