import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    exclude: ["@ui-sdk/core"],
  },
  server: {
    port: 5173,
  },
  build: {
    target: "es2022",
  },
});
