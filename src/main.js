import "./style.css";

/** @typedef {"tot"|"toddler"|"tween"|"teen"|"techTitan"} T4TLevel */

const LEVEL_ORDER = /** @type {const} */ ([
  "tot",
  "toddler",
  "tween",
  "teen",
  "techTitan",
]);

const STORAGE_KEY = "t4t-level";

/** @returns {T4TLevel} */
function parseLevel(raw) {
  const s = String(raw || "").trim();
  /** @type {T4TLevel | undefined} */
  const ok = LEVEL_ORDER.find((x) => x === s);
  return ok ?? "toddler";
}

/** @returns {T4TLevel} */
function loadInitialLevel() {
  try {
    const q = new URLSearchParams(window.location.search).get("t4t");
    if (q) return parseLevel(q);
  } catch {
    /* ignore */
  }
  try {
    const h = window.location.hash.replace(/^#/, "");
    if (h.startsWith("t4t=")) return parseLevel(h.slice(4));
  } catch {
    /* ignore */
  }
  try {
    return parseLevel(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "toddler";
  }
}

/** @param {T4TLevel} level */
function persistLevel(level) {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    /* ignore */
  }
}

/**
 * @typedef {{
 *   label: string;
 *   geekHint: string;
 *   docTitle: string;
 *   heroKicker: string;
 *   heroTitle: string;
 *   heroSub: string;
 *   legendLan: string;
 *   legendSnmp: string;
 *   legendSingle?: string;
 *   refreshBtn: string;
 *   pingNone: string;
 *   pingMs: (n: number) => string;
 *   lanBadge: string;
 *   authYes: string;
 *   authNo: string;
 *   meterSnmp: string;
 *   meterPlain: string;
 *   factIp: (ip: string) => string;
 *   factMac: (mac: string) => string;
 *   factPing: (pingLabel: string) => string;
 *   factNeigh: (neighState: string) => string;
 *   factUptime: (up: string) => string;
 *   factDescr: (d: string) => string;
 *   factNoSnmp: string;
 *   statusWaking: string;
 *   statusSweep: string;
 *   statusEmptyIface: string;
 *   statusOk: (count: number, iface: string, scannedAt?: string) => string;
 *   errorTitle: string;
 *   footerWarmLine: string;
 *   footerParts: ({ type: "text"; text: string } | { type: "code"; text: string })[];
 * }} LevelCopy
 */

/**
 * UX + chrome per level — copy + tooling + layout should climb together.
 * @typedef {{
 *   dataSkin: string;
 *   legendPills: 1 | 2;
 *   cardMode: "micro"|"school"|"mix"|"lab"|"hud";
 *   footerMode: "warm"|"code"|"codePlus"|"envGrid";
 *   showProbeHud: boolean;
 *   hudClock: boolean;
 *   rawRowInspect: boolean;
 *   snmpDescrLimit: number;
 *   fetchMetaOnScan: boolean;
 *   errorCheatSheet: "none"|"compact"|"full";
 * }} LevelSkin
 */

/** @type {Record<T4TLevel, LevelSkin>} */
const LEVEL_SKIN = {
  tot: {
    dataSkin: "tot",
    legendPills: 1,
    cardMode: "micro",
    footerMode: "warm",
    showProbeHud: false,
    hudClock: false,
    rawRowInspect: false,
    snmpDescrLimit: 96,
    fetchMetaOnScan: false,
    errorCheatSheet: "none",
  },
  toddler: {
    dataSkin: "toddler",
    legendPills: 2,
    cardMode: "school",
    footerMode: "code",
    showProbeHud: false,
    hudClock: false,
    rawRowInspect: false,
    snmpDescrLimit: 160,
    fetchMetaOnScan: false,
    errorCheatSheet: "full",
  },
  tween: {
    dataSkin: "tween",
    legendPills: 2,
    cardMode: "mix",
    footerMode: "code",
    showProbeHud: false,
    hudClock: false,
    rawRowInspect: false,
    snmpDescrLimit: 160,
    fetchMetaOnScan: false,
    errorCheatSheet: "full",
  },
  teen: {
    dataSkin: "teen",
    legendPills: 2,
    cardMode: "lab",
    footerMode: "codePlus",
    showProbeHud: true,
    hudClock: false,
    rawRowInspect: false,
    snmpDescrLimit: 240,
    fetchMetaOnScan: true,
    errorCheatSheet: "compact",
  },
  techTitan: {
    dataSkin: "tech-titan",
    legendPills: 2,
    cardMode: "hud",
    footerMode: "envGrid",
    showProbeHud: true,
    hudClock: true,
    rawRowInspect: true,
    snmpDescrLimit: 560,
    fetchMetaOnScan: true,
    errorCheatSheet: "full",
  },
};

/** @type {Record<T4TLevel, LevelCopy>} */
const LEVEL_COPY = {
  tot: {
    label: "Tots",
    geekHint: "Soft knobs — pretend there is no jargon.",
    docTitle: "Telemetry4 · Tots",
    heroKicker: "TINY CREW RADAR PATCH v0.2 (REAL LAN PALS)",
    heroTitle: "Telemetry… gentle buttons & sparkles!",
    heroSub:
      "Green hugs mean a friend waved on the wire. Red means fetch a Mentor Tech buddy. SNMP stickers only show when you trusted a grown-up secret.",
    legendLan: "Wire pals = chunky cards from MARVIN’s buddy list",
    legendSnmp: "Secret sparkle = SNMP read password living only on MARVIN (never GitHub)",
    legendSingle:
      "Soft cards from MARVIN’s wire list — sparkles need a local secret (never GitHub).",
    refreshBtn: "Boink the LAN with another happy wave!",
    pingNone: "NO BOOP BACK YET",
    pingMs: (n) => `${n} ms (quick wave!)`,
    lanBadge: "WIRE PAL",
    authYes: "TRUST CUDDLE: SNMP YES",
    authNo: "TRUST CUDDLE: SNMP NOPE",
    meterSnmp: "SUPER-DUPER SNMP RAINBOW STRIP",
    meterPlain: "SIMPLE WAVE BAR (no trust cuddle yet)",
    factIp: (ip) => `HOUSE NUMBER ON THE WIRE: ${ip}`,
    factMac: (mac) => `MAGIC NAMETAG (MAC-ish): ${mac}`,
    factPing: (pingLabel) => `HOW FAST WAS THE HI-FIVE? ${pingLabel}`,
    factNeigh: (neighState) => `BUDDY MOOD: ${neighState}`,
    factUptime: (up) => `UPTIME SNACK LABEL: ${up}`,
    factDescr: (d) => `GREETINGS STICKER: ${String(d)}`,
    factNoSnmp:
      "No bonus stickers yet — tuck a SNMP read hug for this IP in server/auth-devices.json on MARVIN.",
    statusWaking: "Waking cuddly trainee radar…",
    statusSweep: "Sweeping MARVIN’s LAN buddy list + wee pings…",
    statusEmptyIface: "Scanner grumbled — check T4T_LAN_IFACE / ip neigh.",
    statusOk: (count, iface, scannedAt) =>
      `${count} wire friend(s) on ${iface}` + (scannedAt ? ` — peeked at ${scannedAt}` : ""),
    errorTitle: "RADAR WANTED A NAP",
    footerWarmLine:
      "A grown-up wakes the sparkly server on MARVIN — you keep waving at the colours until it answers.",
    footerParts: [],
  },
  toddler: {
    label: "Toddlers",
    geekHint: "Primary trainee tech — giggles first, glossary second.",
    docTitle: "Telemetry4 · Toddlers",
    heroKicker:
      "PRIMARY SCHOOL — TRAINEE TECH CREW BADGE PATCH v0.2 (REAL LAN NEIGHBOURS)",
    heroTitle: "Telemetry… but make it giggly!",
    heroSub:
      "Green cards are happy pings, red cards need a Mentor Tech. Secret-handshake pals show BIG SNMP stickers (if you trust them with a read-only password).",
    legendLan: "LAN neighbours = rainbow cards from MARVIN’s kernel pals list",
    legendSnmp:
      "SECRET HANDSHAKE = SNMP read-string you placed in auth-devices.json",
    refreshBtn: "Press to RE-SCAN the classroom LAN!",
    pingNone: "NO PING ANSWER",
    pingMs: (n) => `${n} ms`,
    lanBadge: "LAN NEIGHBOUR",
    authYes: "SECRET HANDSHAKE: YES",
    authNo: "SECRET HANDSHAKE: NOPE",
    meterSnmp: "SUPER-DUPER SNMP RAINBOW STRIP",
    meterPlain: "SIMPLE FRIENDSHIP SIGNAL (no secret handshake)",
    factIp: (ip) => `HOUSE ADDRESS (IP): ${ip}`,
    factMac: (mac) => `HARDWARE NAMETAG (MAC): ${mac}`,
    factPing: (pingLabel) => `HOW FAST DID IT ANSWER? ${pingLabel}`,
    factNeigh: (neighState) => `NEIGHBOUR MOOD: ${neighState}`,
    factUptime: (up) => `UPTIME STICKER: ${up}`,
    factDescr: (d) => `SYS DESCR (tiny): ${String(d)}`,
    factNoSnmp:
      "NO SUPER STATS — add server/auth-devices.json with SNMP read string for this IP.",
    statusWaking: "Waking up trainee radar…",
    statusSweep: "Sweeping MARVIN’s LAN neighbour table + gentle pings…",
    statusEmptyIface: "Scanner grumbled — check T4T_LAN_IFACE / ip neigh.",
    statusOk: (count, iface, scannedAt) =>
      `${count} pal(s) on ${iface}` + (scannedAt ? ` — scan tick at ${scannedAt}` : ""),
    errorTitle: "OOPSIE DAISY RADAR OFFLINE",
    footerWarmLine: "",
    footerParts: [
      { type: "text", text: "Run " },
      { type: "code", text: "npm run dev" },
      {
        type: "text",
        text: " on MARVIN — Vite serves /api inside the same Node process (no old :8788 sidecar). Copy ",
      },
      { type: "code", text: "server/auth-devices.example.json" },
      { type: "text", text: " → " },
      { type: "code", text: "server/auth-devices.json" },
      { type: "text", text: " for SNMP pals." },
    ],
  },
  tween: {
    label: "Tweens",
    geekHint: "Meme-energy microcopy meets real pings & SNMP.",
    docTitle: "Telemetry4 · Tweens",
    heroKicker: "MIDDLE SCHOOL DIGITAL SCOUT SQUAD v0.2 (LIVE KERNEL DATA)",
    heroTitle: "Telemetry… optimised for hallway flex.",
    heroSub:
      "Latency bars = ICMP reality. SNMP unlocks nerd stickers when MARVIN knows a harmless read-only string. Mentor tags along for reds.",
    legendLan: "LAN squad = MARVIN’s IPv4 neighbour cache, colourised",
    legendSnmp: "SNMPv2c RO string in auth-devices.json (local only, not in git)",
    refreshBtn: "RE-SCAN the LAN squad (no cap)",
    pingNone: "NO RTT (host ghosted the ping)",
    pingMs: (n) => `Ping RTT: ${n} ms`,
    lanBadge: "LAN BUDDY",
    authYes: "SNMP RO: LOCKED IN",
    authNo: "SNMP RO: NOT YET",
    meterSnmp: "RTT + SNMP SYSPROPS COMBO METER",
    meterPlain: "ICMP-ONLY VIBE BAR",
    factIp: (ip) => `IPv4: ${ip}`,
    factMac: (mac) => `MAC: ${mac}`,
    factPing: (pingLabel) => `Latency check: ${pingLabel}`,
    factNeigh: (neighState) => `Neighbour state: ${neighState}`,
    factUptime: (up) => `sysUpTime: ${up}`,
    factDescr: (d) => `sysDescr (trimmed): ${String(d)}`,
    factNoSnmp:
      "SNMP stats idle — add this IP + community to server/auth-devices.json if you want the bonus fields.",
    statusWaking: "Booting scout overlay…",
    statusSweep: "Reading ip neigh + firing capped ICMP burst…",
    statusEmptyIface: "Scan failed — verify T4T_LAN_IFACE or ip neigh output.",
    statusOk: (count, iface, scannedAt) =>
      `${count} LAN host(s) · ${iface}` + (scannedAt ? ` · scanned ${scannedAt}` : ""),
    errorTitle: "SCOUT API IS DOING A VANISHING ACT",
    footerWarmLine: "",
    footerParts: [
      { type: "text", text: "Run " },
      { type: "code", text: "npm run dev" },
      {
        type: "text",
        text: " on MARVIN (UI + scout share the Vite port). Copy ",
      },
      { type: "code", text: "server/auth-devices.example.json" },
      { type: "text", text: " → " },
      { type: "code", text: "server/auth-devices.json" },
      { type: "text", text: " for SNMP hosts." },
    ],
  },
  teen: {
    label: "Teens",
    geekHint: "Straight talk + enough RFC flavour to matter.",
    docTitle: "Telemetry4 · Teens",
    heroKicker: "NETOPS LAB PRACTICE CONSOLE v0.2 (KERNEL + ICMP + SNMP)",
    heroTitle: "Telemetry with the training wheels loosened.",
    heroSub:
      "Green/amber/red encode reachability and RTT. Authenticated hosts surface SNMP sysName/sysUpTime/sysDescr when you configure read-only credentials locally.",
    legendLan: "Cards = IPv4 neighbours from linux `ip neigh` + ping samples",
    legendSnmp: "SNMPv2c read community in auth-devices.json (never commit secrets)",
    refreshBtn: "Refresh neighbour table + ping sweep",
    pingNone: "ICMP unreachable / no RTT",
    pingMs: (n) => `ICMP RTT ${n} ms`,
    lanBadge: "L3 NEIGHBOUR",
    authYes: "SNMP AUTH OK (RO)",
    authNo: "SNMP NOT CONFIGURED",
    meterSnmp: "ROUND-TRIP + SNMP SYS OBJECTS",
    meterPlain: "ICMP RTT ONLY",
    factIp: (ip) => `IPv4 address: ${ip}`,
    factMac: (mac) => `MAC (L2): ${mac}`,
    factPing: (pingLabel) => `ICMP echo: ${pingLabel}`,
    factNeigh: (neighState) => `Neighbour discovery state: ${neighState}`,
    factUptime: (up) => `SNMP sysUpTime: ${up}`,
    factDescr: (d) => `SNMP sysDescr: ${String(d)}`,
    factNoSnmp:
      "SNMP disabled for this host — add read-only credentials in server/auth-devices.json to poll sys* OIDs.",
    statusWaking: "Initialising scanner…",
    statusSweep: "Gathering neighbour cache + ICMP RTT…",
    statusEmptyIface: "Scan error — confirm T4T_LAN_IFACE and routing.",
    statusOk: (count, iface, scannedAt) =>
      `${count} host(s), interface ${iface}` + (scannedAt ? ` — completed ${scannedAt}` : ""),
    errorTitle: "BACKEND SCANNER UNAVAILABLE",
    footerWarmLine: "",
    footerParts: [
      { type: "text", text: "Start stack: " },
      { type: "code", text: "npm run dev" },
      {
        type: "text",
        text: " (Vite + API). SNMP file: ",
      },
      { type: "code", text: "server/auth-devices.json" },
      { type: "text", text: " (from example template)." },
    ],
  },
  techTitan: {
    label: "TechTitans",
    geekHint: "Full SNMP/ICMP/neighbour-table vocabulary — mentor mode.",
    docTitle: "Telemetry4 · TechTitans",
    heroKicker: "T4T · TELEMETRY4 MULTI-AUDIENCE SHARD — PROBE CONSOLE v0.2",
    heroTitle: "Neighbour cache, ICMP RTT, optional SNMPv2c GETs.",
    heroSub:
      "Data plane: `ip -4 neigh show`, concurrent `ping -c1`, optional authenticated SNMPv2c sysName/sysUpTime/sysDescr. Tier colours derive from RTT + NUD state + auth.",
    legendLan: "Rows materialise from kernel ARP/ND-style neighbour entries + ping",
    legendSnmp: "SNMP RO community / auth-devices.json — treat like production secrets",
    refreshBtn: "Re-run neighbour discovery + latency probes",
    pingNone: "ICMP timeout (no RTT sample)",
    pingMs: (n) => `RTT ${n} ms (ICMP echo-reply)`,
    lanBadge: "IPv4 NEIGHBOUR",
    authYes: "SNMPv2c RO — AUTHENTICATED",
    authNo: "SNMPv2c — UNAUTHENTICATED",
    meterSnmp: "SIGNAL: RTT + SNMP SYS TELEMETRY",
    meterPlain: "SIGNAL: ICMP RTT ONLY (NO SNMP)",
    factIp: (ip) => `Destination IPv4: ${ip}`,
    factMac: (mac) => `Link-layer address: ${mac}`,
    factPing: (pingLabel) => `ICMP RTT summary: ${pingLabel}`,
    factNeigh: (neighState) => `Kernel neighbour unsolicited NA / NUD: ${neighState}`,
    factUptime: (up) => `SNMP mib-2 system.sysUpTime.0 → ${up}`,
    factDescr: (d) => `SNMP mib-2 system.sysDescr.0 → ${String(d)}`,
    factNoSnmp:
      "No SNMP session — whitelist IP + RO string in auth-devices.json (or T4T_AUTH_DEVICES) for sys* probes.",
    statusWaking: "Waiting for LAN scout handshake…",
    statusSweep:
      "Querying netdev neighbour hashes + ICMP echo + asynchronous SNMP GETs…",
    statusEmptyIface: "SCAN_FAILED — inspect T4T_LAN_IFACE, sysctl, or cap_net_raw.",
    statusOk: (count, iface, scannedAt) =>
      `${count} neighbour row(s); dev=${iface}` + (scannedAt ? `; ts=${scannedAt}` : ""),
    errorTitle: "API / GATEWAY OFFLINE OR UNREACHABLE",
    footerWarmLine:
      "Ops note: snmp secrets stay in auth JSON or `T4T_AUTH_DEVICES`; never upstream to git.",
    footerParts: [
      { type: "text", text: "Orchestration: " },
      { type: "code", text: "npm run dev" },
      {
        type: "text",
        text: " · JSON override: env ",
      },
      { type: "code", text: "T4T_AUTH_DEVICES" },
      { type: "text", text: " · file " },
      { type: "code", text: "server/auth-devices.json" },
      { type: "text", text: "." },
    ],
  },
};

/** @returns {HTMLElement} */
function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const k of kids) {
    node.append(k);
  }
  return node;
}

