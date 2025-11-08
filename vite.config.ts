import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const resolveFromRoot = (...segments: string[]) => path.resolve(rootDir, ...segments);
const toPosix = (inputPath: string) => inputPath.replace(/\\/g, "/");

export default defineConfig(async ({ mode }) => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (mode !== "production" && process.env.REPL_ID !== undefined) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    plugins,
    resolve: {
      alias: [
        { find: "@", replacement: resolveFromRoot("src") },
        { find: /^@\//, replacement: `${toPosix(resolveFromRoot("src"))}/` },
        { find: "@shared", replacement: resolveFromRoot("shared") },
        { find: "@assets", replacement: resolveFromRoot("src", "assets") },
        { find: "@utils", replacement: resolveFromRoot("src", "utils") },
      ],
    },
    build: {
      outDir: resolveFromRoot("dist/public"),
      emptyOutDir: true,
    },
    publicDir: resolveFromRoot("public"),
  };
});
