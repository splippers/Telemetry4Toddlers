# SNMP everywhere (agents on hosts)

**Pollers** (`snmpwalk`, Node `net-snmp`, Telemetry4) ≠ **agents** (`snmpd` / Windows SNMP service) that answer UDP/161. Badges in T4T need each target (or its router/NAS) to run an **SNMP agent** and a **matching read-only community** in `server/auth-devices.json`.

For **SSH-accessible Debian/Ubuntu and Fedora/RHEL-family Linux** on your LAN neighbour table, use [`scripts/fleet-install-snmp.sh`](../scripts/fleet-install-snmp.sh). Everything else (no SSH, dumb appliances, Windows) still gets **manual** SNMP enablement per vendor or optional Windows feature steps below — there’s no credential-free push to closed boxes.

## Safety

- Community strings are **cleartext**. Treat them like passwords (LAN-only, rotate if leaked).
- Don’t expose UDP/161 to the public internet.
- Prefer **SNMPv3** on anything serious; T4T uses v2c RO today.

## Linux — Debian / Ubuntu (scripted)

From this repo:

```bash
cd scripts
chmod +x install-snmp-agent-debian.sh
sudo T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)" \
     T4T_SNMP_ALLOW_NET=192.168.1.0/24 \
     ./install-snmp-agent-debian.sh
```

Smoke from MARVIN:

```bash
snmpget -v2c -c 'THE-SAME-STRING' OTHER-HOST_IP 1.3.6.1.2.1.1.5.0
```

## Linux — Fedora / RHEL / Rocky / Alma / CentOS Stream (scripted)

From this repo:

```bash
cd scripts
chmod +x install-snmp-agent-redhat.sh
sudo T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)" \
     T4T_SNMP_ALLOW_NET=192.168.1.0/24 \
     ./install-snmp-agent-redhat.sh
```

Smoke from MARVIN uses the same **`snmpget`** one-liner as Debian. If vendor defaults in `/etc/snmp/snmpd.conf` conflict with **`agentAddress`** or includes, merge them before restarting **`snmpd`**.


## Windows 10 / 11 (manual + optional PowerShell)

SNMP is **legacy/optional** on client SKUs but useful in homelabs.

1. **Settings → Apps → Optional features → View features →** install **Simple Network Management Protocol** (name varies).
2. **Services → SNMP Service:**
   - Traps / community: **READ-ONLY** community.
   - Accepted managers: MARVIN’s IP or subnet.
3. **Firewall:** allow **UDP 161** from **Private network** / MARVIN only.

Elevated PowerShell (names differ by build — if it errors, use the GUI):

```powershell
Get-WindowsOptionalFeature -Online | Where-Object FeatureName -match 'SNMP'
# If you see FeatureName = SNMP (or similar):
Enable-WindowsOptionalFeature -Online -FeatureName SNMP -NoRestart
Restart-Service SNMP -ErrorAction SilentlyContinue
```

**Laptops** often sleep or change Wi-Fi subnets — expect flakier agents than wired infra.

## Appliances (routers, switches, NAS)

Use each vendor’s **SNMP agent** page:

- Enable agent, set **read-only** community, bind/trust **192.168.1.0/24** (or MARVIN only).
- Many **consumer routers omit SNMP** entirely; pro gear or OpenWrt often has it.

## Fleet scale — neighbour scan + SSH push (MARVIN)

[`scripts/fleet-install-snmp.sh`](../scripts/fleet-install-snmp.sh) gathers **IPv4 neighbour IPs** on the **default-route interface** (`ip -4 neigh show dev …`, aligned with [`server/lanScan.mjs`](../server/lanScan.mjs)), skips **this MARVIN’s own addresses**, then for each reachable host (**ping**) with **SSH key auth + `sudo -n`** (**BatchMode**) copies `install-snmp-agent-debian.sh` / `install-snmp-agent-redhat.sh`, runs **`apt-get` / `dnf|yum`**, and scopes **`rocommunity`** to **`T4T_SNMP_ALLOW_NET`** (optional — otherwise infers **`x.y.z.0/24`** from the first sorted neighbour IP unless **`T4T_FLEET_STRICT_ALLOW_NET=1`**).

```bash
cd /path/to/Telemetry4Toddlers/scripts
chmod +x fleet-install-snmp.sh install-snmp-agent-*.sh

export T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)"
export T4T_SNMP_ALLOW_NET=192.168.1.0/24   # safest: explicit
export T4T_LAN_IFACE=enp2s0                # if default route guess is wrong
export T4T_SSH_USER=jon                    # key must work fleet-wide (+ NOPASSWD sudo)

T4T_FLEET_DRY_RUN=1 bash fleet-install-snmp.sh
sudo -E bash fleet-install-snmp.sh                     # Debian-family + Fedora/RHEL family only

T4T_FLEET_SKIP_PING=1 sudo -E bash fleet-install-snmp.sh   # SSH-first (sleeping Wi-Fi NICs)

T4T_FLEET_SKIP_ALREADY=1 sudo -E bash fleet-install-snmp.sh   # needs snmp/snmp-get on MARVIN: skip if snmpget answers

T4T_FLEET_EXTRA_IPS="192.168.33.42" sudo -E bash fleet-install-snmp.sh   # IPs not in neigh cache

T4T_FLEET_INCLUDE_LOCAL=1 sudo -E bash fleet-install-snmp.sh   # also install agent on MARVIN
```

Still **skipped automatically:** gateways without shell access, desktops without SSH users, routers/NAS consoles, printers, televisions, tablets, phones, **Windows** — those stay **manual**. Copy the **`T4T_SNMP_RO_COMMUNITY`** you chose into **`server/auth-devices.json`** (ignored by Git) so T4T can poll badges.

Beyond homelab scale — move the same installers into **Ansible** / Puppet with a vault rather than looping SSH.

### Fleet scale — configuration management / vault

For production estate sizes, reuse the same SNMP stanza semantics but distribute via **Ansible**/Puppet; keep secrets in **HashiCorp Vault**, **SOPS**, or equivalent — never plaintext in GitHub.
