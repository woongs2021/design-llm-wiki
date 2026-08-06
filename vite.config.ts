import { existsSync } from "node:fs";
import { defineConfig } from "vite";

const dataTarget = process.env.DATA_TARGET ?? "internal";
const publicDir = `dist/${dataTarget}`;

if (!existsSync(`${publicDir}/data/index.json`)) {
  console.warn(
    `[vite] Missing ${publicDir}/data/index.json. Run: npm run build -- --target=${dataTarget}`,
  );
}

export default defineConfig({
  base: "./",
  // Serve / copy the built index bundle (JSON + assets). UI never reads Markdown.
  publicDir: existsSync(publicDir) ? publicDir : false,
  build: {
    outDir: "dist/app",
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: ["."],
    },
  },
});
