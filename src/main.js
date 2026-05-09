import "./style.css";

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

/** Card UI for LAN rows coming from MARVIN's neighbour table +SNMP. */
function renderLanCards(devices) {
  /** @param {Record<string, unknown>} d Raw row from API */
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
      typeof d.pingLabel === "string" ? d.pingLabel : pingMs == null ? "NO PING ANSWER" : `${pingMs} ms`;

    const name = String(d.name || d.ip || "Mystery pal");
    const emoji = String(d.emoji || "🔌");
    const ip = String(d.ip || "");
    const mac = String(d.mac || "UNKNOWN NAMETAG");

    const badgeAuthed = el("span", {
      className: `badge ${authed ? "auth-yes" : "auth-no"}`,
      textContent: authed ? "SECRET HANDSHAKE: YES" : "SECRET HANDSHAKE: NOPE",
    });

    const kindBadge = el("span", {
      className: "badge lan",
      textContent: "LAN NEIGHBOUR",
    });

    const snmp = d.snmp && typeof d.snmp === "object" ? d.snmp : null;

    const facts = [
      el("li", { textContent: `HOUSE ADDRESS (IP): ${ip}` }),
      el("li", { textContent: `HARDWARE NAMETAG (MAC): ${mac}` }),
      el("li", { textContent: `HOW FAST DID IT ANSWER? ${pingLabel}` }),
      el("li", { textContent: `NEIGHBOUR MOOD: ${neighState}` }),
    ];

    if (authed && snmp) {
      const up = /** @type {any} */ (snmp).uptimeHuman;
      const descr = /** @type {any} */ (snmp).sysDescr;
      if (up) facts.push(el("li", { textContent: `UPTIME STICKER: ${up}` }));
      if (descr) facts.push(el("li", { textContent: `SYS DESCR (tiny): ${String(descr).slice(0, 160)}` }));
    } else {
      facts.push(
        el("li", {
          textContent: "NO SUPER STATS — add server/auth-devices.json with SNMP read string for this IP.",
        }),
      );
    }

    const cardClass = `card ${tier} ${authed ? "auth" : "simple"}`;

    return el(
      "article",
      {
        className: cardClass,
      },
      [
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
        el("p", {
          className: "meter",
          textContent: authed
            ? "SUPER-DUPER SNMP RAINBOW STRIP"
            : "SIMPLE FRIENDSHIP SIGNAL (no secret handshake)",
        }),
        el("div", { className: "bar-track" }, [barFill(signal, barClass)]),
        el("ul", { className: "facts" }, facts),
        el("p", {
          className: "status-line",
          textContent: String(d.message || ""),
        }),
      ],
    );
  }

  return el("div", {}, devices.map(row));
}

function hero() {
  return el(
    "header",
    { className: "banner", role: "banner" },
    [
      el("p", {
        className: "kicker",
        textContent: "PRIMARY SCHOOL — TRAINEE TECH CREW BADGE PATCH v0.2 (REAL LAN NEIGHBOURS)",
      }),
      el("h1", {
        className: "title",
        textContent: "Telemetry… but make it giggly!",
      }),
      el("p", {
        className: "sub",
        textContent:
          "Green cards are happy pings, red cards need a Mentor Tech. Secret-handshake pals show BIG SNMP stickers (if you trust them with a read-only password).",
      }),
    ],
  );
}

function legend() {
  return el("div", { className: "legend" }, [
    el("span", {
      className: "pill",
      textContent: "LAN neighbours = rainbow cards from MARVIN’s kernel pals list",
    }),
    el("span", {
      className: "pill warn",
      textContent: "SECRET HANDSHAKE = SNMP read-string you placed in auth-devices.json",
    }),
  ]);
}

function controls(onRefresh) {
  const btn = el("button", {
    type: "button",
    className: "sim",
    textContent: "Press to RE-SCAN the classroom LAN!",
    onclick: () => onRefresh(),
  });
  return el("div", { className: "controls", role: "group", ariaLabel: "LAN controls" }, [btn]);
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

/** Retries tame the race where Vite opens before tcp/8788 is accepting. */
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

function footerNote() {
  return el(
    "footer",
    { className: "footer" },
    [
      el("p", {}, [
        "Run ",
        el("span", {
          className: "code",
          textContent: "npm run dev",
        }),
        " on MARVIN so the sparkly UI (5173) and the shy LAN scanner API (8788) wake up together. Copy ",
        el("span", { className: "code", textContent: "server/auth-devices.example.json" }),
        " → ",
        el("span", { className: "code", textContent: "server/auth-devices.json" }),
        " for SNMP pals.",
      ]),
    ],
  );
}

async function mount(root) {
  paintExtraBarStyles();
  root.className = "page";

  const statusBar = el("p", {
    className: "banner-adj-status",
    textContent: "Waking up trainee radar…",
  });

  const gridWrap = el("section", { className: "grid" });
  gridWrap.append(el("p", { className: "status-line", textContent: "…loading LAN neighbours…" }));

  async function refresh() {
    statusBar.textContent = "Sweeping MARVIN’s LAN neighbour table + gentle pings…";
    try {
      const payload = /** @type {any} */ (await fetchDevices());
      const iface = typeof payload.iface === "string" ? payload.iface : "?";
      const devices = Array.isArray(payload.devices) ? payload.devices : [];
      if (devices.length === 0 && payload.message) {
        gridWrap.replaceChildren(el("pre", { className: "code-block", textContent: payload.message }));
        statusBar.textContent = "Scanner grumbled — check T4T_LAN_IFACE / ip neigh.";
        return;
      }
      gridWrap.replaceChildren(renderLanCards(devices));
      statusBar.textContent =
        `${devices.length} pal(s) on ${iface}` +
        (payload.scannedAt ? ` — scan tick at ${payload.scannedAt}` : "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      gridWrap.replaceChildren(
        el("div", { className: "card help" }, [
          el("h2", { className: "device-name", textContent: "OOPSIE DAISY RADAR OFFLINE" }),
          el("pre", {
            className: "code-block",
            textContent: `${msg}

FIX-IT CHEAT SHEET (run on MARVIN in Telemetry4Toddlers/)

  npm install
  npm run dev

Must see BOTH logs:
  • [t4t-api] listening on http://0.0.0.0:8788 …
  • Vite ➜  Network:  http://192.168.… :5173/

Only ran Vite/UI? That hides the scout. Use npm run dev (API+UI).

Health check (loopback):

  curl -sS http://127.0.0.1:8788/api/health

Optional direct LAN API (same 192.168.1.x subnet):

  curl -sS http://192.168.1.2:8788/api/health

(Replace 192.168.1.2 with MARVIN’s real IPv4.)

Serving dist/?

  npm run build && npm run preview:live
`,
          }),
        ]),
      );
      statusBar.textContent =
        "Scanner API still hiding — start server/index.mjs on :8788 (listen 0.0.0.0) + npm run dev or preview:live!";
    }
  }

  root.append(
    hero(),
    statusBar,
    legend(),
    controls(() => void refresh()),
    gridWrap,
    footerNote(),
  );

  await refresh();

  document.body.replaceChildren(root);
}

mount(document.getElementById("app")).catch(() => {
  document.getElementById("app").textContent =
    "Something exploded before Comic Sans loaded — Mentor Tech badge required.";
});
