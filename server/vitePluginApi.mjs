/**
 * Embedded /api/* inside Vite (dev + preview) — no proxy, no separate :8788.
 */
import { dispatchApiRoutes } from "./httpApi.mjs";

export function t4tViteApiPlugin() {
  return {
    name: "t4t-inline-api",
    enforce: "pre",
    configureServer(server) {
      // eslint-disable-next-line no-console
      console.info(
        "[t4t-api] Embedded in Vite dev — `/api/devices` resolves here (`marvin`/IP hostname both OK)",
      );
      attach(server);
    },
    configurePreviewServer(server) {
      // eslint-disable-next-line no-console
      console.info("[t4t-api] Embedded in Vite preview — `/api/*` + static dist/");
      attach(server);
    },
  };
}

/** @param {import('vite').ViteDevServer | import('vite').PreviewServer} server */
function attach(server) {
  server.middlewares.use(async (/** @type {any} */ req, /** @type {any} */ res, next) => {
    const raw = (req.url || "/").split(/[?#]/)[0];
    if (!raw.startsWith("/api")) {
      next();
      return;
    }
    try {
      await dispatchApiRoutes(req, res, { source: "vite-embedded" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "FATAL_API", message: msg }));
      } catch {
        /* ignore double-end */
      }
    }
  });
}
