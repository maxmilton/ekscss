#!/usr/bin/env node

"use strict";

const sade = require("sade");
const boot = require("./index.js");
const pkg = require("./package.json");

sade("xcss [src] [dest]")
  .version(pkg.version)
  .describe("Compile XCSS into CSS using ekscss")
  .example("styles.xcss dist/styles.css")
  .example("--map styles.xcss")
  .example("-q")
  .option("-c, --config", "Use specified config file")
  .option("-m, --map", "Generate a source map", false)
  .option("-q, --quiet", "Don't print result or stats; only errors", false)
  .action(boot)
  .parse(process.argv);
