import "./style.css";

/** @typedef {"LAN" | "WLAN"} NicKind */

/** Mock devices — trainee-friendly names; someday these come from real probes/API. */
function baseDevices() {
  return [
    {
      emoji: "🧸",
      name: "Hallway Wi-Fi Wizard",
      kind: /** @type {NicKind} */ ("WLAN"),
      speedAnswerMs: 9,
      lostMessagesPct: 0,
      rainbowSignalPct: 94,
      message: "SUPER GREEN: Your wizard is humming a happy tune!",
      tier: /** @type {"good"|"ok"|"help"} */ ("good"),
    },
    {
      emoji: "🦄",
      name: "Mum's Zoom Rocket",
      kind: /** @type {NicKind} */ ("WLAN"),
      speedAnswerMs: 54,
      lostMessagesPct: 1,
      rainbowSignalPct: 72,
      message: "OKAY ORANGE: A grown-up helper could tighten this up.",
      tier: /** @type {"good"|"ok"|"help"} */ ("ok"),
    },
    {
      emoji: "🦖",
      name: "DAD Number Crunch Cave",
      kind: /** @type {NicKind} */ ("LAN"),
      speedAnswerMs: 4,
      lostMessagesPct: 0,
      rainbowSignalPct: 100,
      message: "WOO: LAN dinosaurs are SPEEDY dinosaurs!",
      tier: /** @type {"good"|"ok"|"help"} */ ("good"),
    },
    {
      emoji: "🎨",
      name: "Classroom Tablets Cart",
      kind: /** @type {NicKind} */ ("WLAN"),
      speedAnswerMs: 220,
      lostMessagesPct: 6,
      rainbowSignalPct: 38,
      message: "RED ALERT TEAM: Gather the Trainee Badge Leader!",
      tier: /** @type {"good"|"ok"|"help"} */ ("help"),
    },
    {
      emoji: "🥤",
      name: "Snack Fridge (yes it has Wi-Fi)",
      kind: /** @type {NicKind} */ ("WLAN"),
      speedAnswerMs: 120,
      lostMessagesPct: 3,
      rainbowSignalPct: 55,
      message: "MEH YELLOW: The fridge is sleepy but still cold.",
      tier: /** @type {"good"|"ok"|"help"} */ ("ok"),
    },
    {
      emoji: "🚌",
      name: "Field Trip Mystery Camera",
      kind: /** @type {NicKind} */ ("WLAN"),
      speedAnswerMs: 980,
      lostMessagesPct: 18,
      rainbowSignalPct: 12,
      message: "ULTRA WOBBLY… maybe it went on vacation without telling us?",
      tier: /** @type {"good"|"ok"|"help"} */ ("help"),
    },
  ];
}

/** @returns { HTMLElement } */
function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const k of kids) {
    node.append(k);
  }
  return node;
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

/** @returns {HTMLElement} */
function signalFillClass(tier) {
  if (tier === "good") return "lime-fill";
  if (tier === "ok") return "sun-fill";
  return "panic-fill";
}

function jitterDevices(devices, seed) {
  const copy = structuredClone(devices);
  let rng = seed;
  const rnd = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  for (const d of copy) {
    const wobble = rnd() * 16 - 8;
    d.speedAnswerMs = Math.max(3, Math.round(d.speedAnswerMs + wobble));
    d.rainbowSignalPct = Math.min(
      100,
      Math.max(0, Math.round(d.rainbowSignalPct + rnd() * 10 - 5)),
    );
    d.lostMessagesPct = Math.min(
      25,
      Math.max(0, +(d.lostMessagesPct + rnd() * 2 - 1).toFixed(1)),
    );
    const happy = rnd();
    if (happy > 0.78) {
      d.tier = "good";
      d.message = "RNG says: sparkly day!";
    }
  }
  return copy;
}

function renderDevices(devices) {
  /** @returns {HTMLElement} */
  function card(device) {
    const speedAnswer = `${device.speedAnswerMs} milliseconds`;
    const lost = `${device.lostMessagesPct}%`;
    const signal = `${device.rainbowSignalPct}%`;
    const barClass = signalFillClass(device.tier);

    return el(
      "article",
      {
        className: `card ${device.tier}`,
      },
      [
        el("div", { className: "card-head" }, [
          el("div", {
            className: "emoji",
            textContent: device.emoji,
            ariaHidden: true,
          }),
          el("div", {}, [
            el("h2", { className: "device-name", textContent: device.name }),
            el("div", { className: "badge-row" }, [
              el("span", { className: `badge ${device.kind === "LAN" ? "lan" : "wlan"}`, textContent: device.kind }),
            ]),
          ]),
        ]),
        el("p", { className: "meter", textContent: "RAINBOW WI-FI / WIRE POWERS LEVEL" }),
        el("div", { className: "bar-track" }, [barFill(device.rainbowSignalPct, barClass)]),
        el(
          "ul",
          { className: "facts" },
          [
            el("li", { textContent: `HOW FAST DID IT ANSWER? ${speedAnswer}` }),
            el("li", { textContent: `LOST MESSAGES: ${lost} (Lower is yum-yum snacks)` }),
            el("li", { textContent: `SIGNAL SCOREBOARD: ${signal}` }),
          ],
        ),
        el("p", {
          className: "status-line",
          textContent: device.message,
        }),
      ],
    );
  }

  return el(
    "div",
    {},
    devices.map(card),
  );
}

function hero() {
  return el(
    "header",
    { className: "banner", role: "banner" },
    [
      el("p", {
        className: "kicker",
        textContent: "PRIMARY SCHOOL — TRAINEE TECH CREW BADGE PATCH v0.1",
      }),
      el("h1", {
        className: "title",
        textContent: "Telemetry… but make it giggly!",
      }),
      el("p", {
        className: "sub",
        textContent:
          "Big colours, chunky words, and Comic Sans so even the teddy bear router smiles. GREEN = cheers, RED = STOP and summon a Mentor Tech.",
      }),
    ],
  );
}

function legend() {
  return el("div", { className: "legend" }, [
    el("span", {
      className: "pill",
      textContent: "LAN pals = RAINBOW BLUE WIRE NAMES",
    }),
    el("span", {
      className: "pill warn",
      textContent: "WLAN pals = LIME GREEN WAVE NAMES",
    }),
    el("span", {
      className: "pill",
      textContent: 'No scary acronyms on the kiddo screen (except „LAN“ „WLAN“ badges)',
    }),
  ]);
}

function controls(onSimulate) {
  const btn = el("button", {
    type: "button",
    className: "sim",
    textContent: "Press for pretend internet weather",
    onclick: () => onSimulate(),
  });
  return el("div", { className: "controls", role: "group", ariaLabel: "Play controls" }, [btn]);
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

function mount(root) {
  paintExtraBarStyles();
  root.className = "page";
  let devices = baseDevices();

  const gridWrap = el("section", {});
  gridWrap.append(renderDevices(devices));

  root.append(
    hero(),
    legend(),
    controls(() => {
      devices = jitterDevices(baseDevices(), Date.now() % 9973);
      gridWrap.replaceChildren(renderDevices(devices));
    }),
    gridWrap,
    el(
      "footer",
      { className: "footer" },
      [
        el("p", {}, [
          "Today is PRACTISE DATA. Tomorrow we plug real sensors and routers. Run ",
          el("span", {
            className: "code",
            textContent: "npm run dev",
          }),
          " to play locally.",
        ]),
      ],
    ),
  );

  document.body.replaceChildren(root);
}

mount(document.getElementById("app"));
