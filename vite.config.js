import { defineConfig } from "vite";

const allowedHosts = [
  ...new Set([
    "marvin",
    "localhost",
    ...String(process.env.VITE_ALLOWED_HOSTS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ]),
];

export default defineConfig({
  root: ".",
  appType: "spa",
  server: {
    host: "0.0.0.0",
    allowedHosts,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
