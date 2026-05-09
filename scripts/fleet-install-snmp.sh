#!/usr/bin/env bash
# From MARVIN (or any poller box): detect IPv4 neighbours on the default-route NIC,
# probe ping + SSH BatchMode, then install snmpd net-snmp on Debian or Red Hat targets.
#
# Prerequisites on targets:
#   - SSH key auth to T4T_SSH_USER works (same user everywhere or use ssh_config Match).
#   - Passwordless sudo: sudo -n (NOPASSWD) for apt/dnf/package install paths.
#
# Env:
#   T4T_SNMP_RO_COMMUNITY   (required) — same RO community written on every touched host (lab default).
#   T4T_SNMP_ALLOW_NET      subnet for rocommunity (default: /24 inferred from neighbour IP — see below).
#   T4T_LAN_IFACE           NIC for ip neigh (default: default-route dev).
#   T4T_SSH_USER            SSH login (default: current user).
#   T4T_FLEET_DRY_RUN=1      print plan only — no SSH.
#   T4T_FLEET_SKIP_PING=1   do not require ping before SSH.
#   T4T_FLEET_STRICT_ALLOW_NET=1 — do not infer ALLOW_NET from first neighbour; require explicit T4T_SNMP_ALLOW_NET.
#   T4T_FLEET_EXTRA_IPS       space-separated extra IPs (outside neigh table).
#   T4T_FLEET_SKIP_ALREADY=1 skip hosts that already answer SNMP for T4T_SNMP_RO_COMMUNITY.
#   T4T_FLEET_INCLUDE_LOCAL=1 also configure this MARVIN host (runs local installer with sudo).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEB_INSTALL="$SCRIPT_DIR/install-snmp-agent-debian.sh"
RHEL_INSTALL="$SCRIPT_DIR/install-snmp-agent-redhat.sh"

COMMUNITY="${T4T_SNMP_RO_COMMUNITY:-}"
ALLOW_NET="${T4T_SNMP_ALLOW_NET:-}"
SSH_USER="${T4T_SSH_USER:-${USER:-root}}"
DRY="${T4T_FLEET_DRY_RUN:-0}"
SKIP_PING="${T4T_FLEET_SKIP_PING:-0}"
STRICT_ALLOW="${T4T_FLEET_STRICT_ALLOW_NET:-0}"
EXTRA="${T4T_FLEET_EXTRA_IPS:-}"
SKIP_ALREADY="${T4T_FLEET_SKIP_ALREADY:-0}"
INCLUDE_LOCAL="${T4T_FLEET_INCLUDE_LOCAL:-0}"

if [[ -z "$COMMUNITY" ]] || [[ "$COMMUNITY" == *"CHANGE"* ]]; then
  echo >&2 "Set T4T_SNMP_RO_COMMUNITY on MARVIN, e.g."
  echo >&2 '  export T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)"'
  echo >&2 "  sudo -E bash $SCRIPT_DIR/fleet-install-snmp.sh"
  exit 1
fi

if [[ ! -f "$DEB_INSTALL" || ! -f "$RHEL_INSTALL" ]]; then
  echo >&2 "Missing installer scripts beside fleet-install-snmp.sh"
  exit 2
fi

default_iface() {
  ip route show default 2>/dev/null | sed -n 's/.*default via .* dev \([^ ]*\).*/\1/p' | head -n1 || true
}

IFACE="${T4T_LAN_IFACE:-}"
if [[ -z "$IFACE" ]]; then
  IFACE="$(default_iface)"
fi
if [[ -z "$IFACE" ]]; then
  echo >&2 "No default-route interface — set T4T_LAN_IFACE."
  exit 3
fi

