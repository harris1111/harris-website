---
title: "Designing a Wireguard Hub-and-Spoke VPN for Datacenter Access"
date: "2025-12-15"
tags: ["wireguard", "networking", "vpn", "security"]
description: "How we designed a Wireguard VPN with 11 peers and subnet routing for secure cross-datacenter access"
published: true
---

# Designing a Wireguard Hub-and-Spoke VPN for Datacenter Access

When you manage infrastructure across cloud and on-premise, secure access is non-negotiable. Developers need to reach internal services. CI runners need to pull from private registries. Monitoring agents need to scrape metrics across locations. All of this traffic must be encrypted, authenticated, and auditable.

We chose Wireguard over OpenVPN for three reasons: simplicity (a single binary, minimal config), performance (kernel-level encryption, sub-millisecond overhead on LAN), and security (modern cryptography, minimal attack surface — ~4,000 lines of code vs. OpenVPN's ~100,000).

This post covers the complete design: topology choice, subnet planning, hub configuration, peer provisioning automation, DNS resolution through the tunnel, and the operational lessons from running it for 6 months with zero downtime.

## Why Hub-and-Spoke Over Mesh

We considered two topologies:

**Full mesh**: Every peer connects to every other peer. N peers = N×(N-1)/2 tunnels. With 11 peers, that's 55 tunnels to manage. Adding a new peer requires reconfiguring all existing peers. Nightmare.

**Hub-and-spoke**: All peers connect to one central hub. The hub routes between subnets. Adding a new peer = one config on the hub, one config on the peer. Everyone else is unaffected.

```
                    ┌────────────────┐
          ┌─────── │   Hub VPN GW   │ ──────┐
          │        │  10.10.0.1     │       │
          │        │  Proxmox VM    │       │
          │        └───────┬────────┘       │
          │                │                │
     ┌────┴───┐      ┌────┴───┐      ┌─────┴──┐
     │Dev Team│      │  GCP   │      │  AWS   │
     │ Peers  │      │ Subnet │      │ Subnet │
     │10.10.3x│      │10.10.1x│      │10.10.2x│
     └────────┘      └────────┘      └────────┘
     5 laptops       GKE cluster     EKS runners
```

Hub-and-spoke has a single point of failure (the hub), but we mitigate this by running the hub on our Proxmox server with automated failover — if the hub VM dies, Proxmox restarts it within 30 seconds.

## Network Design

Careful subnet planning upfront prevents painful renumbering later. We allocated a /16 for the entire VPN and carved it into /24 subnets:

| Subnet | CIDR | Purpose | Peers |
|--------|------|---------|-------|
| Hub | 10.10.0.0/24 | VPN gateway, internal DNS | 1 (hub) |
| GCP | 10.10.1.0/24 | Cloud workloads (GKE) | 1 (GCP gateway) |
| On-prem | 10.10.2.0/24 | Proxmox VMs, K3s cluster | 1 (Proxmox bridge) |
| Dev | 10.10.3.0/24 | Developer laptops | 5 (individual devs) |
| AWS | 10.10.4.0/24 | EKS runners, staging | 1 (AWS gateway) |
| Office | 10.10.5.0/24 | MikroTik office router | 1 (office gateway) |
| Reserved | 10.10.6-255.0/24 | Future expansion | — |

The /16 allocation (10.10.0.0/16) gives us room for 256 subnets. We'll never need that many, but renumbering is painful — over-allocate upfront.

## Hub Configuration

The hub is a minimal VM on Proxmox: 2 vCPU, 2GB RAM, Ubuntu 22.04 with the gateway cloud-init template. Its sole purpose is routing VPN traffic.

```ini
# /etc/wireguard/wg0.conf on the hub
[Interface]
Address = 10.10.0.1/24
ListenPort = 51820
PrivateKey = <hub-private-key>

# Enable IP forwarding and NAT
PostUp = sysctl -w net.ipv4.ip_forward=1
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -A FORWARD -o wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -o wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# --- GCP Gateway ---
[Peer]
PublicKey = <gcp-public-key>
AllowedIPs = 10.10.1.0/24
Endpoint = gcp-gateway.example.com:51820
PersistentKeepalive = 25

# --- Proxmox Bridge ---
[Peer]
PublicKey = <proxmox-public-key>
AllowedIPs = 10.10.2.0/24
Endpoint = 10.10.0.2:51820

# --- Developer: Alice ---
[Peer]
PublicKey = <alice-public-key>
AllowedIPs = 10.10.3.1/32
# No endpoint — Alice is behind NAT, she connects to us

# --- Developer: Bob ---
[Peer]
PublicKey = <bob-public-key>
AllowedIPs = 10.10.3.2/32

# --- AWS Gateway ---
[Peer]
PublicKey = <aws-public-key>
AllowedIPs = 10.10.4.0/24
Endpoint = aws-gateway.example.com:51820
PersistentKeepalive = 25

# --- Office MikroTik ---
[Peer]
PublicKey = <office-public-key>
AllowedIPs = 10.10.5.0/24
Endpoint = office.example.com:51820
PersistentKeepalive = 25
```

**The critical detail**: `AllowedIPs` on the hub includes the **entire subnet** behind each gateway peer, not just the peer's VPN IP. When the hub receives a packet destined for `10.10.1.50` (a GKE pod), it looks up AllowedIPs, finds that `10.10.1.0/24` belongs to the GCP gateway peer, and forwards the packet through that tunnel. This is how subnet routing works in Wireguard — AllowedIPs is both an ACL and a routing table.

For individual developer peers, AllowedIPs is just their single IP (`/32`) because they don't have a subnet behind them.

## Gateway Peer Configuration

Gateway peers (GCP, AWS, office) bridge between the VPN and their local subnet. The GCP gateway, for example:

```ini
# /etc/wireguard/wg0.conf on the GCP gateway
[Interface]
Address = 10.10.1.1/24
PrivateKey = <gcp-private-key>
ListenPort = 51820

# Route traffic for all VPN subnets through the hub
PostUp = ip route add 10.10.0.0/16 via 10.10.0.1 dev wg0
PostDown = ip route del 10.10.0.0/16 via 10.10.0.1 dev wg0

[Peer]
PublicKey = <hub-public-key>
AllowedIPs = 10.10.0.0/16
Endpoint = hub.example.com:51820
PersistentKeepalive = 25
```

The gateway's AllowedIPs is the full `/16` because it needs to reach any VPN subnet through the hub. The `ip route add` ensures that other machines on the GCP subnet (which don't have Wireguard) can reach VPN destinations through this gateway.

