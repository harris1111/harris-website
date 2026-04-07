---
title: "K3s HA Cluster on Proxmox: From Zero to Production-Ready"
date: "2025-05-01"
tags: ["k3s", "kubernetes", "proxmox", "high-availability"]
description: "Setting up a K3s HA cluster with embedded etcd, dual-NIC networking, and MetalLB on Proxmox"
published: true
---

# K3s HA Cluster on Proxmox: From Zero to Production-Ready

K3s is Kubernetes stripped to its essentials — perfect for on-premise where every resource matters. Here's how we built a production-ready HA cluster on Proxmox.

## Cluster Topology

```
┌─────────────────────────────────────────┐
│              Proxmox Host               │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ control-1│ │ control-2│ │ control-3││
│  │ etcd     │ │ etcd     │ │ etcd     ││
│  │ 4 CPU    │ │ 4 CPU    │ │ 4 CPU    ││
│  │ 8GB RAM  │ │ 8GB RAM  │ │ 8GB RAM  ││
│  └──────────┘ └──────────┘ └──────────┘│
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ worker-1 │ │ worker-2 │ │ worker-3 ││
│  │ 8 CPU    │ │ 8 CPU    │ │ 8 CPU    ││
│  │ 16GB RAM │ │ 16GB RAM │ │ 16GB RAM ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

## Why Embedded etcd Over External

Two options for K3s HA:
- **Embedded etcd:** Built into K3s, simpler operations
- **External datastore:** Separate PostgreSQL/MySQL/etcd cluster

We chose embedded etcd because:
- Fewer moving parts (no external database to manage)
- Sufficient for our scale (~50 pods)
- Backup is straightforward (`k3s etcd-snapshot`)

Trade-off: 3 control plane nodes minimum (etcd quorum). With external DB you can run 2.

## Dual-NIC Setup

Each VM has two network interfaces:

| NIC | Network | Purpose |
|-----|---------|---------|
| eth0 | 10.10.0.0/24 | Management (SSH, K3s API) |
| eth1 | 10.10.10.0/24 | Pod traffic (flannel) |

Separation prevents pod traffic from saturating the management network.

## Installation

### First Control Node

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=10.10.0.100 \
  --flannel-iface=eth1 \
  --flannel-backend=host-gw \
  --disable=traefik \
  --disable=servicelb \
  --node-taint CriticalAddonsOnly=true:NoExecute
```

Key flags:
- `--cluster-init`: Enable embedded etcd
- `--flannel-iface=eth1`: Pod traffic on second NIC
- `--flannel-backend=host-gw`: Better performance than VXLAN on same L2
- `--disable=traefik,servicelb`: We use our own Traefik + MetalLB

### Additional Control Nodes

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://10.10.0.101:6443 \
  --token <node-token> \
  --flannel-iface=eth1 \
  --flannel-backend=host-gw
```

### Worker Nodes

```bash
curl -sfL https://get.k3s.io | sh -s - agent \
  --server https://10.10.0.101:6443 \
  --token <node-token> \
  --flannel-iface=eth1
```

## MetalLB for LoadBalancer Services

Without a cloud provider, there's no LoadBalancer implementation. MetalLB fills this gap:

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
spec:
  addresses:
    - 10.10.0.200-10.10.0.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
spec:
  ipAddressPools:
    - default-pool
```

Now `type: LoadBalancer` services get real IPs from the pool.

## Flannel host-gw vs VXLAN

We benchmarked both:

| Metric | VXLAN | host-gw |
|--------|-------|---------|
| Throughput | 8.2 Gbps | 9.4 Gbps |
| Latency | 0.15ms | 0.08ms |
| Overhead | ~50 bytes/packet | 0 |

host-gw wins when all nodes are on the same L2 network (our case). VXLAN is needed for cross-subnet routing.

## Backup Strategy

```bash
# Daily etcd snapshots
k3s etcd-snapshot save --name daily-$(date +%Y%m%d)

# Cron job
0 21 * * * /usr/local/bin/k3s etcd-snapshot save --name daily-$(date +\%Y\%m\%d)
```

Snapshots stored on Proxmox Backup Server with 7-day retention.

## Lessons

1. **3 control nodes is the minimum for HA.** 2 nodes = no quorum if one fails. We started with 2 and learned this the hard way during a planned maintenance.
2. **host-gw over VXLAN** when all nodes share L2. The performance difference is measurable.
3. **Disable K3s built-in Traefik** if you want to manage your own ingress. The bundled version lags behind upstream releases.