/** @returns {"good"|"ok"|"help"} */
function deriveTier(ms, neighState, authed) {
  const alive = neighState === "REACHABLE" || neighState === "STALE" || authed;
  if (!alive && ms == null) return "help";
  if (ms == null) return "ok";
  if (ms < 35) return "good";
  if (ms < 160) return "ok";
  return "help";
}

function signalPctFromPing(ms) {
  if (ms == null) return 15;
  return Math.round(Math.max(10, Math.min(100, 118 - ms * 0.55)));
}

/** @returns {"lime-fill"|"sun-fill"|"panic-fill"} */
function signalFillClass(tier) {
  if (tier === "good") return "lime-fill";
  if (tier === "ok") return "sun-fill";
  return "panic-fill";
}

/** @returns {HTMLElement} */
function barFill(pct, fillClass) {
  const fill = el("div", { className: `bar-fill ${fillClass}`, style: { width: "0%" } });
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    });
  });
  return fill;
}

/** @param {"good"|"ok"|"help"} tier */
function totVibeLine(tier) {
  if (tier === "good") return "🌟 Big happy wave!";
  if (tier === "ok") return "👋 Little wave — okay for now!";
  return "🆘 Shout for a Mentor Tech helper!";
}

/**
 * @param {Record<string, unknown>[]} rows
 * @returns {{ good: number; ok: number; help: number }}
 */
