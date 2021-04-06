import type { HNode } from 'stage0';
import { debounce } from '../utils';

function doSearch(text: string) {
  // TODO: Implement search and list filtering
  // TODO: Search results page -- add virtual route
  console.log('@@ SEARCH TEXT', text);
  document.querySelector('.docs-route')!.innerHTML = text;
}

const debouncedSearch = debounce(doSearch);

type SearchComponent = HNode<HTMLDivElement>;

interface Refs {
  input: HTMLInputElement;
}

const view = window.h`
  <div class="docs-search-wrapper ml-auto mv-1">
    <input type=search class="input search" placeholder=Search... #input>
  </div>
`;

function Search(): SearchComponent {
  const root = view.cloneNode(true) as SearchComponent;
  const { input } = view.collect(root) as Refs;

  input.oninput = () => debouncedSearch(input.value);

  return root;
}

document.querySelector('.docs-header')!.appendChild(Search());
