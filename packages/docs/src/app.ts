import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Router } from './router';
import './app.xcss';

const append = (node: Node, parent = document.body) => parent.appendChild(node);

export function render(): void {
  const wrapper = document.createElement('div');
  const main = document.createElement('main');

  wrapper.className = 'df h100';
  main.className = 'docs-main';

  append(Header());
  append(Sidebar(), wrapper);
  append(Router(), main);
  append(Footer(), main);
  append(main, wrapper);
  append(wrapper);
}