function countTiers(rows) {
  let good = 0;
  let ok = 0;
  let help = 0;
  for (const d of rows) {
    const pingMs =
      typeof d.pingMs === "number"
        ? d.pingMs
        : d.pingMs == null
          ? null
          : Number(d.pingMs);
    const authed = Boolean(d.authed);
    const neighState = String(d.neighState || "UNKNOWN");
    const tier =
      d.tier === "good" || d.tier === "ok" || d.tier === "help"
        ? d.tier
        : deriveTier(pingMs, neighState, authed);
    if (tier === "good") good += 1;
    else if (tier === "ok") ok += 1;
    else help += 1;
  }
  return { good, ok, help };
}

/**
 * @param {unknown[]} devices
 * @param {LevelCopy} copy
 * @param {LevelSkin} skin
 */
function renderLanCards(devices, copy, skin) {
  /** @param {Record<string, unknown>} d */
  function row(d) {
    const pingMs =
      typeof d.pingMs === "number"
        ? d.pingMs
        : d.pingMs == null
          ? null
          : Number(d.pingMs);
    const authed = Boolean(d.authed);
    const neighState = String(d.neighState || "UNKNOWN");
    const tier =
      d.tier === "good" || d.tier === "ok" || d.tier === "help"
        ? d.tier
        : deriveTier(pingMs, neighState, authed);
    const barClass = signalFillClass(tier);
    const signal = signalPctFromPing(pingMs);
    const pingLabel =
      typeof d.pingLabel === "string"
        ? d.pingLabel
        : pingMs == null
          ? copy.pingNone
          : copy.pingMs(pingMs);

    const name = String(d.name || d.ip || "Mystery pal");
    const emoji = String(d.emoji || "🔌");
    const ip = String(d.ip || "");
    const mac = String(d.mac || "UNKNOWN NAMETAG");

    const snmp = d.snmp && typeof d.snmp === "object" ? d.snmp : null;
    const lim = skin.snmpDescrLimit;

    const badgeAuthed = el("span", {
      className: `badge ${authed ? "auth-yes" : "auth-no"}`,
      textContent: authed ? copy.authYes : copy.authNo,
    });

    const kindBadge = el("span", {
      className: "badge lan",
      textContent: copy.lanBadge,
    });

    const meterEl = el("p", {
      className: "meter",
      textContent: authed ? copy.meterSnmp : copy.meterPlain,
    });

    const facts = [
      el("li", { textContent: copy.factIp(ip) }),
      el("li", { textContent: copy.factMac(mac) }),
      el("li", { textContent: copy.factPing(pingLabel) }),
      el("li", { textContent: copy.factNeigh(neighState) }),
    ];

    if (authed && snmp) {
      const up = /** @type {any} */ (snmp).uptimeHuman;
      const descr = /** @type {any} */ (snmp).sysDescr;
      if (up) facts.push(el("li", { textContent: copy.factUptime(String(up)) }));
      if (descr) {
        const full = String(descr);
        const piece = full.slice(0, lim);
        facts.push(
          el("li", {
            textContent: copy.factDescr(piece) + (full.length > lim ? "…" : ""),
          }),
        );
      }
    } else {
      facts.push(el("li", { textContent: copy.factNoSnmp }));
    }

    /** @type {HTMLElement[]} */
    let extras = [];

    if (skin.cardMode === "lab" || skin.cardMode === "hud") {
      extras.push(
        el("div", { className: "card-metrics", role: "group" }, [
          el("span", { className: "metric-k", textContent: "icmp_rtt_ms" }),
          el("span", {
            className: "metric-v",
            textContent: pingMs == null ? "∅" : String(pingMs),
          }),
          el("span", { className: "metric-k", textContent: "nud_state" }),
          el("span", { className: "metric-v", textContent: neighState }),
          el("span", { className: "metric-k", textContent: "tier" }),
          el("span", { className: "metric-v tier-tag", textContent: tier }),
          el("span", { className: "metric-k", textContent: "snmpv2c_ro" }),
          el("span", { className: "metric-v", textContent: authed ? "true" : "false" }),
        ]),
      );
    }

    if (skin.rawRowInspect) {
      const blob = JSON.stringify(d, null, 2);
      const pre = el("pre", { className: "raw-json", textContent: blob });
      const copyBtn = el("button", {
        type: "button",
        className: "btn-ghost",
        textContent: "COPY ROW JSON",
        onclick: () => {
          void navigator.clipboard.writeText(blob);
          copyBtn.textContent = "COPIED";
          window.setTimeout(() => {
            copyBtn.textContent = "COPY ROW JSON";
          }, 1400);
        },
      });
      extras.push(
        el("details", { className: "raw-inspect" }, [
          el("summary", { textContent: "▸ inspect.api_row (opaque JSON)" }),
          copyBtn,
          pre,
        ]),
      );
    }

    let cardKids;

    if (skin.cardMode === "micro") {
      const sparkle = authed && snmp ? "Sparkle stickers: ON ✨" : "Sparkle stickers: napping 💤";
      cardKids = [
        el("div", { className: "card-head card-head--simple" }, [
          el("div", {
            className: "emoji",
            textContent: emoji,
            ariaHidden: true,
          }),
          el("h2", { className: "device-name", textContent: name }),
        ]),
        el("p", { className: "tot-vibe", textContent: totVibeLine(tier) }),
        el("div", { className: "bar-track bar-track--big" }, [barFill(signal, barClass)]),
        el("ul", { className: "facts facts--micro" }, [
          el("li", { textContent: copy.factPing(pingLabel) }),
          el("li", { textContent: sparkle }),
        ]),
        el("p", {
          className: "status-line",
          textContent: String(d.message || ""),
        }),
      ];
    } else {
      const modeClass =
        {
          school: "card--school",
          mix: "card--mix",
          lab: "card--lab",
          hud: "card--hud",
        }[skin.cardMode] || "";
      cardKids = [
        el("div", { className: "card-head" }, [
          el("div", {
            className: "emoji",
            textContent: emoji,
            ariaHidden: true,
          }),
          el("div", {}, [
            el("h2", { className: "device-name", textContent: name }),
            el("div", { className: "badge-row" }, [kindBadge, badgeAuthed]),
          ]),
        ]),
        meterEl,
        el("div", { className: "bar-track" }, [barFill(signal, barClass)]),
        el("ul", { className: "facts" }, facts),
        ...extras,
        el("p", {
          className: "status-line",
          textContent: String(d.message || ""),
        }),
      ];
      const article = el(
        "article",
        { className: `card ${tier} ${authed ? "auth" : "simple"} ${modeClass}`.trim() },
        cardKids,
      );
      return article;
    }

    const cardClass = `card ${tier} ${authed ? "auth" : "simple"} card--micro`;

    return el("article", { className: cardClass }, cardKids);
  }

  return el("div", { className: "lan-card-stack" }, devices.map(row));
}

