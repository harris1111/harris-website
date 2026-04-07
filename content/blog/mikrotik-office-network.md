---
title: "Office Network with MikroTik and Enterprise APs"
date: "2025-04-08"
tags: ["networking", "mikrotik", "wifi", "infrastructure"]
description: "Configuring MikroTik RB3011 with dual-WAN failover and 5 Aruba APs for 60+ users"
published: true
---

# Office Network with MikroTik and Enterprise APs

Most DevOps engineers don't touch office networking. But when you're the only infra person at a startup, you become the network admin too.

## Requirements

- 60+ users (developers, designers, marketing)
- Dual ISP for redundancy
- Separate VLANs for corporate, guest, and IoT
- Enterprise WiFi (no consumer routers)
- VPN back to datacenter

## Hardware

- **Router:** MikroTik RB3011UiAS-RM (10 Gigabit ports, RouterOS)
- **APs:** 5x Aruba Instant On AP22 (WiFi 6, cloud-managed)
- **Switch:** TP-Link TL-SG3428 (managed, VLAN-capable)

## Dual-WAN Failover

Two ISPs connected to the MikroTik:

```routeros
# WAN1: Primary (fiber, 500Mbps)
/ip address add address=x.x.x.x/30 interface=ether1

# WAN2: Backup (4G LTE, 50Mbps)
/ip address add address=y.y.y.y/30 interface=ether2

# Recursive routing for failover detection
/ip route
add dst-address=0.0.0.0/0 gateway=wan1-gw distance=1 check-gateway=ping
add dst-address=0.0.0.0/0 gateway=wan2-gw distance=2 check-gateway=ping

# Ping targets for gateway checking
/ip route
add dst-address=8.8.8.8/32 gateway=wan1-gw scope=10
add dst-address=8.8.4.4/32 gateway=wan2-gw scope=10
```

When WAN1 goes down, MikroTik detects the failed ping and switches to WAN2 in ~10 seconds. When WAN1 recovers, traffic returns automatically.

## VLAN Setup

| VLAN | ID | Subnet | Purpose |
|------|-----|--------|---------|
| Corporate | 10 | 192.168.10.0/24 | Staff devices, VPN access |
| Guest | 20 | 192.168.20.0/24 | Visitors, rate-limited |
| IoT | 30 | 192.168.30.0/24 | Printers, cameras |
| Management | 99 | 192.168.99.0/24 | Network devices |

```routeros
/interface vlan
add name=vlan10-corp interface=bridge vlan-id=10
add name=vlan20-guest interface=bridge vlan-id=20
add name=vlan30-iot interface=bridge vlan-id=30

# Firewall: guest cannot reach corporate
/ip firewall filter
add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 action=drop
add chain=forward src-address=192.168.20.0/24 dst-address=192.168.30.0/24 action=drop
```

## Aruba AP Configuration

Cloud-managed via Aruba Instant On portal:

- **SSID "Company":** VLAN 10, WPA3-Enterprise (RADIUS), 802.11ax
- **SSID "Guest":** VLAN 20, WPA2-Personal, captive portal, 10Mbps limit
- **Band steering:** Prefer 5GHz, fall back to 2.4GHz for IoT

5 APs cover 400m² office across 2 floors. Channel planning:
- Floor 1: Channels 36, 48, 149 (non-overlapping 5GHz)
- Floor 2: Channels 40, 52

## Bandwidth Management

Rate limiting for guest and IoT VLANs:

```routeros
# Guest: 10Mbps per user
/queue simple
add name=guest-limit target=192.168.20.0/24 max-limit=10M/10M

# IoT: 5Mbps total
/queue simple
add name=iot-limit target=192.168.30.0/24 max-limit=5M/5M
```

## VPN to Datacenter

MikroTik Wireguard tunnel to our Proxmox VPN hub:

```routeros
/interface wireguard
add name=wg-datacenter listen-port=51820 private-key="..."

/interface wireguard peers
add public-key="..." endpoint-address=hub.example.com endpoint-port=51820 \
    allowed-address=10.10.0.0/16 persistent-keepalive=25
```

Developers on the corporate VLAN can reach internal services without a client VPN.

## Lessons

1. **MikroTik is incredibly powerful for the price.** RB3011 costs ~$200 and handles everything a $2,000 Cisco router does.
2. **VLAN everything.** Guest devices have no business seeing your production VPN traffic.
3. **Cloud-managed APs save time.** Aruba Instant On is set-and-forget. Firmware updates happen automatically at 3 AM.
4. **Test failover regularly.** We discovered our backup ISP had a DNS issue only after the primary went down for real.
