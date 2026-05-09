# Telemetry4Toddlers

**Kid-scale network health:** loud colours, **Comic Sans**, and words a **Primary School Trainee Tech** can shout across the playground.

This repo ships a **really-for-real-but-still-cartoony MARVIN-facing dashboard**: the UI reads **`/api/devices`**, powered by MARVIN’s Linux **IPv4 neighbour table** (`ip neigh`) plus **ICMP ping** probes. Optionally add **SNMPv2 read-only credentials** only for IPs you deliberately trust—the UI shows **EXTRA SPY GLASSES** badges for hosts that authenticate.

## Who is this for?

- **Junior digital leaders** practising “everything on the LAN/WLAN talks to each other”.
- Adults who secretly want dashboards that smell like crayons **and still teach useful ideas**.

## The vibe (experience spec — rough)

### Visual language

- **Font**: `Comic Sans MS` (with friendly fallbacks) — non-negotiable silly-serious readability.
- **Palette**: chunky primaries — hot pink, lime citrus, lemonade yellow, electric aqua, lavender grape.
- **Layout**: postcard-sized tiles with **thick ink outlines**, double drop-shadows, and slight rotation so nothing feels corporate.
- **LAN vs WLAN badges**: RAINBOW-blue border for tethered dinosaurs (LAN); lime-wave badge for airborne unicorns (WLAN).

### Concepts → kid microcopy

Adults see columns in Grafana; kiddos see cartoon meters:

| Grown-up term | Trainee wording |
| --- | --- |
| ICMP RTT | **HOW FAST DID IT ANSWER?** |
| Packet loss % | **LOST MESSAGES** (lower is more snack happiness) |
| RSSI-ish score | **RAINBOW WI-FI / WIRE POWERS LEVEL** |

### Behaviour hints

| Tier | Feeling | Typical story |
| --- | --- | --- |
| Green | teddy-bear hugs | Celebrate with confetti punctuation |
| Amber | “meh yoghurt” | Maybe tighten antennas or ask a mentor |
| Red | sirens-but-safe | Escalate to a Mentor Tech badge holder |

The **BIG RE-SCAN** button politely re-queries the LAN (still Comic Sans fireworks).

### Future homework (engineering)

1. Extend probes (SNMP walks beyond `sys*` OIDs, interface counters, jitter, WPA controller APIs—after grown-up risk review).
2. WebSocket carnival board for wall displays (still Comic Sans).
3. **Mentor Mode** flipping to raw graphs while trainees keep the sparkly view.

## LAN scout + trainee privacy notes

### What MARVIN does today

The API (`server/lanScan.mjs`) gathers:

- IPs + MAC addresses + neighbour state from **`ip -4 neigh show dev <iface>`**
- ICMP RTT (**`ping -c 1 -W 1`**) with capped concurrency bursts
- Optional reverse DNS PTR via Node’s resolver
- Optional SNMP `sysName` / `sysUpTime` / `sysDescr` for configured hosts via `server/auth-devices.json` (ignored by Git)

SNMP uses read-only credentials you supply (classic “community strings”). **Do not** ship those to GitHub—keep them in **`server/auth-devices.json`** (copy from **`server/auth-devices.example.json`**) or export **`T4T_AUTH_DEVICES`** JSON before launching the dev stack.

**SNMP agents on fleet:** T4T polls only when a host answers UDP/161 — install **`snmpd`/`net-snmp` (Linux)** or the Windows SNMP feature per box. Playbook: **[`docs/SNMP_EVERYWHERE.md`](docs/SNMP_EVERYWHERE.md)** · single host: Debian **[`scripts/install-snmp-agent-debian.sh`](scripts/install-snmp-agent-debian.sh)**, RHEL-ish **[`scripts/install-snmp-agent-redhat.sh`](scripts/install-snmp-agent-redhat.sh)** · MARVIN push over SSH to detected LAN neighbours (apt/dnf hosts only): **`scripts/fleet-install-snmp.sh`**.

| Env | Meaning |
| --- | --- |
| **`T4T_LAN_IFACE`** | NIC name (`enp2s0`, …) if MARVIN can’t infer the default route |
| **`T4T_AUTH_FILE`** | Alternate JSON path describing SNMP secrets |
| **`T4T_AUTH_DEVICES`** | Inline JSON overriding the secrets file |
| **`T4T_API_HOST`** | **Standalone** `npm run dev:api` only — bind address (default **`0.0.0.0`**, or **`127.0.0.1`** to lock LAN out). |
| **`T4T_API_PORT`** | **Standalone** scout TCP port (default **8788**). **Ignored** while using `npm run dev` / `vite preview` — those embed `/api`. |

**Embedded mode (default):** `npm run dev` and `npm run preview` run a Vite plugin (`server/vitePluginApi.mjs`) that answers **`GET /api/*` in-process**, so DAD can load **`http://marvin:5173/`** and `fetch("/api/devices")` succeeds with **no proxy** and **no second terminal**.

**Standalone mode (optional):** `node server/index.mjs` (see **`npm run dev:api`**) still exposes **`http://<MARVIN-LAN-IP>:8788/api/...`** when you want systemd / split processes.

### Preview / static notes

**`npm run build && npm run preview`** now keeps the LAN scout **embedded** in the preview server as well (typically **port 4173** — read the terminal footer). **`preview:live`** is an alias identical to **`preview`**.

## Develop

```bash
npm install
npm run dev            # Vite :5173 + embedded /api
npm run dev:api        # optional: standalone TCP scout (T4T_API_PORT / T4T_API_HOST)
npm run build          # dist/
npm run preview        # dist/ + embedded /api (port from terminal, often 4173)
npm run preview:live   # same as preview (kept for muscle memory)
```

**Vite host check:** the UI allows **`Host: marvin`** (and **`localhost`**). Add more names with comma-separated **`VITE_ALLOWED_HOSTS`** (e.g. `export VITE_ALLOWED_HOSTS=marvin,mybox` before `npm run dev`).

## Philosophy

Telemetry is spooky when jargon hides behind glass. Keep the scary words **in prose adults skim**, ship an interface honouring attention spans measured in raisins, and badges stay earned—with glitter.