neigh_ips() {
  ip -4 neigh show dev "$IFACE" 2>/dev/null | while read -r line; do
    [[ -z "$line" ]] && continue
    read -r ip _ <<<"$line"
    [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "$ip"
  done
}

local_addrs() {
  ip -4 -o addr show scope global "$IFACE" 2>/dev/null | awk '{print $4}' | sed 's|/.*||'
  hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.' || true
}

infer_allow_net_from_ip() {
  local ip="$1"
  printf '%s\n' "${ip%.*}.0/24"
}

infer_allow_net_bulk() {
  local first=""
  local ip
  while read -r ip; do
    [[ -z "$first" ]] && first="$ip"
  done
  if [[ -n "$first" ]]; then
    infer_allow_net_from_ip "$first"
  else
    echo "192.168.1.0/24"
  fi
}

collect_targets() {
  local -A seen=()
  local ip
  for ip in $EXTRA; do
    [[ -z "$ip" ]] && continue
    seen["$ip"]=1
  done
  while read -r ip; do
    seen["$ip"]=1
  done < <(neigh_ips | sort -u -t. -k1,1n -k2,2n -k3,3n -k4,4n)

  for ip in "${!seen[@]}"; do
    echo "$ip"
  done | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n
}

is_local() {
  local ip="$1" a
  while read -r a; do
    [[ "$ip" == "$a" ]] && return 0
  done < <(local_addrs | sort -u)
  return 1
}

ALLOW_NET_FINAL="$ALLOW_NET"
if [[ -z "$ALLOW_NET_FINAL" ]]; then
  if [[ "$STRICT_ALLOW" == "1" ]]; then
    echo >&2 "Set T4T_SNMP_ALLOW_NET or omit T4T_FLEET_STRICT_ALLOW_NET to infer /24."
    exit 4
  fi
  ALLOW_NET_FINAL="$(collect_targets | head -n1 | infer_allow_net_bulk)"
fi

targets=()
while read -r ip; do
  is_local "$ip" && continue
  targets+=("$ip")
done < <(collect_targets)

SSH_BASE=(ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new)
SCP_BASE=(scp -q -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new)

echo "iface=$IFACE allow_net=$ALLOW_NET_FINAL ssh_user=$SSH_USER targets=${#targets[@]} dry_run=$DRY skip_already=$SKIP_ALREADY"
if [[ "${#targets[@]}" -eq 0 && "$INCLUDE_LOCAL" != "1" ]]; then
  echo "No neighbour IPs — set T4T_FLEET_EXTRA_IPS / T4T_LAN_IFACE or T4T_FLEET_INCLUDE_LOCAL=1 for this box."
  exit 0
fi

do_ping() {
  local ip="$1"
  ping -c 1 -W 2 "$ip" >/dev/null 2>&1
}

probe_os_family() {
  local ip="$1"
  "${SSH_BASE[@]}" "${SSH_USER}@${ip}" 'test -f /etc/os-release && . /etc/os-release && echo "${ID:-}"' 2>/dev/null | tr '[:upper:]' '[:lower:]' | tr -d '\r' || true
}

snmp_already_live() {
  local ip="$1"
  command -v snmpget >/dev/null 2>&1 || return 1
  snmpget -v2c -c "$COMMUNITY" -t 1 -r 0 "$ip" iso.3.6.1.2.1.1.5.0 >/dev/null 2>&1
}

install_local_marvin() {
  echo "--- MARVIN (local) ---"
  if [[ "$DRY" == "1" ]]; then
    echo "[local] dry-run — would sudo run Debian/RHEL snmp installer matching this OS"
    return 0
  fi
  if [[ ! -r /etc/os-release ]]; then
    echo "[local] skip — no /etc/os-release"
    return 0
  fi
  # shellcheck source=/dev/null
  . /etc/os-release
  local lid
  lid=$(printf '%s' "${ID:-unknown}" | tr '[:upper:]' '[:lower:]')
  case ",$lid," in
    *,debian,*|*,ubuntu,*|*,raspbian,*|*,linuxmint,*|*,pop,*)
      sudo -n T4T_SNMP_RO_COMMUNITY="$COMMUNITY" T4T_SNMP_ALLOW_NET="$ALLOW_NET_FINAL" bash "$DEB_INSTALL" && echo "[local] OK debian snmpd" || echo "[local] FAIL debian (sudo -n apt path?)"
      ;;
    *,fedora,*|*,rhel,*|*,centos,*|*,rocky,*|*,almalinux,*|*,ol,*)
      sudo -n T4T_SNMP_RO_COMMUNITY="$COMMUNITY" T4T_SNMP_ALLOW_NET="$ALLOW_NET_FINAL" bash "$RHEL_INSTALL" && echo "[local] OK net-snmp" || echo "[local] FAIL redhat"
      ;;
    *)
      echo "[local] skip — OS id '$lid' (see docs/SNMP_EVERYWHERE.md)"
      ;;
  esac
}

