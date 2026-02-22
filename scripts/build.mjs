import { build } from "esbuild";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");

await build({
  entryPoints: [
    resolve(rootDir, "src/background/index.ts"),
    resolve(rootDir, "src/content/index.ts"),
    resolve(rootDir, "src/popup/index.ts")
  ],
  outdir: resolve(rootDir, "dist/scripts"),
  outbase: resolve(rootDir, "src"),
  entryNames: "[dir]/[name]",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  logLevel: "info"
});
