---
title: "Office Network with MikroTik and Enterprise APs"
date: "2025-04-08"
tags: ["networking", "mikrotik", "wifi", "infrastructure"]
description: "Configuring MikroTik RB3011 with dual-WAN failover and 5 Aruba APs for 60+ users"
published: true
---

# Office Network with MikroTik and Enterprise APs

Most DevOps engineers don't touch office networking. But when you're the only infrastructure person at a startup, "not my job" isn't an option. The office had grown from 15 to 60+ people, the consumer-grade TP-Link router was dropping connections during all-hands meetings, and the CEO's video calls kept freezing during investor demos. Something had to change.

This post covers designing and deploying a proper office network from scratch: MikroTik router with dual-WAN failover, VLAN segmentation for security, enterprise WiFi 6 access points, bandwidth management, and a site-to-site VPN back to our datacenter. Total hardware cost: ~$1,500. Enterprise-grade performance that would cost 5-10x with Cisco or Meraki.

## Requirements Gathering

Before buying any hardware, I spent a week understanding the actual needs:

- **60+ users**: developers (40), designers (8), marketing (6), management (6), visitors (~5 daily)
- **Dual ISP**: Primary fiber (500Mbps down/100Mbps up) + backup 4G LTE (50Mbps). The primary ISP had two outages in the previous month. Redundancy was non-negotiable after a 4-hour outage killed a client demo.
- **Network segmentation**: Corporate devices and guest devices must be isolated. Printers and cameras should be on their own network. Marketing's social media tracking pixels shouldn't see developer VPN traffic.
- **Enterprise WiFi**: Coverage across 400m² on 2 floors, supporting 60+ simultaneous clients without the "everyone's on WiFi and it's slow" problem that plagues consumer routers.
- **VPN to datacenter**: Developers on the corporate network should access internal services (Grafana, ArgoCD, staging environments) without running a VPN client on their laptop.
- **Budget**: Under $2,000 total. The company wasn't going to approve Cisco pricing for an office of 60.

## Hardware Selection

| Device | Model | Qty | Unit Cost | Purpose |
|--------|-------|-----|-----------|---------|
| Router | MikroTik RB3011UiAS-RM | 1 | ~$200 | Routing, firewall, VPN, DHCP |
| APs | Aruba Instant On AP22 | 5 | ~$130 | WiFi 6 (802.11ax), cloud-managed |
| Switch | TP-Link TL-SG3428 | 1 | ~$200 | 24-port managed, VLAN-capable |
| Patch panel | Generic CAT6 24-port | 1 | ~$40 | Cable management |
| **Total** | | | **~$1,290** | |

**Why MikroTik?** The RB3011 has 10 Gigabit Ethernet ports, a dual-core ARM CPU, 1GB RAM, and runs RouterOS — a full-featured network operating system with firewall, VPN, DHCP, DNS, QoS, and VLAN support. It does everything a $2,000 Cisco ISR does, for $200. The trade-off: RouterOS has a steeper learning curve than Cisco IOS, and the web UI (WebFig) is functional but ugly. We use the CLI exclusively.

**Why Aruba Instant On?** Enterprise-grade WiFi 6 with cloud management at consumer prices. The AP22 supports 802.11ax (WiFi 6), MU-MIMO, band steering, and manages itself via Aruba's cloud portal. Firmware updates happen automatically at 3 AM. Zero ongoing management overhead — critical when there's no dedicated network admin.

## Network Design

### VLAN Architecture

Four VLANs, each with its own subnet, DHCP pool, and firewall policy:

| VLAN | ID | Subnet | DHCP Range | Purpose | Internet | Inter-VLAN |
|------|-----|--------|-----------|---------|----------|------------|
| Corporate | 10 | 192.168.10.0/24 | .100-.250 | Staff devices, VPN access | Full speed | Can reach Management |
| Guest | 20 | 192.168.20.0/24 | .100-.250 | Visitors, contractors | 10Mbps cap | Isolated |
| IoT | 30 | 192.168.30.0/24 | .100-.200 | Printers, cameras, TVs | 5Mbps cap | Isolated |
| Management | 99 | 192.168.99.0/24 | .10-.50 | Router, switch, APs | None | Only from Corporate |

