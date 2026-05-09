# SNMP everywhere (agents on hosts)

**Pollers** (`snmpwalk`, Node `net-snmp`, Telemetry4) ≠ **agents** (`snmpd` / Windows SNMP service) that answer UDP/161. Badges in T4T need each target (or its router/NAS) to run an **SNMP agent** and a **matching read-only community** in `server/auth-devices.json`.

There is **no** magic “install on all hosts” from one command: run the right steps **per OS** (SSH, RDP, vendor UI apiece).

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

## Linux — Fedora / RHEL / Alma

```bash
sudo dnf install -y net-snmp net-snmp-utils
sudo sed -n '1,80p' /etc/snmp/snmpd.conf      # read vendor defaults
sudo systemctl enable --now snmpd
# add rocommunity scoped to 192.168.1.0/24, restart snmpd
```

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

## Fleet scale

Use **Ansible**/Puppet/etc. to push `snmpd.conf` + firewall; keep secrets in a vault, not GitHub.
