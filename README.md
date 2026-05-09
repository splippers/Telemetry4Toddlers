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

| Env | Meaning |
| --- | --- |
| **`T4T_LAN_IFACE`** | NIC name (`enp2s0`, …) if MARVIN can’t infer the default route |
| **`T4T_AUTH_FILE`** | Alternate JSON path describing SNMP secrets |
| **`T4T_AUTH_DEVICES`** | Inline JSON overriding the secrets file |
| **`T4T_API_PORT`** | API binds **`127.0.0.1:$PORT`** (default **8788**) |

The API stays localhost-only while **Vite proxies `/api/*`** during `npm run dev`, so DAD/other LAN browsers talk to **`http://<MARVIN-IP>:5173`** normally.

### Production-ish preview caveat

**`npm run preview`** serves static **`dist/`** only—`/api` is missing unless you launch the LAN scout separately.

Use **`npm run preview:live`** for one command that runs **`vite preview` + `server/index.mjs`** (same **`127.0.0.1:8788`** API + Vite **`/api` proxy)**.

## Develop

```bash
npm install
npm run dev        # Vite (0.0.0.0:5173) + LAN API (127.0.0.1:8788) via concurrently
npm run dev:ui     # UI only (mock /api errors unless you also run dev:api)
npm run dev:api    # API only
npm run build      # static artefacts in dist/
npm run preview         # UI only from dist/
npm run preview:live    # UI + LAN API together (recommended for demos)
```

## Philosophy

Telemetry is spooky when jargon hides behind glass. Keep the scary words **in prose adults skim**, ship an interface honouring attention spans measured in raisins, and badges stay earned—with glitter.