**Key security decisions:**
- Guest VLAN cannot reach Corporate or IoT — visitors can't access internal resources or scan printers
- IoT VLAN cannot reach Corporate — a compromised smart TV can't pivot to developer workstations
- Management VLAN is only accessible from Corporate — network devices can't be reconfigured from Guest or IoT
- Only Corporate VLAN has VPN access to the datacenter

### Physical Layout

```
                     ISP Fiber ──┐    ┌── ISP 4G LTE
                                 │    │
                          ┌──────┴────┴──────┐
                          │  MikroTik RB3011  │
                          │  ether1: WAN1     │
                          │  ether2: WAN2     │
                          │  ether3-10: LAN   │
                          └────────┬──────────┘
                                   │ Trunk (all VLANs tagged)
                          ┌────────┴──────────┐
                          │  TP-Link TL-SG3428 │
                          │  Managed Switch     │
                          └──┬──┬──┬──┬──┬────┘
                             │  │  │  │  │
                      ┌──────┘  │  │  │  └──────┐
                      │         │  │  │         │
                   AP-1F-A   AP-1F-B  AP-1F-C  AP-2F-A  AP-2F-B
                   (VLAN 10,20 tagged on each AP trunk port)
```

Switch port configuration:
- **Ports 1-5**: Trunk ports to APs (VLAN 10, 20, 30 tagged)
- **Ports 6-20**: Access ports for wired devices (VLAN 10 untagged — corporate)
- **Port 21**: Trunk to MikroTik (all VLANs tagged)
- **Ports 22-23**: Printers (VLAN 30 untagged)
- **Port 24**: Management (VLAN 99 untagged)

## MikroTik Configuration

### Dual-WAN Failover

Two ISPs connected to the MikroTik. WAN1 is the primary (fiber, 500Mbps). WAN2 is the backup (4G LTE, 50Mbps). When WAN1 goes down, traffic automatically fails over to WAN2. When WAN1 recovers, traffic returns.

The trick is **recursive routing with ping-based gateway detection**:

```routeros
# WAN1: Primary fiber
/ip address add address=203.0.113.2/30 interface=ether1 comment="WAN1-Fiber"

# WAN2: Backup 4G LTE
/ip address add address=198.51.100.2/30 interface=ether2 comment="WAN2-LTE"

# NAT for both WANs
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade comment="NAT-WAN1"
add chain=srcnat out-interface=ether2 action=masquerade comment="NAT-WAN2"

# Recursive routing — the key to reliable failover
# Step 1: Define check targets reachable only through each WAN
/ip route
add dst-address=8.8.8.8/32 gateway=203.0.113.1 scope=10 comment="WAN1-check-target"
add dst-address=8.8.4.4/32 gateway=198.51.100.1 scope=10 comment="WAN2-check-target"

# Step 2: Default routes that depend on check target reachability
/ip route
add dst-address=0.0.0.0/0 gateway=8.8.8.8 distance=1 check-gateway=ping \
    comment="Default-via-WAN1"
add dst-address=0.0.0.0/0 gateway=8.8.4.4 distance=2 check-gateway=ping \
    comment="Default-via-WAN2"
```

**How it works**: MikroTik pings 8.8.8.8 through WAN1. If the ping succeeds, the default route via WAN1 (distance=1, lower is preferred) stays active. If the ping fails (WAN1 is down), MikroTik marks that route as unreachable and falls over to WAN2 (distance=2). When WAN1 recovers and pings succeed again, traffic returns to WAN1 automatically.

Failover time: ~10 seconds (3 missed pings × default 3-second interval). For the 4G backup, 10 seconds of failover is acceptable — users notice a brief pause, then connectivity resumes.

### VLAN Configuration

