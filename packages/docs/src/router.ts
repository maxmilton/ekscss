import { setupSyntheticEvent } from 'stage0/syntheticEvents';
import marked from 'marked';
import type { Route, Routes } from './types';
import { getConfig, toName } from './utils';

interface RouteEntry {
  name: string;
  section?: true;
}

export const routeMap = new Map<string, RouteEntry>();

export function routeTo(url: string): void {
  window.location.hash = url;
}

// https://github.com/lukeed/navaid/blob/master/src/index.js#L52
function handleClick(event: MouseEvent): void {
  if (
    event.ctrlKey
    || event.metaKey
    || event.altKey
    || event.shiftKey
    || event.button
    || event.defaultPrevented
  ) {
    return;
  }

  const link = (event.target as HTMLElement).closest('a');
  const href = link && link.getAttribute('href');

  if (
    !href
    || link!.target
    || link!.host !== window.location.host
    || href[0] === '#'
  ) {
    return;
  }

  event.preventDefault();
  routeTo(href);
}

function joinPaths(parent: string, route: string): string {
  return `#/${parent ? `${parent}/` : ''}${route}`;
}

function normaliseRoutes(routes: Routes, parentPath = '') {
  for (const route of routes) {
    const newRoute: Partial<RouteEntry> = {};
    let path: string | undefined;

    if (typeof route === 'string') {
      path = joinPaths(parentPath, route);
    } else {
      if (route.children) {
        newRoute.section = true;
      }
      if (route.path) {
        path = joinPaths(parentPath, route.path);
      }
      newRoute.name = route.name;
    }
    if (!newRoute.name) {
      if (path) {
        newRoute.name = toName(path);
      } else {
        // eslint-disable-next-line no-console
        console.error('Skipping route because no path:', route);
        break;
      }
    }

    routeMap.set(path!, newRoute as RouteEntry);

    // process children after adding parent section to routes
    if (newRoute.section) {
      normaliseRoutes((route as Route).children!, (route as Route).path);
    }
  }
}

export function setupRouter(): void {
  setupSyntheticEvent('click');
  document.body.__click = handleClick;

  const config = getConfig();
  normaliseRoutes(config.routes);
}

interface CodedError extends Error {
  code?: number;
}

async function getContent(path: string): Promise<string> {
  let content;

  try {
    const res = await fetch(path);

    if (!res.ok) {
      const error: CodedError = new Error(res.statusText);
      error.code = res.status;
      throw error;
    }

    content = await res.text();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    /* eslint-disable @typescript-eslint/restrict-template-expressions */
    content = `
<div class="alert alert-error">
  <strong>ERROR:</strong> An error occured when loading content file ${path}
  <br/>${err.code || '500'} ${err.message || 'Unknown error'}
</div>
    `;
    /* eslint-enable */
  }

  return content;
}

type RouterComponent = HTMLDivElement;

const view = document.createElement('div');
view.className = 'docs-page con';

export function Router(): RouterComponent {
  const root = view;
  const config = getConfig();

  const loadRoute = (path: string) => {
    root.innerHTML = 'Loading...';

    if (!path || path === '/') {
      // first route
      routeTo(routeMap.keys().next().value);
      return;
    }

    // eslint-disable-next-line no-void
    void getContent(config.root + path).then((code) => {
      let route = routeMap.get(`#${path}`);

      // TODO: Handle markdown rendering errors
      const html = marked(code, {
        baseUrl: '#/',
      });

      // TODO: Handle missing route properly
      route ??= { name: '' };

      root.innerHTML = html;
      document.title = `${route.name} | ${config.title}`;
      // TODO: Handle in-page links to headings with ids
      window.scrollTo(0, 0);
    });
  };

  const onChange = () => loadRoute(window.location.hash.slice(1));

  // load initial route
  onChange();

  window.addEventListener('hashchange', onChange);

  return root;
}
