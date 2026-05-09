import http from "node:http";
import { scanLan } from "./lanScan.mjs";

const API_PORT = Number(process.env.T4T_API_PORT || 8788);

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, pid: process.pid, port: API_PORT });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/devices") {
    try {
      const payload = await scanLan();
      sendJson(res, 200, payload);
    } catch (e) {
      sendJson(res, 500, {
        error: "SCAN_FAILED",
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return;
  }

  sendJson(res, 404, { error: "NOT_FOUND" });
});

server.listen(API_PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.error(`[t4t-api] listening on http://127.0.0.1:${API_PORT}`);
});
