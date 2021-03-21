#!/usr/bin/env node
const sade = require('sade');
const boot = require('./index.js');
const pkg = require('./package.json');

sade('xcss [src] [dest]')
  .version(pkg.version)
  .describe('Compile XCSS into CSS using ekscss')
  .example('styles.xcss dist/styles.css')
  .example('--map=false styles.xcss')
  .example('-q')
  .option('-c, --config', 'Use specified config file')
  .option('-m, --map', 'Generate a source map', true)
  .option('-q, --quiet', "Don't print errors or stats")
  .action(boot)
  .parse(process.argv);