/** @param {{ kicker: HTMLElement; title: HTMLElement; sub: HTMLElement }} refs @param {LevelCopy} copy */
function paintHero(refs, copy) {
  refs.kicker.textContent = copy.heroKicker;
  refs.title.textContent = copy.heroTitle;
  refs.sub.textContent = copy.heroSub;
}

/** @param {HTMLElement} btn @param {LevelCopy} copy */
function paintRefresh(btn, copy) {
  btn.textContent = copy.refreshBtn;
}

/** @returns {{ node: HTMLElement; refs: { kicker: HTMLElement; title: HTMLElement; sub: HTMLElement } }} */
function buildHero() {
  const kicker = el("p", { className: "kicker" });
  const title = el("h1", { className: "title" });
  const sub = el("p", { className: "sub" });
  const node = el(
    "header",
    { className: "banner", role: "banner" },
    [kicker, title, sub],
  );
  return { node, refs: { kicker, title, sub } };
}

/** @param {HTMLElement} root @param {T4TLevel} level */
function applyDomSkin(root, level) {
  const skinKey = LEVEL_SKIN[level].dataSkin;
  root.dataset.t4tLevel = skinKey;
  document.documentElement.dataset.t4tLevel = skinKey;
}

let hudClockId = /** @type {number | null} */ (null);

