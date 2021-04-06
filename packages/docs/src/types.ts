import type h from 'stage0';
import type { getConfig } from './utils';

declare global {
  interface HTMLElement {
    /** stage0 synthetic click event handler. */
    __click(event: MouseEvent): void;
  }

  interface Window {
    docsconfig?: DocsConfig;
    /** `stage0` tagged template literal function for docs plugins use. */
    h: typeof h;
    getConfig: typeof getConfig;
    /** for docs plugins use. */
  }
}

export interface Route {
  /** Creates a new menu section with a list of child routes. */
  children?: Routes;
  /**
   * Name of the menu section or content item.
   *
   * When not provided name is inferred from route `path`.
   */
  name?: string;
  /**
   * File path.
   *
   * You can use a directory path when also providing `children` for child
   * paths to be resolved relative to your route path.
   *
   * When used together with `name` you can use this to explicitly set a
   * content item name instead of the default of inferring it from the path.
   */
  path?: string;
}

/**
 * List of content paths or Route definitions.
 *
 * When using a string the menu item name is inferred from the path.
 */
export type Routes = Array<string | Route>;

export interface DocsConfig {
  /**
   * Document title to append to page titles.
   *
   * When not provided title is inferred from the HTML document
   * `<title>...</title>` on initial page load.
   */
  title?: string;
  /**
   * Markdown content URL path root.
   *
   * @default '.' // content is relative to HTML document
   */
  root?: string;
  /**
   * Routes structure.
   *
   * @default ['README.md']
   */
  routes?: Routes;
}
