import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const staticDir = resolve(rootDir, "static");
const distDir = resolve(rootDir, "dist");

await mkdir(distDir, { recursive: true });
await cp(staticDir, distDir, { recursive: true });
