import dns from "node:dns/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OIDS = {
  sysName: "1.3.6.1.2.1.1.5.0",
  sysUpTime: "1.3.6.1.2.1.1.3.0",
  sysDescr: "1.3.6.1.2.1.1.1.0",
};

function parseDefaultIface(text) {
  const m = text.match(/\bdefault via \S+ dev (\S+)/m);
  return m ? m[1] : "";
}

async function defaultRouteDev() {
  try {
    const { stdout } = await execFileAsync("ip", ["route", "show", "default"], {
      maxBuffer: 1024 * 1024,
    });
    return parseDefaultIface(stdout);
  } catch {
    return "";
  }
}

function parseNeighStdout(stdout) {
  const byIp = new Map();
  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    const ip = parts[0];
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) continue;

    const li = parts.indexOf("lladdr");
    const mac =
      li !== -1 && parts[li + 1]
        ? String(parts[li + 1]).replace(/-/g, ":").toUpperCase()
        : "";

    const state = parts[parts.length - 1] || "UNKNOWN";

    byIp.set(ip, { ip, mac, state });
  }
  return [...byIp.values()];
}

async function neighTable(iface) {
  const { stdout } = await execFileAsync("ip", ["-4", "neigh", "show", "dev", iface], {
    maxBuffer: 1024 * 1024,
  });
  return parseNeighStdout(stdout);
}

async function pingRttMs(ip) {
  try {
    const { stdout } = await execFileAsync(
      "ping",
      ["-c", "1", "-W", "1", ip],
      { maxBuffer: 64 * 1024 },
    );
    const m = stdout.match(/time=([0-9.]+)\s*ms/i);
    if (m) return Number(m[1]);
  } catch {
    return null;
  }
  return null;
}

async function reverseName(ip) {
  try {
    const names = await dns.reverse(ip);
    return names[0] ?? "";
  } catch {
    return "";
  }
}

async function loadAuthEntries() {
  const env = process.env.T4T_AUTH_DEVICES?.trim();
  if (env) {
    try {
      return JSON.parse(env);
    } catch {
      return [];
    }
  }
  const file = process.env.T4T_AUTH_FILE || path.join(__dirname, "auth-devices.json");
  if (!existsSync(file)) return [];
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function authForIp(authList, ip) {
  return authList.find((e) => e && e.ip === ip) ?? null;
}

async function snmpFetch(ip, community) {
  const snmp = (await import("net-snmp")).default;
  const oids = [OIDS.sysName, OIDS.sysUpTime, OIDS.sysDescr];
  return new Promise((resolve) => {
    const session = snmp.createSession(ip, community, {
      port: 161,
      retries: 0,
      timeout: 1200,
      version: snmp.Version2c,
    });
    session.get(oids, (err, varbinds) => {
      session.close();
      if (err || !varbinds || varbinds.length < 3) {
        resolve(null);
        return;
      }
      const read = (v) => {
        if (snmp.isVarbindError(v)) return "";
        if (v.type === snmp.ObjectType.OctetString) return v.value.toString();
        if (v.type === snmp.ObjectType.TimeTicks) return String(Math.round(Number(v.value) / 100));
        return String(v.value);
      };
      resolve({
        sysName: read(varbinds[0]),
        sysUpTimeCentis: read(varbinds[1]),
        sysDescr: read(varbinds[2]).slice(0, 480),
      });
    });
  });
}

function formatUptime(centisStr) {
  const c = Number(centisStr);
  if (!Number.isFinite(c)) return "";
  const sec = c / 100;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function tierFromPing(ms) {
  if (ms == null) return "help";
  if (ms < 35) return "good";
  if (ms < 160) return "ok";
  return "help";
}

function pickEmoji(seed) {
  const pool = ["🔌", "🖥️", "📡", "🍄", "🐸", "🎈", "🧃", "🎮", "🛴", "🪀"];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i;
      i += 1;
      out[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

/**
 * @returns {Promise<object[]>}
 */
export async function scanLan() {
  const iface = process.env.T4T_LAN_IFACE || (await defaultRouteDev());
  if (!iface) {
    return {
      devices: [],
      scannedAt: new Date().toISOString(),
      message:
        "NO_DEFAULT_ROUTE_IFACE — set export T4T_LAN_IFACE=enp2s0 (or your NIC) before launching the API.",
    };
  }

  const neigh = await neighTable(iface);
  const authList = await loadAuthEntries();

  const hydrated = await mapWithConcurrency(neigh, 12, async (row) => {
    const [rttMs, hostname, snmp] = await Promise.all([
      pingRttMs(row.ip),
      reverseName(row.ip),
      (async () => {
        const entry = authForIp(authList, row.ip);
        if (!entry?.snmp?.community) return null;
        return snmpFetch(row.ip, entry.snmp.community);
      })(),
    ]);

    const authed = Boolean(snmp && snmp.sysName);
    const pingLabel = rttMs == null ? "NO ANSWER (ping)" : `${rttMs.toFixed(rttMs < 10 ? 2 : 1)} ms`;

    /** @type {"good"|"ok"|"help"} */
    const tier =
      snmp && snmp.sysName
        ? tierFromPing(rttMs)
        : row.state === "REACHABLE" || row.state === "STALE"
          ? tierFromPing(rttMs)
          : "help";

    const displayName =
      snmp?.sysName ||
      hostname ||
      (row.mac ? `Mystery pal @ ${row.mac.slice(0, 8)}…` : `Mystery pal @ ${row.ip}`);

    const message = authed
      ? `BADGE LEVEL: SUPER SPY WE CAN SAY HELLO (${snmp?.sysName || "SNMP"})`
      : row.state === "REACHABLE"
        ? "We see them on the wire but no secret handshake yet."
        : row.state === "STALE"
          ? "Stale neighbour — poke with ping to wake."
          : "Neighbour fuzzy — Mentor Tech might need a look-see.";

    return {
      id: row.mac || row.ip,
      ip: row.ip,
      mac: row.mac,
      iface,
      neighState: row.state,
      pingMs: rttMs,
      pingLabel,
      hostname,
      authed,
      snmp: authed && snmp
        ? {
            sysName: snmp.sysName,
            sysDescr: snmp.sysDescr.slice(0, 280),
            uptimeHuman: formatUptime(snmp.sysUpTimeCentis),
          }
        : null,
      emoji: pickEmoji(`${row.mac}|${row.ip}`),
      name: displayName,
      tier,
      message,
    };
  });

  hydrated.sort((a, b) => {
    if (a.authed !== b.authed) return a.authed ? -1 : 1;
    return a.ip.localeCompare(b.ip, undefined, { numeric: true });
  });

  return {
    iface,
    scannedAt: new Date().toISOString(),
    devices: hydrated,
  };
}
