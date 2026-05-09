# Telemetry4Toddlers

**Kid-scale network health:** loud colours, **Comic Sans**, and words a **Primary School Trainee Tech** can shout across the playground.

This repo is the **splashy front-of-house**. Real pings, SNMP, DHCP leases, RSSI dumps, ARP pals, traceroute giggles—the plumbing—can bolt on later. Right now `npm run dev` shows pretend devices so trainees learn the **traffic-light story** without fear.

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

The **pretend internet weather** button lets classes rehearse triage etiquette without blasting real infra.

### Future homework (engineering)

1. Probe workers emitting JSON snapshots (ICMP, jitter, SNMP nuggets, WLAN controller crumbs—secrets live in vaults guardians approve).
2. WebSocket carnival board for wall displays (still Comic Sans).
3. **Mentor Mode** flipping to raw graphs while trainees keep the sparkly view.

## Develop

```bash
npm install
npm run dev      # playful dashboard + hot reload
npm run build    # static artefacts in dist/
npm run preview  # peek the production-ish build
```

## Philosophy

Telemetry is spooky when jargon hides behind glass. Keep the scary words **in prose adults skim**, ship an interface honouring attention spans measured in raisins, and badges stay earned—with glitter.
