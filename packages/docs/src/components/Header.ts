import h, { HNode } from 'stage0';
import { getConfig } from '../utils';

export type HeaderComponent = HNode<HTMLElement>;

interface RefNodes {
  name: HTMLHeadingElement;
}

const view = h`
  <header class="docs-header dfc pa2 bg-gold5">
    <a href=/ class="docs-logo dib text">
      <h2 class=mv0 #name></h2>
    </a>
  </header>
`;

export function Header(): HeaderComponent {
  const root = view;
  // const root = view.cloneNode(true) as HeaderComponent;
  const { name } = view.collect(root) as RefNodes;

  const config = getConfig();

  name.textContent = config.title;

  return root;
}
