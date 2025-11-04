// Based on https://github.com/egoist/joycon/blob/4c1e87691bfe0b3b5ffc46f5ac546ed4c710a9d2/src/index.js (MIT)

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/prefer-nullish-coalescing, global-require */

import fs from "node:fs";
import path from "node:path";

const pathExists = (filePath: string): Promise<boolean> =>
  new Promise((resolve) => {
    fs.access(filePath, (error) => {
      resolve(!error);
    });
  });

interface ConfigLoaderOptions {
  files: string[];
  cwd?: string;
  stopDir?: string;
  packageKey?: string;
  noCache?: boolean;
}

interface ConfigLoaderResult {
  path: string;
  data: unknown;
}

export class ConfigLoader {
  files: string[];
  cwd: string;
  stopDir: string;
  packageKey: string | undefined;
  noCache: boolean;

  loadCache = new Map<string, unknown>();
  existsCache = new Map<string, boolean>();
  packageJsonCache = new Map<string, unknown>();

  constructor({
    files,
    cwd = process.cwd(),
    stopDir,
    packageKey,
    noCache = process.env.NODE_ENV !== "test",
  }: ConfigLoaderOptions) {
    // eslint-disable-next-line unicorn/explicit-length-check
    if (!files.length) {
      throw new TypeError("files must be a non-empty array");
    }

    this.files = files;
    this.cwd = path.resolve(cwd);
    this.stopDir = stopDir ? path.resolve(stopDir) : path.parse(this.cwd).root;
    this.packageKey = packageKey;
    this.noCache = noCache;
  }

  clearCache(): void {
    this.loadCache.clear();
    this.existsCache.clear();
    this.packageJsonCache.clear();
  }

  async resolve(dir: string): Promise<string | null> {
    // Don't traverse above the module root
    if (dir === this.stopDir || path.basename(dir) === "node_modules") {
      return null;
    }

    for (const fileName of this.files) {
      const filePath = path.resolve(dir, fileName);
      let exists = this.existsCache.get(filePath);

      if (exists === undefined) {
        // eslint-disable-next-line no-await-in-loop
        exists = await pathExists(filePath);
        if (!this.noCache) {
          this.existsCache.set(filePath, exists);
        }
      }

      // eslint-disable-next-line no-continue
      if (!exists) continue;

      if (!this.packageKey || path.basename(filePath) !== "package.json") {
        return filePath;
      }

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[filePath];
      const pkg = require(filePath) as Record<string, unknown>;

      if (Object.prototype.hasOwnProperty.call(pkg, this.packageKey)) {
        this.packageJsonCache.set(filePath, pkg[this.packageKey]);
        return filePath;
      }
    }

    // Continue in parent directory
    return this.resolve(path.dirname(dir));
  }

  async load(configPath?: string): Promise<ConfigLoaderResult | null> {
    const filePath = configPath ? path.resolve(configPath) : await this.resolve(this.cwd);

    if (!filePath) return null;

    let data = this.loadCache.get(filePath);
    if (!data) {
      data = await this.loadData(filePath);
      this.loadCache.set(filePath, data);
    }

    return { path: filePath, data };
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private loadData(filePath: string): unknown | Promise<unknown> {
    const extname = path.extname(filePath);
    if (extname === ".js" || extname === ".ts" || extname === ".mjs" || extname === ".cjs") {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[filePath];
      const mod = require(filePath) as Record<string, unknown>;
      return mod.default || mod;
    }

    if (this.packageJsonCache.has(filePath)) {
      return this.packageJsonCache.get(filePath);
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
}
