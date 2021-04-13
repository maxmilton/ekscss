// import h from 'stage0';

export interface LinkProps {
  title: string;
  href: string;
}

export type LinkComponent = HTMLAnchorElement;

// interface RefNodes {
//   title: Text;
// }

// TODO: If we never add more elements (e.g., for accordion menu items) use a
// simple document.createElement
// const view = h`
//   <a>#title</a>
// `;
const view = document.createElement('a');

export function Link(item: LinkProps): LinkComponent {
  const root = view.cloneNode(true) as LinkComponent;
  // const { title } = view.collect(root) as RefNodes;

  root.href = item.href;
  // root.title = item.title;
  // title.nodeValue = item.title;
  root.textContent = item.title;

  return root;
}