install_debian_via_ssh() {
  local ip="$1"
  "${SCP_BASE[@]}" "$DEB_INSTALL" "${SSH_USER}@${ip}:/tmp/t4t-snmp-debian-install.sh"
  "${SSH_BASE[@]}" "${SSH_USER}@${ip}" bash -s <<REMOTECMD
set -euo pipefail
chmod +x /tmp/t4t-snmp-debian-install.sh
sudo -n T4T_SNMP_RO_COMMUNITY=$(printf '%q' "$COMMUNITY") T4T_SNMP_ALLOW_NET=$(printf '%q' "$ALLOW_NET_FINAL") /tmp/t4t-snmp-debian-install.sh
rm -f /tmp/t4t-snmp-debian-install.sh
REMOTECMD
}

install_redhat_via_ssh() {
  local ip="$1"
  "${SCP_BASE[@]}" "$RHEL_INSTALL" "${SSH_USER}@${ip}:/tmp/t4t-snmp-redhat-install.sh"
  "${SSH_BASE[@]}" "${SSH_USER}@${ip}" bash -s <<REMOTECMD
set -euo pipefail
chmod +x /tmp/t4t-snmp-redhat-install.sh
sudo -n T4T_SNMP_RO_COMMUNITY=$(printf '%q' "$COMMUNITY") T4T_SNMP_ALLOW_NET=$(printf '%q' "$ALLOW_NET_FINAL") /tmp/t4t-snmp-redhat-install.sh
rm -f /tmp/t4t-snmp-redhat-install.sh
REMOTECMD
}

process_ip() {
  local ip="$1"
  echo "--- $ip ---"
  if [[ "$SKIP_ALREADY" == "1" ]] && snmp_already_live "$ip"; then
    echo "[$ip] skip — already answers SNMPv2 with this community"
    return 0
  fi
  if [[ "$SKIP_PING" != "1" ]] && ! do_ping "$ip"; then
    echo "[$ip] skip — no ping (T4T_FLEET_SKIP_PING=1 to override)"
    return 0
  fi
  if ! "${SSH_BASE[@]}" -o ConnectTimeout=4 "${SSH_USER}@${ip}" true 2>/dev/null; then
    echo "[$ip] skip — SSH BatchMode unreachable for user $SSH_USER"
    return 0
  fi

  local id
  id="$(probe_os_family "$ip")"
  if [[ -z "$id" ]]; then
    echo "[$ip] skip — could not read OS ID"
    return 0
  fi

  case ",$id," in
    *,debian,*|*,ubuntu,*|*,raspbian,*|*,linuxmint,*|*,pop,*)
      echo "[$ip] Debian-family ($id)"
      if [[ "$DRY" == "1" ]]; then
        echo "    [dry-run] would scp debian installer + sudo run"
        return 0
      fi
      install_debian_via_ssh "$ip" && echo "[$ip] OK debian snmpd" || echo "[$ip] FAIL debian"
      ;;
    *,fedora,*|*,rhel,*|*,centos,*|*,rocky,*|*,almalinux,*|*,ol,*)
      echo "[$ip] Red Hat-family ($id)"
      if [[ "$DRY" == "1" ]]; then
        echo "    [dry-run] would scp redhat installer + sudo run"
        return 0
      fi
      install_redhat_via_ssh "$ip" && echo "[$ip] OK net-snmp" || echo "[$ip] FAIL redhat"
      ;;
    *)
      echo "[$ip] skip — OS id '$id' not automated (router/Windows/appliance — use SNMP_EVERYWHERE.md)"
      ;;
  esac
}

if [[ "$DRY" == "1" ]]; then
  echo "[dry-run] would process remotely: ${targets[*]}"
fi

[[ "$INCLUDE_LOCAL" == "1" ]] && install_local_marvin

for ip in "${targets[@]}"; do
  process_ip "$ip" || true
done

echo "Done. Add matching IPs + community to server/auth-devices.json on MARVIN for T4T badges."
