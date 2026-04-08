---
title: "From Bare Metal to Production: Proxmox Datacenter Setup"
date: "2026-02-20"
tags: ["proxmox", "homelab", "kubernetes", "infrastructure"]
description: "Setting up a Proxmox server with 28 VMs, K3s HA cluster, and automated provisioning"
published: true
---

# From Bare Metal to Production: Proxmox Datacenter Setup

We needed on-premise infrastructure for development and testing. Cloud costs were climbing, developer environments were inconsistent, and we wanted full control over the hardware running our pre-production workloads. Starting with a single AMD EPYC server, we built a full datacenter environment with automated provisioning that now hosts 28 VMs serving everything from a K3s HA cluster to isolated development environments.

This post covers the full journey — hardware selection, network design, VM provisioning, storage strategy, and the operational lessons we learned running bare metal in production.

## Hardware Selection

We evaluated three options: a rack of small machines, a pair of mid-range servers, or one beefy server. We went with one server because our workloads are mostly CPU-bound (Kubernetes, compilation, CI runners) and a single large machine simplifies networking and storage.

- **CPU**: AMD EPYC 9654P — 96 cores, 192 threads. This processor is a monster. We chose the single-socket "P" variant because dual-socket adds cost and complexity we don't need. 192 threads means we can allocate 4-8 vCPUs per VM and still have headroom.
- **RAM**: 188GB DDR5 ECC. ECC is non-negotiable for production-adjacent infrastructure. We've seen bit-flip errors cause mysterious crashes on non-ECC systems.
- **Storage**: 2x 2TB NVMe SSDs in ZFS mirror. ZFS gives us snapshots, compression, and data integrity checking. The mirror means we survive a drive failure without data loss.
- **Network**: Dual 10GbE NICs — one for management traffic, one for VM/pod traffic. Separation prevents a pod network storm from locking us out of the Proxmox management interface.

Total cost was roughly equivalent to 8 months of our previous cloud spend. The server paid for itself within a year.

## Network Architecture

Before provisioning a single VM, we spent two days designing the network topology. This was the best investment of the entire project — we redesigned subnets twice during planning, which saved us from redesigning them in production.

```
Physical NICs:
  NIC1 (eno1) → Management Bridge (vmbr0) → 10.10.0.0/24
  NIC2 (eno2) → VM Traffic Bridge (vmbr1) → 10.10.10.0/24

Subnet Allocation:
  10.10.0.0/24   — Management (Proxmox UI, SSH, VPN gateway)
  10.10.1.0/24   — K3s control plane nodes
  10.10.2.0/24   — K3s worker nodes
  10.10.3.0/24   — Development VMs
  10.10.4.0/24   — Database VMs
  10.10.5.0/24   — Monitoring stack
  10.10.10.0/24  — Pod network (flannel)
  10.10.0.200-250 — MetalLB pool (LoadBalancer IPs)
```

Each subnet maps to a VLAN on the VM traffic bridge. Proxmox's built-in firewall handles inter-VLAN routing with explicit allow rules — by default, subnets can't talk to each other.

## The VM Architecture

28 VMs organized by function:

```
Proxmox VE Host (AMD EPYC 9654P, 188GB RAM)
│
├── K3s HA Cluster
│   ├── control-1  (4 vCPU, 8GB)  — etcd + API server
│   ├── control-2  (4 vCPU, 8GB)  — etcd + API server
│   ├── control-3  (4 vCPU, 8GB)  — etcd + API server
│   ├── worker-1   (8 vCPU, 16GB) — application pods
│   ├── worker-2   (8 vCPU, 16GB) — application pods
│   └── worker-3   (8 vCPU, 16GB) — application pods
│
├── Development Containers (9 VMs)
│   ├── dev-alice through dev-ivan
│   └── Each: 4 vCPU, 8GB, SSH-accessible
│
├── Infrastructure VMs
│   ├── monitor-1  (4 vCPU, 8GB)  — Prometheus + Grafana + Loki
│   ├── db-postgres (4 vCPU, 16GB) — PostgreSQL (LUKS encrypted)
│   ├── db-mongo   (4 vCPU, 16GB) — MongoDB (LUKS encrypted)
│   ├── vpn-gw     (2 vCPU, 2GB)  — Wireguard hub
│   ├── registry   (2 vCPU, 4GB)  — Verdaccio + container registry
│   └── backup     (2 vCPU, 4GB)  — Proxmox Backup Server
│
└── Total: 28 VMs, ~120 vCPU allocated, ~160GB RAM allocated
```

We deliberately over-commit CPU (120 vCPU on 192 threads) because most VMs are idle most of the time. RAM is not over-committed — that way lies OOM kills and data corruption.

## Cloud-Init Templates

Manually configuring 28 VMs would take days. We built 6 cloud-init template variants that provision fully hardened VMs in under 2 minutes.

Each template starts from a golden image: Ubuntu 22.04 LTS with cloud-init pre-installed, converted to a Proxmox template (VM ID 9000-9005).

| Template | VM ID | Base Packages | Role-Specific |
|----------|-------|--------------|---------------|
| base | 9000 | fail2ban, ufw, unattended-upgrades | SSH hardening, deploy user |
| k3s-node | 9001 | base + containerd, crictl | Kernel tuning, sysctl, cgroup v2 |
| dev-container | 9002 | base + git, docker, build-essential | SSH key injection, Node/Go/Rust toolchains |
| database | 9003 | base + postgresql-client | LUKS encryption, storage tuning, WAL archival |
| monitor | 9004 | base + node-exporter, promtail | Prometheus exporters, Alloy agent |
| gateway | 9005 | base + wireguard, iptables | VPN config, NAT rules, IP forwarding |

