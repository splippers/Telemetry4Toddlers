#!/usr/bin/env bash
# Debian/Ubuntu: install snmpd agent with LAN-scoped SNMPv2c read-only community.
# Run with sudo after setting T4T_SNMP_RO_COMMUNITY (and optionally T4T_SNMP_ALLOW_NET).

set -euo pipefail

COMMUNITY="${T4T_SNMP_RO_COMMUNITY:-}"
ALLOW_NET="${T4T_SNMP_ALLOW_NET:-192.168.1.0/24}"

if [[ -z "$COMMUNITY" ]] || [[ "$COMMUNITY" == *"CHANGE"* ]]; then
  echo >&2 "Set T4T_SNMP_RO_COMMUNITY to a secret read-only string, e.g."
  echo >&2 '  sudo T4T_SNMP_RO_COMMUNITY="$(openssl rand -hex 12)" T4T_SNMP_ALLOW_NET=192.168.1.0/24 ./install-snmp-agent-debian.sh'
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo >&2 "This script is for apt-based distros."
  exit 2
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq snmp snmpd

DROPIN_DIR="/etc/snmp/snmpd.conf.d"
mkdir -p "$DROPIN_DIR"
DROPIN="${DROPIN_DIR}/zz-telemetry4-t4t-snmp-ro.conf"

cat >"$DROPIN" <<EOF
# Telemetry4 bootstrap — SNMPv2c read-only scoped to LAN.
# Harden later: SNMPv3 or narrow views; keep community out of git/chat.

agentAddress udp:161
rocommunity $COMMUNITY $ALLOW_NET
EOF

chmod 0640 "$DROPIN"
systemctl enable snmpd
systemctl restart snmpd

echo "SNMP agent up. Test from MARVIN (replace HOST):"
echo "  snmpget -v2c -c \"$COMMUNITY\" HOST 1.3.6.1.2.1.1.5.0"