/** @param {HTMLElement | null} clockEl @param {boolean} enable */
function restartHudClock(clockEl, enable) {
  if (hudClockId != null) {
    window.clearInterval(hudClockId);
    hudClockId = null;
  }
  if (!enable || !clockEl) return;
  const tick = () => {
    clockEl.textContent =
      new Date().toISOString().replace("T", " ").slice(0, 23) + " UTC";
  };
  tick();
  hudClockId = window.setInterval(tick, 1000);
}

function buildProbeHud() {
  /** @param {string} k @param {HTMLElement} vEl */
  function row(k, vEl, extraClass = "") {
    return el("div", { className: `probe-hud-row ${extraClass}`.trim() }, [
      el("span", { className: "probe-hud-k", textContent: k }),
      vEl,
    ]);
  }
  const iface = el("span", { className: "probe-hud-val", textContent: "—" });
  const rows = el("span", { className: "probe-hud-val", textContent: "—" });
  const ts = el("span", { className: "probe-hud-val probe-hud-val--wrap", textContent: "—" });
  const tiers = el("span", { className: "probe-hud-val", textContent: "—" });
  const fetchMs = el("span", { className: "probe-hud-val", textContent: "—" });
  const clock = el("span", { className: "probe-hud-val probe-hud-val--mono", textContent: "—" });
  const grid = el("div", { className: "probe-hud-grid" }, [
    row("netdev", iface),
    row("rows", rows),
    row("scan_ts", ts),
    row("tiers Δ good/ok/help", tiers),
    row("browser_fetch_ms", fetchMs, "probe-hud-row--fetch"),
    row("wall_clock_utc", clock, "probe-hud-row--clock"),
  ]);
  const aside = el("aside", {
    className: "probe-hud",
    hidden: true,
    ariaLabel: "Scan probe metadata",
  }, [
    el("p", { className: "probe-hud-title", textContent: "PROBE TELEMETRY (UI)" }),
    grid,
  ]);
  return { node: aside, refs: { iface, rows, ts, tiers, fetchMs, clock } };
}

