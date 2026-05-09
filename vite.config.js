import { defineConfig } from "vite";
import { t4tViteApiPlugin } from "./server/vitePluginApi.mjs";

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
  plugins: [t4tViteApiPlugin()],
  server: {
    host: "0.0.0.0",
    allowedHosts,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts,
  },
});
