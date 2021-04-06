import type { DocsConfig } from './types';

const oldTitle = document.title;
let config: Required<DocsConfig>;

export function getConfig(): Required<DocsConfig> {
  if (config) return config;

  // eslint-disable-next-line no-return-assign
  return (config = {
    root: '.',
    routes: ['README.md'],
    title: oldTitle,
    ...(window.docsconfig || {}),
  });
}

export function toName(path: string): string {
  return (
    path
      // remove preceding directory path
      .substring(path.lastIndexOf('/') + 1)
      .toLowerCase()
      // remove file extension
      .replace(/\.md/, '')
      // replace separators with a space
      .replace(/[-_]+/g, ' ')
      // capitalise
      // https://github.com/sindresorhus/titleize/blob/main/index.js
      .replace(/(?:^|\s|-)\S/g, (x) => x.toUpperCase())
  );
}

/**
 * Delay running a function until X ms have passed since its last call.
 */
export function debounce<T extends Function>(fn: T, delay = 260): T {
  let timer: number;

  // @ts-expect-error
  return function (this: any, ...args) {
    const context = this;

    clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