/**
 * @param {ReturnType<typeof buildProbeHud>["refs"]} refs
 * @param {LevelSkin} skin
 * @param {string} iface
 * @param {string | undefined} scannedAt
 * @param {Record<string, unknown>[]} deviceRows
 * @param {number | null} fetchMs
 */
function paintProbeHud(refs, skin, iface, scannedAt, deviceRows, fetchMs) {
  refs.iface.textContent = iface;
  refs.rows.textContent = String(deviceRows.length);
  refs.ts.textContent = scannedAt || "—";
  const c = countTiers(deviceRows);
  refs.tiers.textContent = `${c.good} / ${c.ok} / ${c.help}`;
  refs.fetchMs.textContent =
    skin.fetchMetaOnScan && fetchMs != null ? String(fetchMs) : skin.fetchMetaOnScan ? "—" : "n/a";
  if (!skin.hudClock) {
    refs.clock.textContent = "n/a";
  }
}

function envVarTable() {
  const rows = [
    ["T4T_LAN_IFACE", "Force netdev name for `ip -4 neigh show` when autodetect fails."],
    ["T4T_AUTH_FILE", "Alternate JSON path for per-IP SNMP read credentials."],
    ["T4T_AUTH_DEVICES", "Inline JSON blob overriding the auth file (shell export)."],
    ["T4T_API_HOST", "Sidecar bind address if you split `npm run dev:api` from Vite."],
    ["T4T_API_PORT", "Sidecar TCP port (common default 8788) for split API mode."],
  ];
  const tb = el(
    "tbody",
    {},
    rows.map(([k, v]) =>
      el("tr", {}, [el("th", { scope: "row", textContent: k }), el("td", { textContent: v })]),
    ),
  );
  return el("table", { className: "env-matrix" }, [
    el("caption", { textContent: "T4T environment registry (reference)" }),
    tb,
  ]);
}

