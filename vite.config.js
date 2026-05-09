import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  appType: "spa",
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