```routeros
# Create bridge for LAN ports
/interface bridge add name=bridge-lan

# Add LAN ports to bridge
/interface bridge port
add bridge=bridge-lan interface=ether3
add bridge=bridge-lan interface=ether4
# ... ether5 through ether10

# Create VLANs on the bridge
/interface vlan
add name=vlan10-corp interface=bridge-lan vlan-id=10
add name=vlan20-guest interface=bridge-lan vlan-id=20
add name=vlan30-iot interface=bridge-lan vlan-id=30
add name=vlan99-mgmt interface=bridge-lan vlan-id=99

# IP addresses for each VLAN (MikroTik is the gateway)
/ip address
add address=192.168.10.1/24 interface=vlan10-corp comment="Corporate-GW"
add address=192.168.20.1/24 interface=vlan20-guest comment="Guest-GW"
add address=192.168.30.1/24 interface=vlan30-iot comment="IoT-GW"
add address=192.168.99.1/24 interface=vlan99-mgmt comment="Management-GW"

# DHCP servers per VLAN
/ip pool
add name=pool-corp ranges=192.168.10.100-192.168.10.250
add name=pool-guest ranges=192.168.20.100-192.168.20.250
add name=pool-iot ranges=192.168.30.100-192.168.30.200

/ip dhcp-server
add name=dhcp-corp interface=vlan10-corp address-pool=pool-corp lease-time=12h
add name=dhcp-guest interface=vlan20-guest address-pool=pool-guest lease-time=2h
add name=dhcp-iot interface=vlan30-iot address-pool=pool-iot lease-time=24h

/ip dhcp-server network
add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1
add address=192.168.20.0/24 gateway=192.168.20.1 dns-server=1.1.1.1,8.8.8.8
add address=192.168.30.0/24 gateway=192.168.30.1 dns-server=192.168.30.1
```

**Note the DNS difference**: Corporate VLAN uses the MikroTik as DNS server (it resolves internal names via the datacenter VPN). Guest VLAN uses public DNS directly — guests don't need internal resolution, and we don't want their DNS queries touching our resolver.

### Firewall: Inter-VLAN Isolation

The most critical firewall rules — without these, VLANs are just subnets, not security boundaries:

```routeros
/ip firewall filter

# --- Default policies ---
add chain=forward action=accept connection-state=established,related \
    comment="Allow established connections"
add chain=forward action=drop connection-state=invalid \
    comment="Drop invalid connections"

# --- Guest isolation (VLAN 20 can ONLY reach internet) ---
add chain=forward action=drop src-address=192.168.20.0/24 \
    dst-address=192.168.10.0/24 comment="Guest cannot reach Corporate"
add chain=forward action=drop src-address=192.168.20.0/24 \
    dst-address=192.168.30.0/24 comment="Guest cannot reach IoT"
add chain=forward action=drop src-address=192.168.20.0/24 \
    dst-address=192.168.99.0/24 comment="Guest cannot reach Management"
add chain=forward action=drop src-address=192.168.20.0/24 \
    dst-address=192.168.0.0/16 comment="Guest cannot reach any private range"

# --- IoT isolation (VLAN 30 can ONLY reach internet) ---
add chain=forward action=drop src-address=192.168.30.0/24 \
    dst-address=192.168.10.0/24 comment="IoT cannot reach Corporate"
add chain=forward action=drop src-address=192.168.30.0/24 \
    dst-address=192.168.20.0/24 comment="IoT cannot reach Guest"
add chain=forward action=drop src-address=192.168.30.0/24 \
    dst-address=192.168.99.0/24 comment="IoT cannot reach Management"

# --- Management access only from Corporate ---
add chain=forward action=drop src-address=!192.168.10.0/24 \
    dst-address=192.168.99.0/24 comment="Only Corporate can reach Management"

# --- Allow Corporate → IoT (for printing) ---
add chain=forward action=accept src-address=192.168.10.0/24 \
    dst-address=192.168.30.0/24 dst-port=631,9100 protocol=tcp \
    comment="Corporate can print to IoT printers"

# --- Allow everything else that's not explicitly blocked ---
add chain=forward action=accept comment="Allow remaining traffic"
```

## WiFi Configuration: Aruba Instant On