/** @param {HTMLElement} pillLan @param {HTMLElement} pillSnmp @param {LevelCopy} copy @param {LevelSkin} skin */
function paintLegend(pillLan, pillSnmp, copy, skin) {
  if (skin.legendPills === 1) {
    pillLan.textContent = copy.legendSingle ?? copy.legendLan;
    pillSnmp.textContent = "";
    pillSnmp.hidden = true;
    pillSnmp.setAttribute("aria-hidden", "true");
  } else {
    pillSnmp.hidden = false;
    pillSnmp.removeAttribute("aria-hidden");
    pillLan.textContent = copy.legendLan;
    pillSnmp.textContent = copy.legendSnmp;
  }
}

/** @param {HTMLElement} foot @param {LevelCopy} copy @param {LevelSkin} skin */
function paintFooter(foot, copy, skin) {
  foot.className = `footer footer--${skin.footerMode}`;
  const codeParts = copy.footerParts.map((p) =>
    p.type === "code" ? el("span", { className: "code", textContent: p.text }) : p.text,
  );

  if (skin.footerMode === "warm") {
    foot.replaceChildren(el("p", { className: "footer-warm", textContent: copy.footerWarmLine }));
    return;
  }

  const kids = [el("p", { className: "footer-code" }, codeParts)];

  if (skin.footerMode === "codePlus") {
    kids.push(
      el("p", { className: "footer-tool footer-tool--curl" }, [
        "HTTP probe · ",
        el("span", { className: "code", textContent: "curl -sS http://127.0.0.1:5173/api/health" }),
        " · ",
        el("span", { className: "code", textContent: "curl -sS http://127.0.0.1:5173/api/devices | head -c 200" }),
      ]),
    );
  }

  if (skin.footerMode === "envGrid") {
    if (copy.footerWarmLine) {
      kids.unshift(
        el("p", { className: "footer-warm footer-warm--tight", textContent: copy.footerWarmLine }),
      );
    }
    kids.push(el("div", { className: "footer-tool-stack" }, [envVarTable()]));
  }

  foot.replaceChildren(...kids);
}

function errorPreTextCompact() {
  return `FAST FIX

  npm install && npm run dev

Then hit the Network URL printed by Vite (not file://).

  curl -sS http://127.0.0.1:5173/api/health
`;
}

/** @param {LevelCopy} copy @param {LevelSkin} skin @param {string} msg */
function renderErrorCard(copy, skin, msg) {
  const sheet =
    skin.errorCheatSheet === "full"
      ? errorPreText()
      : skin.errorCheatSheet === "compact"
        ? errorPreTextCompact()
        : "";

  if (skin.errorCheatSheet === "none") {
    return el("div", { className: "card help card--micro" }, [
      el("h2", { className: "device-name", textContent: copy.errorTitle }),
      el("p", {
        className: "footer-warm",
        textContent: "A mentor needs to start MARVIN’s Telemetry4 dev server — then reload this rainbow page.",
      }),
      el("p", { className: "status-line", textContent: msg }),
    ]);
  }

  return el("div", { className: "card help" }, [
    el("h2", { className: "device-name", textContent: copy.errorTitle }),
    el("pre", {
      className: "code-block",
      textContent: `${msg}

${sheet}`,
    }),
  ]);
}

/** @param {{ select: HTMLSelectElement; hint: HTMLElement }} ui @param {T4TLevel} level */
function paintLevelStrip(ui, level) {
  ui.select.value = level;
  ui.hint.textContent = LEVEL_COPY[level].geekHint;
}

function legendPills() {
  const pillLan = el("span", { className: "pill" });
  const pillSnmp = el("span", { className: "pill warn" });
  return {
    node: el("div", { className: "legend" }, [pillLan, pillSnmp]),
    pillLan,
    pillSnmp,
  };
}

function controls(btn) {
  return el("div", { className: "controls", role: "group", ariaLabel: "LAN controls" }, [
    btn,
  ]);
}

/**
 * @param {T4TLevel} level
 * @param {(l: T4TLevel) => void} onPick
 */
function levelStrip(level, onPick) {
  const sel = /** @type {HTMLSelectElement} */ (
    el("select", { className: "t4t-level", ariaLabel: "Telemetry4 audience vibe" })
  );
  for (const id of LEVEL_ORDER) {
    const opt = el("option", { value: id, textContent: LEVEL_COPY[id].label });
    sel.append(opt);
  }
  sel.value = level;
  sel.addEventListener("change", () => {
    onPick(parseLevel(sel.value));
  });
  sel.id = "t4t-audience";
  const hint = el("p", { className: "geek-hint" });
  paintLevelStrip({ select: sel, hint }, level);
  return {
    node: el("div", { className: "level-strip", role: "group" }, [
      el("label", { htmlFor: "t4t-audience", textContent: "Telemetry4 vibe:" }),
      sel,
      hint,
    ]),
    ui: { select: sel, hint },
  };
}

function paintExtraBarStyles() {
  const sheet = document.createElement("style");
  sheet.textContent = `
.lime-fill { background: linear-gradient(90deg, var(--pink), var(--lime), var(--sky)); }
.sun-fill { background: linear-gradient(90deg, #fff176, var(--sun), #ffa45b); }
.panic-fill { background: repeating-linear-gradient(90deg, #ff3b7f 0%, #ff3b7f 10%, var(--pink) 10%, var(--pink) 20%); }
`;
  document.head.append(sheet);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Retries tame super-slow kernels / flaky Wi-Fi handshake to Vite `/api`. */
async function fetchDevices(maxAttempts = 6) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch("/api/devices", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Scanner said HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.error === "SCAN_FAILED") {
        throw new Error(json.message || "scan failed");
      }
      return json;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxAttempts - 1) {
        await sleep(450 + attempt * 150);
      }
    }
  }
  throw lastErr ?? new Error("Scanner fetch failed");
}

