---
title: "From Bare Metal to Production: Proxmox Datacenter Setup"
date: "2026-02-20"
tags: ["proxmox", "homelab", "kubernetes", "infrastructure"]
description: "Setting up a Proxmox server with 28 VMs, K3s HA cluster, and automated provisioning"
published: true
---

# From Bare Metal to Production: Proxmox Datacenter Setup

We needed on-premise infrastructure for development and testing. Starting with a single AMD EPYC server, we built a full datacenter environment with automated provisioning.

## Hardware

- **CPU**: AMD EPYC 9654P — 192 threads
- **RAM**: 188GB DDR5
- **Storage**: NVMe SSDs in ZFS mirror
- **Network**: Dual 10GbE NICs

## Architecture

```
Proxmox VE Host
├── K3s HA Cluster (3 control + 3 worker)
│   ├── embedded etcd
│   ├── flannel host-gw CNI
│   └── MetalLB for LoadBalancer services
├── Development VMs (9 SSH-accessible containers)
├── Monitoring Stack VM
├── Database VMs (PostgreSQL, MongoDB)
├── Wireguard VPN Gateway
└── Proxmox Backup Server
```

## Cloud-Init Templates

We created 6 cloud-init template variants:

1. **Base**: Ubuntu 22.04, SSH hardening, fail2ban
2. **K3s Node**: Base + K3s prerequisites, kernel tuning
3. **Dev Container**: Base + dev tools, SSH key injection
4. **Database**: Base + storage optimization, LUKS encryption
5. **Monitor**: Base + Prometheus exporters
6. **Gateway**: Base + Wireguard, iptables rules

Each template provisions in under 2 minutes.

## K3s HA Cluster

Key decisions:
- **Embedded etcd** over external — simpler operations, sufficient for our scale
- **Flannel host-gw** over VXLAN — better performance on same L2 network
- **Dual-NIC setup** — management on NIC1, pod traffic on NIC2

## Security Hardening

- LUKS full-disk encryption on all VMs
- YubiKey-only SSH authentication
- Wireguard VPN for all external access
- Daily automated backups (9PM, 7-day retention)

## Lessons Learned

1. Cloud-init templates save enormous time. Invest upfront.
2. Document your network topology before provisioning. We redesigned subnets twice.
3. LUKS + YubiKey adds friction but is worth it for production-adjacent infra.