The provisioning script clones a template, injects cloud-init parameters, and starts the VM:

```bash
#!/bin/bash
# provision-vm.sh — Clone template and configure via cloud-init
TEMPLATE_ID=$1
VMID=$2
HOSTNAME=$3
IP=$4
GATEWAY=${5:-10.10.0.1}

# Clone from template (full clone, not linked)
qm clone ${TEMPLATE_ID} ${VMID} --name ${HOSTNAME} --full

# Set cloud-init parameters
qm set ${VMID} --ciuser deploy
qm set ${VMID} --sshkey ~/.ssh/authorized_keys
qm set ${VMID} --ipconfig0 ip=${IP}/24,gw=${GATEWAY}
qm set ${VMID} --nameserver 10.10.0.1
qm set ${VMID} --searchdomain internal.lab

# Resize disk if needed (default is 20GB)
qm resize ${VMID} scsi0 +30G

# Start VM — cloud-init runs on first boot
qm start ${VMID}

echo "VM ${HOSTNAME} (${VMID}) provisioning at ${IP}..."
echo "SSH available in ~90 seconds: ssh deploy@${IP}"
```

Provisioning a new K3s worker node: `./provision-vm.sh 9001 201 worker-4 10.10.2.4` — 2 minutes from command to SSH-ready.

## Storage Strategy with ZFS

ZFS on the root NVMe pool gives us features that ext4/xfs can't match:

- **Snapshots before risky operations**: `zfs snapshot rpool/data@before-upgrade` — instant, zero-cost
- **Compression**: LZ4 compression enabled by default. Our VM images compress ~30%, saving significant NVMe space
- **Scrubs**: Weekly scrub detects and corrects silent data corruption. We've caught 2 corrupted blocks in 6 months — both auto-corrected by ZFS
- **Send/receive**: `zfs send` pipes snapshots to the backup server efficiently (only changed blocks)

```bash
# Weekly scrub cron
0 2 * * 0 /sbin/zfs scrub rpool

# Daily snapshot + ship to backup
0 3 * * * /sbin/zfs snapshot rpool/data@auto-$(date +\%Y\%m\%d) && \
          /sbin/zfs send -i rpool/data@auto-yesterday rpool/data@auto-$(date +\%Y\%m\%d) | \
          ssh backup@10.10.0.50 zfs receive backup/proxmox
```

## Security Hardening

Security is layered — no single measure is sufficient.

**Physical layer**: Server is in a locked rack with UPS backup. Console access requires physical key.

**Host layer**: Proxmox web UI accessible only via management VLAN. Two-factor authentication enabled. Fail2ban monitors SSH and the web interface.

**VM layer**:
- LUKS full-disk encryption on all database VMs. Keys are stored in a HashiCorp Vault instance, not on disk.
- YubiKey-only SSH authentication — no passwords, no regular SSH keys. Hardware tokens prevent key theft.
- UFW firewall on every VM with default-deny incoming.
- Unattended security upgrades enabled on all VMs.

**Network layer**:
- Inter-VLAN traffic blocked by default, explicitly allowed per service need
- Wireguard VPN required for all external access — no port forwarding to the public internet
- DNS resolution handled internally — VMs can't resolve arbitrary external domains

**Backup layer**:
- Daily automated backups at 9PM, 7-day retention on Proxmox Backup Server
- Weekly full backups shipped to an offsite NAS via encrypted `zfs send`
- Quarterly restore tests — we actually boot a backup to verify it works

## Operational Monitoring

Every VM runs node-exporter and Alloy (log collector). The monitoring VM runs Prometheus, Grafana, and Loki. We track:

- Host-level: CPU, RAM, disk I/O, network throughput, ZFS pool health
- VM-level: Per-VM resource consumption, uptime, backup status
- K3s cluster: Pod counts, node status, etcd health, API server latency
- Alerts: Disk > 80%, RAM > 90%, ZFS scrub errors, backup failures, VM down

A single Grafana dashboard gives us the health of the entire infrastructure at a glance. This dashboard is the first thing I check every morning.

## Results

- **28 VMs** running on a single server, all provisioned from 6 templates
- **VM provisioning time**: 45 minutes (manual) → 2 minutes (cloud-init)
- **Zero configuration drift** — every VM is built from a template, never manually tweaked
- **Cost**: ~8 months of cloud spend, then "free" (minus electricity and internet)
- **Uptime**: 99.9% over 6 months (one planned maintenance window, zero unplanned outages)

## Lessons Learned

**1. Cloud-init templates save enormous time — invest upfront.** We spent 3 days building the 6 templates. Those 3 days have saved hundreds of hours in VM provisioning since. The key is making templates parameterized so they work for any instance count.

**2. Document your network topology before provisioning.** We redesigned subnets twice during planning — each time took an hour of whiteboarding. Redesigning after 28 VMs are running would have taken days of downtime.

**3. LUKS + YubiKey adds friction but is worth it for production-adjacent infrastructure.** One compromised SSH key could access all VMs. Hardware keys prevent that. The 10-second inconvenience of tapping a YubiKey is cheap insurance.

**4. Don't over-commit RAM.** CPU over-commit is fine — most VMs are idle most of the time. RAM over-commit causes OOM kills that corrupt databases and crash clusters. We keep 15-20% RAM headroom at all times.

**5. Test your backups by restoring them.** We discovered our first backup set was corrupted because we hadn't tested the restore process. Now we do quarterly restore drills — boot a backup VM, verify data integrity, then destroy it. A backup you can't restore is not a backup.
