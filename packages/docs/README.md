# @ekscss/docs

> WARNING: This package may be moved into a separate repo and renamed if it ends up being reused in other projects.

Minimalist no-build documentation web app runtime. For the times you want a better experience than just markdown files.

**Features:**

- Zero config
- No build step — only a simple entry `index.html` is required as HTML is generated on the fly from your markdown content
- Lightweight-ish — around 15kb g'zip'd, mostly the markdown parser
- Works with any web server — uses hash based routing so no special server configuration required
- Simple, functional, and friendly UX

## Usage

TODO: Write me; show/describe basic `index.html`

TODO: Add a note about if they're OK with sending me error details, add a trackx script snippet to their html -- it would be much appreciated!

TODO: Documentation:

- Routes - Menu item name is automatically inferred from path (capitalised + separators into space) -- if you want some other name, use object notation with "name" field
- Customise theme with CSS vars:
  - `--sidebar-width`
- Uses fetch so you need to include a polyfill for old browser support (+ list others that might need polyfills)
- No sanitation, directly render the resulting HTML from your markdown, open for XSS, don't accidentally pwn your reader

- Similar projects:
  - https://docusaurus.io/docs/
  - https://docsify.js.org/#/?id=docsify

## Licence

`ekscss` is an MIT licensed open source project. See [LICENCE](https://github.com/MaxMilton/ekscss/blob/master/LICENCE).

---

© 2021 [Max Milton](https://maxmilton.com)