## Developer Peer Configuration

Developer peers are the simplest — they just need to reach internal services:

```ini
# alice.conf — generated by our provisioning script
[Interface]
Address = 10.10.3.1/32
PrivateKey = <alice-private-key>
DNS = 10.10.0.1

[Peer]
PublicKey = <hub-public-key>
AllowedIPs = 10.10.0.0/16
Endpoint = hub.example.com:51820
PersistentKeepalive = 25
```

Note `DNS = 10.10.0.1` — this points to our internal DNS resolver on the hub, so developers can use human-readable names like `grafana.internal` and `db.internal` instead of memorizing IP addresses.

## Automated Peer Provisioning

Manually generating keys and configs for 11 peers is tedious and error-prone. We automated it:

```bash
#!/bin/bash
# add-peer.sh — Generate keys, create configs, update hub
set -euo pipefail

PEER_NAME=$1
PEER_IP=$2
PEER_SUBNET=${3:-""}  # Empty for individual peers, CIDR for gateways

PEERS_DIR="/etc/wireguard/peers"
mkdir -p ${PEERS_DIR}

# Generate keypair
wg genkey | tee "${PEERS_DIR}/${PEER_NAME}.key" | wg pubkey > "${PEERS_DIR}/${PEER_NAME}.pub"
chmod 600 "${PEERS_DIR}/${PEER_NAME}.key"

PRIVATE_KEY=$(cat "${PEERS_DIR}/${PEER_NAME}.key")
PUBLIC_KEY=$(cat "${PEERS_DIR}/${PEER_NAME}.pub")
HUB_PUBLIC_KEY=$(cat /etc/wireguard/hub.pub)

# Determine AllowedIPs for hub config
if [ -n "${PEER_SUBNET}" ]; then
  HUB_ALLOWED="${PEER_SUBNET}"
  PEER_ADDRESS="${PEER_IP}/24"
else
  HUB_ALLOWED="${PEER_IP}/32"
  PEER_ADDRESS="${PEER_IP}/32"
fi

# Generate peer config file
cat > "${PEERS_DIR}/${PEER_NAME}.conf" << EOF
[Interface]
Address = ${PEER_ADDRESS}
PrivateKey = ${PRIVATE_KEY}
DNS = 10.10.0.1

[Peer]
PublicKey = ${HUB_PUBLIC_KEY}
AllowedIPs = 10.10.0.0/16
Endpoint = hub.example.com:51820
PersistentKeepalive = 25
EOF

# Add peer to hub (live, no restart needed)
wg set wg0 peer ${PUBLIC_KEY} allowed-ips ${HUB_ALLOWED}

# Persist to hub config file
cat >> /etc/wireguard/wg0.conf << EOF

# --- ${PEER_NAME} ---
[Peer]
PublicKey = ${PUBLIC_KEY}
AllowedIPs = ${HUB_ALLOWED}
EOF

echo "Peer ${PEER_NAME} configured at ${PEER_IP}"
echo "Config file: ${PEERS_DIR}/${PEER_NAME}.conf"
echo "Send this file to the peer via secure channel (NOT email/Slack)"
```

