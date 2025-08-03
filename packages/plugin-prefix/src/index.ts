import { stylis } from "ekscss";

// TODO: Document this should be the last plugin or else may cause duplicate
// code output (e.g., with @ekscss/plugin-apply)

/**
 * XCSS plugin to add vendor prefixes.
 */
export const prefixPlugin = stylis.prefixer;

export default prefixPlugin;
