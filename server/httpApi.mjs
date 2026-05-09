/**
 * Shared HTTP handlers for /api/* — used by Vite middleware (embedded) and
 * optional standalone `node server/index.mjs`.
 */
import { scanLan } from "./lanScan.mjs";

export function pathnameOnly(reqUrl) {
  const u = reqUrl || "/";
  return u.split(/[?#]/)[0] || "/";
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    ...cors(),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

/** @typedef {{ source?: string; portHint?: number }} ApiCtx */

/**
 * Handle /api/*. Always ends `res`.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {ApiCtx} [ctx]
 */
export async function dispatchApiRoutes(req, res, ctx = {}) {
  const method = req.method || "GET";
  const pathname = pathnameOnly(req.url || "/");

  if (!pathname.startsWith("/api")) {
    json(res, 404, { error: "NOT_API" });
    return;
  }

  if (method === "OPTIONS") {
    res.writeHead(204, cors());
    res.end();
    return;
  }

  if (method !== "GET") {
    json(res, 405, { error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      pid: process.pid,
      source: ctx.source || "unknown",
      portHint: ctx.portHint ?? null,
    });
    return;
  }

  if (pathname === "/api/devices") {
    try {
      const payload = await scanLan();
      json(res, 200, payload);
    } catch (e) {
      json(res, 500, {
        error: "SCAN_FAILED",
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return;
  }

  json(res, 404, { error: "NOT_FOUND" });
}
