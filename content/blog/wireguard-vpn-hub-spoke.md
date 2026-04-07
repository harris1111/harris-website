---
title: "Designing a Wireguard Hub-and-Spoke VPN for Datacenter Access"
date: "2025-12-15"
tags: ["wireguard", "networking", "vpn", "security"]
description: "How we designed a Wireguard VPN with 11 peers and subnet routing for secure cross-datacenter access"
published: true
---

# Designing a Wireguard Hub-and-Spoke VPN for Datacenter Access

When you manage infrastructure across cloud and on-premise, secure access is non-negotiable. We chose Wireguard over OpenVPN for its simplicity, performance, and kernel-level encryption.

## Why Hub-and-Spoke

Star topology with a central gateway:
- All peers connect to one hub (our Proxmox gateway VM)
- Hub routes between subnets — peers don't need direct connectivity
- Easy to add/remove peers without reconfiguring everyone

```
                  ┌──────────┐
        ┌─────── │  Hub VPN  │ ──────┐
        │        │ Gateway   │       │
        │        └──────────┘       │
        │             │              │
   ┌────┴───┐   ┌────┴───┐   ┌─────┴──┐
   │Dev Team│   │  GCP   │   │  AWS   │
   │ Peers  │   │ Subnet │   │ Subnet │
   └────────┘   └────────┘   └────────┘
```

## Network Design

| Subnet | CIDR | Purpose |
|--------|------|---------|
| Hub | 10.10.0.0/24 | VPN gateway, DNS |
| GCP | 10.10.1.0/24 | Cloud workloads |
| On-prem | 10.10.2.0/24 | Proxmox VMs |
| Dev | 10.10.3.0/24 | Developer machines |

## Hub Configuration

```ini
[Interface]
Address = 10.10.0.1/24
ListenPort = 51820
PrivateKey = <hub-private-key>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# GCP Gateway
PublicKey = <gcp-public-key>
AllowedIPs = 10.10.1.0/24
Endpoint = gcp-gateway.example.com:51820
PersistentKeepalive = 25
```

The key insight: `AllowedIPs` on the hub includes the **entire subnet** behind each peer, not just the peer's VPN IP. This enables subnet routing.

## Peer Provisioning

We automated peer setup with a bash script:

```bash
#!/bin/bash
PEER_NAME=$1
PEER_IP=$2

# Generate keys
wg genkey | tee "/etc/wireguard/peers/${PEER_NAME}.key" | wg pubkey > "/etc/wireguard/peers/${PEER_NAME}.pub"

# Generate peer config
cat > "/etc/wireguard/peers/${PEER_NAME}.conf" << EOF
[Interface]
Address = ${PEER_IP}/32
PrivateKey = $(cat /etc/wireguard/peers/${PEER_NAME}.key)
DNS = 10.10.0.1

[Peer]
PublicKey = $(cat /etc/wireguard/hub.pub)
AllowedIPs = 10.10.0.0/16
Endpoint = hub.example.com:51820
PersistentKeepalive = 25
EOF
```

## Results

- 11 peers connected across 3 locations
- Sub-millisecond overhead on local network
- ~5ms added latency for cross-region (SGP→TYO)
- Zero downtime in 6 months of operation

## Lessons

1. **PersistentKeepalive is essential** for peers behind NAT. Without it, the tunnel drops after ~2 minutes of inactivity.
2. **MTU matters.** Default 1420 works for most cases. Reduce to 1380 if you see packet fragmentation.
3. **DNS through VPN** — run a DNS resolver on the hub so peers resolve internal hostnames.