/** Full-width mentor cheat sheet. */
function errorPreText() {
  return `FIX-IT CHEAT SHEET (run on MARVIN in Telemetry4Toddlers/)

  npm install
  npm run dev

✅ Logs you WANT:
  • [t4t-api] Embedded in Vite dev — /api devices resolve here …
  • Vite ➜  Local + Network URLs (whatever port isn’t crossed out — often :5173)

❌ Opens like file:///… or stale build with no server? Fetch("/api/devices") ghosts.

Same-port poke (dev defaults to 5173 — swap if your terminal shows another):

  curl -sS http://127.0.0.1:5173/api/health
  curl -sS http://127.0.0.1:5173/api/devices | head -c 400 ; echo

From another LAN sibling (MARVIN = example IP):

  curl -sS http://192.168.1.2:5173/api/health

Static build rehearsal:

  npm run build && npm run preview    # scout still embedded (~4173 — read Vite footer)

Standalone TCP scout (advanced / systemd, optional duplicate stack):

  npm run dev:api     # listens T4T_API_HOST / T4T_API_PORT (default 8788)
`;
}

async function mount(root) {
  paintExtraBarStyles();
  root.className = "page";

  /** @type {T4TLevel} */
  let level = loadInitialLevel();
  persistLevel(level);
  let copy = LEVEL_COPY[level];
  let skin = LEVEL_SKIN[level];
  document.title = copy.docTitle;
  applyDomSkin(root, level);

  const statusBar = el("p", {
    className: "banner-adj-status",
    textContent: copy.statusWaking,
  });

  const { node: probeHudNode, refs: probeHudRefs } = buildProbeHud();

  const gridWrap = el("section", { className: "grid" });
  gridWrap.append(el("p", { className: "status-line", textContent: "…loading LAN neighbours…" }));

  const refreshBtn = el("button", {
    type: "button",
    className: "sim",
    onclick: () => void refresh(),
  });
  paintRefresh(refreshBtn, copy);

  const { node: heroNode, refs: heroRefs } = buildHero();
  paintHero(heroRefs, copy);

  const { node: legendNode, pillLan, pillSnmp } = legendPills();
  paintLegend(pillLan, pillSnmp, copy, skin);

  const foot = el("footer", { className: "footer" });
  paintFooter(foot, copy, skin);

  probeHudNode.hidden = !skin.showProbeHud;

  function applyLevel(next) {
    level = next;
    copy = LEVEL_COPY[level];
    skin = LEVEL_SKIN[level];
    persistLevel(level);
    document.title = copy.docTitle;
    applyDomSkin(root, level);
    paintHero(heroRefs, copy);
    paintLegend(pillLan, pillSnmp, copy, skin);
    paintRefresh(refreshBtn, copy);
    paintFooter(foot, copy, skin);
    paintLevelStrip(levelStripUi, level);
    probeHudNode.hidden = !skin.showProbeHud;
    restartHudClock(probeHudRefs.clock, skin.hudClock && skin.showProbeHud);
    void refresh();
  }

  const { node: levelNode, ui: levelStripUi } = levelStrip(level, applyLevel);

  restartHudClock(probeHudRefs.clock, skin.hudClock && skin.showProbeHud);

  async function refresh() {
    statusBar.textContent = copy.statusSweep;
    try {
      const t0 = skin.fetchMetaOnScan ? performance.now() : 0;
      const payload = /** @type {any} */ (await fetchDevices());
      const fetchMs = skin.fetchMetaOnScan ? Math.round(performance.now() - t0) : null;
      const iface = typeof payload.iface === "string" ? payload.iface : "?";
      const devices = Array.isArray(payload.devices) ? payload.devices : [];
      const rows = /** @type {Record<string, unknown>[]} */ (devices);

      if (devices.length === 0 && payload.message) {
        gridWrap.replaceChildren(el("pre", { className: "code-block", textContent: payload.message }));
        statusBar.textContent = copy.statusEmptyIface;
        probeHudNode.hidden = true;
        return;
      }

      gridWrap.replaceChildren(renderLanCards(devices, copy, skin));
      statusBar.textContent = copy.statusOk(
        devices.length,
        iface,
        typeof payload.scannedAt === "string" ? payload.scannedAt : undefined,
      );

      if (skin.showProbeHud) {
        probeHudNode.hidden = false;
        paintProbeHud(
          probeHudRefs,
          skin,
          iface,
          typeof payload.scannedAt === "string" ? payload.scannedAt : undefined,
          rows,
          fetchMs,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      gridWrap.replaceChildren(renderErrorCard(copy, skin, msg));
      probeHudNode.hidden = true;
      statusBar.textContent =
        skin.errorCheatSheet === "none"
          ? "No rainbow server yet — mentor runs `npm run dev` on MARVIN, then reload."
          : "No `/api` from this origin — use the Vite Network URL (never file://). See sheet below.";
    }
  }

  root.append(
    heroNode,
    statusBar,
    probeHudNode,
    legendNode,
    levelNode,
    controls(refreshBtn),
    gridWrap,
    foot,
  );

  await refresh();

  document.body.replaceChildren(root);
}

mount(document.getElementById("app")).catch(() => {
  document.getElementById("app").textContent =
    "Something exploded before Comic Sans loaded — Mentor Tech badge required.";
});