Usage:
```bash
# Add a developer peer
./add-peer.sh dave 10.10.3.6

# Add a gateway peer with subnet routing
./add-peer.sh staging-aws 10.10.4.1 "10.10.4.0/24"
```

The script uses `wg set` to add the peer live — no Wireguard restart needed, no disruption to existing connections.

## DNS Through the VPN

We run a lightweight DNS resolver (dnsmasq) on the hub that serves internal names:

```
# /etc/dnsmasq.d/internal.conf
address=/grafana.internal/10.10.5.10
address=/prometheus.internal/10.10.5.10
address=/argocd.internal/10.10.2.100
address=/db-postgres.internal/10.10.4.20
address=/db-mongo.internal/10.10.4.21
address=/registry.internal/10.10.2.50
```

Developer peers set `DNS = 10.10.0.1` in their Wireguard config, so `ping grafana.internal` just works. No need to maintain /etc/hosts files or remember IPs.

## Results

- **11 peers** connected across 3 geographic locations (Singapore, Tokyo, Ho Chi Minh City)
- **Sub-millisecond overhead** on local network — Wireguard adds virtually nothing to LAN traffic
- **~5ms added latency** for cross-region (SGP→TYO) — indistinguishable from bare-metal latency
- **Zero downtime** in 6 months of operation — not a single tunnel failure
- **Peer provisioning**: 30 minutes (manual) → 2 minutes (scripted)
- **Zero-trust by default**: nothing is reachable without a valid Wireguard peer key

## Lessons Learned

**1. PersistentKeepalive is essential for peers behind NAT.** Without it, the NAT mapping expires after ~2 minutes of inactivity, and the tunnel silently drops. We set 25 seconds on every peer that might be behind NAT (developers, office router, cloud gateways behind cloud NAT). The bandwidth cost is negligible — one 32-byte packet every 25 seconds.

**2. MTU matters more than you think.** Wireguard's default MTU is 1420 (1500 minus 80 bytes of Wireguard overhead). This works for most cases, but we saw packet fragmentation when tunneling through GCP's VPN gateway (which adds its own overhead). Reducing to 1380 solved it. If you see mysterious connectivity issues with large payloads, check MTU first.

**3. DNS through VPN transforms the developer experience.** Before internal DNS, developers had to maintain their own /etc/hosts file or remember IP addresses. After: `ssh deploy@db-postgres.internal` just works. This tiny quality-of-life improvement had the highest positive feedback from the team.

**4. AllowedIPs is both ACL and routing table.** This is the most important concept in Wireguard that isn't immediately obvious. When a packet arrives, Wireguard checks which peer's AllowedIPs contains the source IP (ACL). When sending a packet, it checks which peer's AllowedIPs contains the destination IP (routing). Misunderstanding this causes 90% of Wireguard debugging headaches.

**5. Distribute configs securely.** We made the mistake of sending a peer config file via Slack during initial setup. That config contains a private key — equivalent to a password. Now we use `age` encryption: the config is encrypted with the developer's public key and sent via any channel. Only they can decrypt it.
