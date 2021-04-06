import h, { HNode } from 'stage0';
// import reuseNodes from 'stage0/reuseNodes';
import { Link } from './Link';
import { routeMap } from '../router';
import { getConfig } from '../utils';

// TODO: Currently active menu item should have extra CSS class

type SidebarComponent = HNode<HTMLDivElement>;

interface RefNodes {
  list: HTMLDivElement;
}

const view = h`
  <div class=docs-sidebar-wrapper>
    <nav class="docs-sidebar pos-s t0 pa2">
      <div class="df f-col" #list></div>
    </nav>
  </div>
`;

export function Sidebar(): SidebarComponent {
  const root = view;
  const { list } = view.collect(root) as RefNodes;

  for (const [path, route] of routeMap.entries()) {
    const menuitem = route.section
      ? Section(route.name)
      : Link({
        title: route.name,
        href: path,
      });

    list.appendChild(menuitem);
  }

  return root;
}

// TODO: Move somewhere better

type SectionComponent = HTMLHeadingElement;

const sectionView = document.createElement('h2');

function Section(title: string): SectionComponent {
  const root = sectionView.cloneNode(true) as SectionComponent;

  root.className = 'docs-menu-section';
  root.textContent = title;

  return root;
}