The 5 Aruba AP22 access points are cloud-managed via Aruba's Instant On portal. No on-premise controller required — management happens through a web dashboard.

**SSID configuration:**

| SSID | VLAN | Security | Band | Notes |
|------|------|----------|------|-------|
| CompanyName | 10 | WPA3-Enterprise (RADIUS) | 5GHz preferred | Staff devices |
| CompanyName-Guest | 20 | WPA2-Personal + captive portal | 5GHz/2.4GHz | 10Mbps limit |
| IoT-Devices | 30 | WPA2-Personal (hidden SSID) | 2.4GHz only | Printers, cameras |

**WPA3-Enterprise** for the corporate SSID means each employee authenticates with their own credentials (via a RADIUS server — we use FreeRADIUS on the MikroTik). When someone leaves the company, we disable their RADIUS account. No need to change and redistribute a shared WiFi password to 60 people.

**Band steering**: APs prefer 5GHz for capable devices. 5GHz offers more non-overlapping channels and less interference from neighboring offices. 2.4GHz is available as fallback for IoT devices that don't support 5GHz.

### Channel Planning

WiFi interference is the #1 cause of "WiFi is slow" complaints in offices. Adjacent APs on the same channel interfere with each other. Proper channel planning eliminates this:

```
Floor 1 (3 APs):
  AP-1F-A: Channel 36  (5GHz) / Channel 1  (2.4GHz)
  AP-1F-B: Channel 48  (5GHz) / Channel 6  (2.4GHz)
  AP-1F-C: Channel 149 (5GHz) / Channel 11 (2.4GHz)

Floor 2 (2 APs):
  AP-2F-A: Channel 40  (5GHz) / Channel 1  (2.4GHz)
  AP-2F-B: Channel 52  (5GHz) / Channel 6  (2.4GHz)
```

Rules: no two adjacent APs share a channel. 5GHz has enough non-overlapping channels (36, 40, 44, 48, 52, 149, 153, 157, 161) that this is straightforward. 2.4GHz only has 3 non-overlapping channels (1, 6, 11) — just enough for our layout.

AP transmit power is reduced to medium (50%) to minimize overlap between coverage areas. Higher power ≠ better WiFi. Overlapping high-power APs cause more interference than properly tuned medium-power APs.

## Bandwidth Management

Without QoS, one developer downloading a Docker image can saturate the connection and make everyone's video calls stutter. MikroTik's queue system solves this:

```routeros
# Guest VLAN: 10Mbps per user (burst to 15Mbps for 10 seconds)
/queue simple
add name=guest-per-user target=192.168.20.0/24 \
    max-limit=10M/10M burst-limit=15M/15M burst-time=10s/10s \
    queue=pcq-upload-default/pcq-download-default \
    comment="Guest bandwidth limit"

# IoT VLAN: 5Mbps total (shared across all IoT devices)
/queue simple
add name=iot-total target=192.168.30.0/24 \
    max-limit=5M/5M comment="IoT bandwidth limit"

# Corporate VLAN: Fair queuing (equal share per user, no hard cap)
/queue type
add name=pcq-corp kind=pcq pcq-rate=0 pcq-classifier=src-address,dst-address

/queue simple
add name=corp-fair target=192.168.10.0/24 \
    queue=pcq-corp/pcq-corp comment="Corporate fair queuing"
```

**PCQ (Per Connection Queue)** for corporate ensures equal bandwidth distribution without a hard per-user cap. If only 5 people are in the office, each gets 100Mbps. If 50 people are online, each gets 10Mbps. The bandwidth adapts to usage.

## Site-to-Site VPN to Datacenter

MikroTik's built-in Wireguard support creates a permanent tunnel to our Proxmox VPN hub. Developers on the corporate VLAN can access internal services without running a VPN client:

```routeros
# Wireguard interface
/interface wireguard
add name=wg-datacenter listen-port=51820 \
    private-key="<mikrotik-private-key>"

# Peer: Proxmox VPN hub
/interface wireguard peers
add interface=wg-datacenter \
    public-key="<hub-public-key>" \
    endpoint-address=hub.example.com \
    endpoint-port=51820 \
    allowed-address=10.10.0.0/16 \
    persistent-keepalive=25

# IP address on the Wireguard interface
/ip address
add address=10.10.5.1/24 interface=wg-datacenter

# Route datacenter subnets through the tunnel
/ip route
add dst-address=10.10.0.0/16 gateway=wg-datacenter comment="Datacenter-via-VPN"

# DNS: forward internal domains to datacenter DNS
/ip dns static
add name=grafana.internal address=10.10.5.10
add name=argocd.internal address=10.10.2.100
add name=registry.internal address=10.10.2.50
```

The result: a developer on the corporate WiFi opens `http://grafana.internal:3000` in their browser — traffic goes through the MikroTik, into the Wireguard tunnel, to the datacenter monitoring VM. No VPN client, no extra configuration, completely transparent.

## Monitoring the Network

MikroTik exports SNMP metrics that Prometheus scrapes via the `snmp_exporter`:

```yaml
# prometheus.yml scrape config
- job_name: mikrotik
  static_configs:
    - targets: ['192.168.99.1']
  metrics_path: /snmp
  params:
    module: [mikrotik]
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - target_label: __address__
      replacement: snmp-exporter:9116
```

Grafana dashboard shows: per-interface traffic (WAN1 vs WAN2), VLAN utilization, WiFi client count, DHCP pool usage, firewall drop counts, and VPN tunnel status.

Alert on WAN failover:
```yaml
- alert: WANFailover
  expr: mikrotik_interface_traffic_bytes{interface="ether2"} > 0 AND mikrotik_interface_traffic_bytes{interface="ether1"} == 0
  for: 2m
  annotations:
    summary: "Office WAN failed over to 4G backup"
```

## Results

- **60+ users** on WiFi with zero "WiFi is slow" complaints (down from weekly complaints)
- **Dual-WAN failover**: tested 3 times (2 ISP outages + 1 planned test). Failover time: ~10 seconds. Users noticed a brief pause in video calls, nothing more.
- **VLAN isolation**: verified with nmap scans. Guest devices cannot reach corporate subnet — confirmed.
- **VPN transparency**: developers access `grafana.internal` from their laptop without any VPN client. Onboarding new developers went from "install VPN client, import config, troubleshoot MTU issues" to "connect to WiFi."
- **Total cost**: ~$1,290 — roughly what one year of a Meraki license costs for a single AP.

## Lessons Learned

**1. MikroTik is incredibly powerful for the price.** The RB3011 costs ~$200 and handles everything a $2,000 Cisco router does — routing, firewall, VPN, QoS, DHCP, DNS, SNMP. The trade-off is documentation quality and learning curve. RouterOS is well-documented on the MikroTik wiki, but it's not as beginner-friendly as Cisco's abundant training materials.

**2. VLAN everything.** Even in a small office, network segmentation matters. Guest devices have no business seeing production VPN traffic. A compromised IoT camera shouldn't be able to scan developer workstations. VLANs cost nothing in hardware (the switch supports them natively) and add significant security.

**3. Cloud-managed APs save time.** Aruba Instant On is genuinely set-and-forget. Firmware updates install automatically at 3 AM. Channel optimization happens continuously. In 10 months of operation, I've logged into the management portal exactly twice — once to add a new SSID, once out of curiosity. That's the level of maintenance overhead a startup needs from its WiFi.

**4. Test failover regularly — under real conditions.** We discovered our backup ISP had a DNS resolution issue only after the primary went down for real. Clients could reach IP addresses through the 4G backup but couldn't resolve hostnames. The fix was simple (configure MikroTik DNS to use multiple upstream resolvers), but we only discovered it during an actual outage. Now we do monthly failover tests: physically unplug WAN1 during business hours and verify everything works.

**5. Per-connection queuing beats static limits for corporate.** A hard bandwidth cap (e.g., 50Mbps per user) wastes capacity when few people are online and restricts too much when everyone is. PCQ dynamically divides available bandwidth equally among active users. It's the fair-share approach — everyone gets a proportional slice, and the slice grows or shrinks based on demand.
