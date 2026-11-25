import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    target: "es2022",
    ssr: "src/server/node.ts",
    rollupOptions: {
      output: {
        entryFileNames: "server.js",
      },
    },
  },
});
