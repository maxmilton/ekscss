import h from 'stage0';
import { render } from './app';
import { setupRouter } from './router';
import { getConfig } from './utils';

export * from './types';

setupRouter();

render();

// for docs plugin use
window.h = h;
window.getConfig = getConfig;
