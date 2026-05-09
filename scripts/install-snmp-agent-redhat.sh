#!/usr/bin/env bash
# Fedora/RHEL/Rocky/Alma: net-snmp agent with SNMPv2c read-only community scoped to a subnet.

set -euo pipefail

COMMUNITY="${T4T_SNMP_RO_COMMUNITY:-}"
ALLOW_NET="${T4T_SNMP_ALLOW_NET:-192.168.1.0/24}"

if [[ -z "$COMMUNITY" ]] || [[ "$COMMUNITY" == *"CHANGE"* ]]; then
  echo >&2 "Set T4T_SNMP_RO_COMMUNITY to a secret read-only string, e.g."
  echo >&2 '  sudo T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)" T4T_SNMP_ALLOW_NET=192.168.1.0/24 ./install-snmp-agent-redhat.sh'
  exit 1
fi

if ! command -v dnf >/dev/null 2>&1 && ! command -v yum >/dev/null 2>&1; then
  echo >&2 "This script expects dnf or yum (Fedora/RHEL family)."
  exit 2
fi

PKG=(dnf install -y)
command -v dnf >/dev/null 2>&1 || PKG=(yum install -y)

"${PKG[@]}" net-snmp net-snmp-utils

MARK="# Telemetry4-T4T snmp bootstrap"

mkdir -p /etc/snmp/snmpd.d
DROPIN=""
if [[ -f /etc/snmp/snmpd.conf ]] && grep -qE '[[:space:]]include|^includeDir|.*/snmpd\.d' /etc/snmp/snmpd.conf 2>/dev/null; then
  DROPIN="/etc/snmp/snmpd.d/zz-telemetry4-t4t-snmp-ro.conf"
fi

if [[ -n "$DROPIN" ]]; then
  if grep -Fxq "$MARK" "$DROPIN" 2>/dev/null; then
    :
  else
    printf '%s\n%s\n%s\n\n' "$MARK" "agentAddress udp:161" "rocommunity ${COMMUNITY} ${ALLOW_NET}" >"$DROPIN"
  fi
  chmod 0640 "$DROPIN" 2>/dev/null || true
else
  CONF="/etc/snmp/snmpd.conf"
  touch "$CONF"
  if grep -Fq "$MARK" "$CONF"; then
    :
  else
    {
      printf '\n%s\n' "$MARK"
      printf 'agentAddress udp:161\n'
      printf 'rocommunity %s %s\n' "$COMMUNITY" "$ALLOW_NET"
    } >>"$CONF"
  fi
fi

systemctl enable --now snmpd >/dev/null 2>&1 || true

echo "SNMP agent up (net-snmp). Test from MARVIN (replace HOST):"
echo "  snmpget -v2c -c \"$COMMUNITY\" HOST 1.3.6.1.2.1.1.5.0"
