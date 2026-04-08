---
title: "K3s HA Cluster on Proxmox: From Zero to Production-Ready"
date: "2025-05-01"
tags: ["k3s", "kubernetes", "proxmox", "high-availability"]
description: "Setting up a K3s HA cluster with embedded etcd, dual-NIC networking, and MetalLB on Proxmox"
published: true
---

# K3s HA Cluster on Proxmox: From Zero to Production-Ready

K3s is Kubernetes stripped to its essentials — a single binary under 100MB that runs the full Kubernetes API, scheduler, controller manager, and kubelet. No cloud provider dependencies, no heavy Java components, no external etcd cluster required. It's perfect for on-premise environments where every resource matters and operational simplicity is a feature, not a compromise.

This post covers every step of building a production-ready HA cluster on Proxmox: hardware allocation, topology decisions, embedded etcd vs. external datastore, dual-NIC networking for traffic isolation, flannel backend selection with real benchmarks, MetalLB for LoadBalancer services, backup strategy, and the operational lessons from running it for 8 months.

## Cluster Topology

We run 6 VMs on our Proxmox EPYC server — 3 control plane nodes and 3 workers:

```
┌───────────────────────────────────────────────────────┐
│                    Proxmox Host                        │
│              AMD EPYC 9654P, 188GB RAM                 │
│                                                        │
│  Control Plane (etcd + API server + scheduler)         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  control-1   │ │  control-2   │ │  control-3   │  │
│  │  4 vCPU      │ │  4 vCPU      │ │  4 vCPU      │  │
│  │  8GB RAM     │ │  8GB RAM     │ │  8GB RAM     │  │
│  │  30GB NVMe   │ │  30GB NVMe   │ │  30GB NVMe   │  │
│  │  10.10.1.1   │ │  10.10.1.2   │ │  10.10.1.3   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                        │
│  Workers (application pods)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  worker-1    │ │  worker-2    │ │  worker-3    │  │
│  │  8 vCPU      │ │  8 vCPU      │ │  8 vCPU      │  │
│  │  16GB RAM    │ │  16GB RAM    │ │  16GB RAM    │  │
│  │  50GB NVMe   │ │  50GB NVMe   │ │  50GB NVMe   │  │
│  │  10.10.2.1   │ │  10.10.2.2   │ │  10.10.2.3   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                        │
│  Total allocated: 36 vCPU, 72GB RAM, 240GB NVMe       │
└───────────────────────────────────────────────────────┘
```

**Resource allocation rationale**: Control plane nodes are modest (4 vCPU, 8GB) because K3s is lightweight — API server + etcd + scheduler typically consume 1-2 CPU and 2-3GB RAM at our scale (~100 pods). Worker nodes are beefier (8 vCPU, 16GB) because they run application workloads. NVMe storage is critical for etcd performance — etcd is extremely latency-sensitive, and spinning disks or network storage cause leader election timeouts.

## Why Embedded etcd Over External Datastore

K3s offers two HA modes:

**Embedded etcd**: K3s bundles etcd inside its binary. Each control plane node runs an etcd member. No external infrastructure to manage.

**External datastore**: K3s connects to a separate database (PostgreSQL, MySQL, or a standalone etcd cluster) for state storage. Fewer control plane nodes required (minimum 2 instead of 3).

We evaluated both:

| Factor | Embedded etcd | External Datastore |
|--------|--------------|-------------------|
| Minimum nodes | 3 (etcd quorum) | 2 (+ external DB) |
| Operational complexity | Lower (one binary) | Higher (DB maintenance, backups, upgrades) |
| Failure domain | K3s node failure = etcd member failure | DB failure = entire cluster failure |
| Backup | `k3s etcd-snapshot` (one command) | Database-specific backup tooling |
| Performance | Excellent (local NVMe) | Depends on DB latency |
| Scale ceiling | ~500 nodes / ~5000 pods | Higher (dedicated DB resources) |

We chose embedded etcd because:
- **Fewer moving parts**: No external database to provision, monitor, backup, upgrade, and troubleshoot. K3s manages etcd lifecycle internally.
- **Sufficient for our scale**: ~100 pods across 3 workers. Embedded etcd handles this effortlessly. The ~500 node ceiling is orders of magnitude above our needs.
- **Backup simplicity**: `k3s etcd-snapshot save` captures the entire cluster state in one command. Restoring is equally simple.
- **Performance**: etcd data lives on local NVMe, not over the network. etcd operations (reads/writes to the kv store) are sub-millisecond.

The trade-off: 3 control plane nodes instead of 2. The extra node costs 4 vCPU and 8GB RAM — a trivial resource investment for significantly simpler operations.

## Dual-NIC Networking

Each VM has two virtual network interfaces, mapped to two Proxmox bridges:

| NIC | Bridge | Network | Purpose |
|-----|--------|---------|---------|
| eth0 | vmbr0 | 10.10.0.0/24 (management) | SSH, K3s API server, kubectl |
| eth1 | vmbr1 | 10.10.10.0/24 (pod traffic) | Flannel overlay, pod-to-pod, service mesh |

**Why separate networks?** Pod traffic can be bursty — a pod downloading a large container image or processing a data pipeline can saturate the network. If pod traffic and management traffic share a NIC, a traffic burst can delay SSH sessions and kubectl commands, making the cluster appear unresponsive even though it's functioning normally.

With dual NICs, management traffic is isolated. Even if pod traffic saturates eth1, SSH and kubectl on eth0 remain responsive. This separation was critical during our initial setup — we could debug networking issues over SSH without fighting the very traffic we were debugging.

The Proxmox bridge configuration:

```bash
# /etc/network/interfaces on the Proxmox host
auto vmbr0
iface vmbr0 inet static
    address 10.10.0.1/24
    bridge-ports eno1
    bridge-stp off
    bridge-fd 0
    # Management traffic — SSH, APIs, monitoring

auto vmbr1
iface vmbr1 inet static
    address 10.10.10.1/24
    bridge-ports eno2
    bridge-stp off
    bridge-fd 0
    # Pod traffic — flannel, service mesh, inter-pod
```

## K3s Installation

### First Control Plane Node

The first node initializes the cluster and the embedded etcd:

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san=10.10.0.100 \
  --tls-san=k3s-api.internal \
  --flannel-iface=eth1 \
  --flannel-backend=host-gw \
  --disable=traefik \
  --disable=servicelb \
  --node-taint CriticalAddonsOnly=true:NoExecute \
  --etcd-expose-metrics \
  --kube-controller-manager-arg="bind-address=0.0.0.0" \
  --kube-scheduler-arg="bind-address=0.0.0.0"
```

Every flag has a reason:

- **`--cluster-init`**: Initializes embedded etcd. Only used on the first node — subsequent nodes join with `--server`.
- **`--tls-san=10.10.0.100`**: Adds a Subject Alternative Name to the API server certificate. This IP is our virtual IP (managed by keepalived) that floats between control plane nodes. Without this, kubectl connections to the VIP fail TLS validation.
- **`--flannel-iface=eth1`**: Forces flannel to use the pod traffic NIC, not the management NIC. Without this, flannel auto-detects the interface and might choose eth0.
- **`--flannel-backend=host-gw`**: Uses direct routing instead of VXLAN encapsulation. Faster and lower overhead when all nodes are on the same L2 network (our case).
- **`--disable=traefik`**: K3s bundles Traefik v2 as the default ingress controller. We run our own Traefik v3 for more control over configuration and upgrade timing.
- **`--disable=servicelb`**: K3s bundles a basic LoadBalancer implementation (Klipper). We use MetalLB instead for proper L2/BGP advertisement.
- **`--node-taint CriticalAddonsOnly=true:NoExecute`**: Prevents application pods from scheduling on control plane nodes. Only system components (CoreDNS, metrics-server) run on control plane.
- **`--etcd-expose-metrics`**: Exposes etcd metrics on port 2381 for Prometheus scraping. Essential for monitoring etcd health.
- **`--kube-*-arg="bind-address=0.0.0.0"`**: Exposes controller-manager and scheduler metrics on all interfaces (default is localhost only). Needed for Prometheus to scrape from the monitoring VM.

### Joining Additional Control Plane Nodes

```bash
# Get the node token from the first control node
NODE_TOKEN=$(ssh deploy@10.10.1.1 "cat /var/lib/rancher/k3s/server/node-token")

# Join second and third control nodes
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://10.10.1.1:6443 \
  --token ${NODE_TOKEN} \
  --tls-san=10.10.0.100 \
  --flannel-iface=eth1 \
  --flannel-backend=host-gw \
  --disable=traefik \
  --disable=servicelb \
  --node-taint CriticalAddonsOnly=true:NoExecute \
  --etcd-expose-metrics
```

After joining, verify etcd membership:

```bash
$ k3s etcd-snapshot info
Members:
  control-1: https://10.10.1.1:2380 (leader)
  control-2: https://10.10.1.2:2380
  control-3: https://10.10.1.3:2380
```

Three members, one leader. Quorum requires 2 of 3 — the cluster survives one node failure.

### Worker Nodes

Workers are simpler — they don't run etcd or the API server:

```bash
curl -sfL https://get.k3s.io | sh -s - agent \
  --server https://10.10.0.100:6443 \
  --token ${NODE_TOKEN} \
  --flannel-iface=eth1
```

Workers connect to the virtual IP (`10.10.0.100`) instead of a specific control node. If control-1 goes down, workers automatically reconnect through the VIP to another control node.

## MetalLB: LoadBalancer Services Without a Cloud

In cloud Kubernetes (GKE, EKS, AKS), creating a `Service` with `type: LoadBalancer` provisions a cloud load balancer automatically. On bare metal, there's no cloud provider to provision load balancers. MetalLB fills this gap by advertising Service IPs via L2 (ARP/NDP) or BGP.

We use L2 mode because our network is flat (single L2 domain):

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
    - 10.10.0.200-10.10.0.250    # 51 IPs reserved for LoadBalancers
  autoAssign: true
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
spec:
  ipAddressPools:
    - default-pool
  interfaces:
    - eth0     # Advertise on management network
```

Now when we create a `Service` with `type: LoadBalancer`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: traefik
spec:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
    - name: https
      port: 443
  selector:
    app: traefik
```

MetalLB assigns an IP from the pool (e.g., `10.10.0.200`) and responds to ARP requests for that IP. Traffic to `10.10.0.200:443` reaches the Traefik pods. From the outside, it looks like a real load balancer.

## Flannel host-gw vs. VXLAN: Real Benchmarks

We benchmarked both flannel backends using `iperf3` between pods on different worker nodes:

| Metric | VXLAN | host-gw | Improvement |
|--------|-------|---------|-------------|
| Throughput (TCP) | 8.2 Gbps | 9.4 Gbps | +15% |
| Throughput (UDP) | 7.8 Gbps | 9.1 Gbps | +17% |
| Latency (avg) | 0.15ms | 0.08ms | -47% |
| Latency (p99) | 0.32ms | 0.14ms | -56% |
| CPU overhead | ~3% per Gbps | ~1.5% per Gbps | -50% |
| Packet overhead | ~50 bytes/pkt | 0 bytes/pkt | -100% |

**host-gw wins decisively when all nodes share the same L2 network.** It works by adding routes to the host's routing table — no encapsulation, no overhead. Traffic from Pod A on worker-1 to Pod B on worker-2 goes directly via host routes:

```
Pod A (10.42.0.5) → worker-1 kernel → route: 10.42.1.0/24 via 10.10.10.2 → worker-2 kernel → Pod B (10.42.1.3)
```

VXLAN wraps each packet in a UDP envelope, adding 50 bytes of overhead and requiring encapsulation/decapsulation at each hop. It's necessary when nodes span multiple L2 networks (different subnets, different datacenters), but it's unnecessary overhead when all nodes are on the same switch.

## Backup Strategy

etcd holds the entire cluster state: all Kubernetes objects (Deployments, Services, ConfigMaps, Secrets, etc.). Losing etcd means rebuilding the cluster from scratch. Backups are non-negotiable.

```bash
# Manual snapshot (for before-upgrade safety)
k3s etcd-snapshot save --name pre-upgrade-$(date +%Y%m%d)

# Automated daily snapshots via cron
# /etc/cron.d/k3s-backup
0 21 * * * root /usr/local/bin/k3s etcd-snapshot save \
  --name daily-$(date +\%Y\%m\%d) 2>&1 | logger -t k3s-backup
```

Snapshots are stored locally at `/var/lib/rancher/k3s/server/db/snapshots/` and replicated to Proxmox Backup Server:

```bash
# Ship snapshots to backup server (runs after snapshot cron)
15 21 * * * root rsync -az /var/lib/rancher/k3s/server/db/snapshots/ \
  backup@10.10.0.50:/backups/k3s-etcd/ --delete-after
```

Retention: 7 daily snapshots locally, 30 daily snapshots on the backup server.

### Restore Procedure (Tested Quarterly)

```bash
# Stop K3s on all nodes
systemctl stop k3s  # Run on all 3 control nodes

# Restore from snapshot on the first node
k3s server \
  --cluster-reset \
  --cluster-reset-restore-path=/var/lib/rancher/k3s/server/db/snapshots/daily-20250501

# Start K3s on the first node
systemctl start k3s

# Rejoin other control nodes (they need to be re-initialized)
# On control-2 and control-3:
rm -rf /var/lib/rancher/k3s/server/db/
systemctl start k3s
```

We test this procedure every quarter on a separate set of VMs. The restore takes ~3 minutes for our cluster state (~15MB snapshot). Every engineer on the team has run the procedure at least once — we never want a restore to be someone's first time during an actual incident.

## Monitoring the Cluster

Prometheus scrapes K3s and etcd metrics from all 6 nodes. Key alerts:

```yaml
groups:
  - name: k3s-cluster
    rules:
      # etcd leader changes (instability indicator)
      - alert: EtcdLeaderChanges
        expr: increase(etcd_server_leader_changes_seen_total[1h]) > 3
        labels: { severity: warning }
        annotations:
          summary: "etcd leader changed {{ $value }} times in 1 hour"

      # etcd proposal failures (split brain risk)
      - alert: EtcdProposalFailures
        expr: increase(etcd_server_proposals_failed_total[1h]) > 5
        labels: { severity: critical }
        annotations:
          summary: "{{ $value }} etcd proposal failures — possible quorum loss"

      # Node not ready
      - alert: K3sNodeNotReady
        expr: kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "{{ $labels.node }} has been NotReady for 5 minutes"

      # Pod stuck in Pending
      - alert: PodStuckPending
        expr: kube_pod_status_phase{phase="Pending"} == 1
        for: 15m
        labels: { severity: warning }
        annotations:
          summary: "{{ $labels.pod }} pending for 15 minutes — check resources/scheduling"
```

The etcd alerts are the most important. Frequent leader changes indicate network instability or disk I/O problems. Proposal failures indicate a quorum issue. Both require immediate investigation.

## Results After 8 Months

- **6-node cluster**: 3 control + 3 workers, running ~100 pods across 9 namespaces
- **Uptime**: 99.95% — one planned maintenance window (K3s upgrade), zero unplanned outages
- **etcd snapshot restore tested**: 4 times (quarterly). Average restore time: 3 minutes.
- **Resource efficiency**: Control plane uses ~6 vCPU / 9GB RAM total (3 nodes). Workers use ~18 vCPU / 36GB RAM total under normal load.
- **Pod scheduling latency**: <2 seconds from `kubectl apply` to pod `Running`
- **Network performance**: 9.4 Gbps pod-to-pod throughput with host-gw flannel

## Lessons Learned

**1. 3 control nodes is the minimum for HA — not 2.** etcd requires a majority quorum: 2 of 3 nodes must be healthy. With 2 nodes, losing one means losing quorum — the entire cluster becomes read-only. We started with 2 control nodes and learned this the hard way during a planned maintenance window. Taking down one node for an upgrade made the cluster unresponsive. We added the third node the next day.

**2. host-gw over VXLAN when all nodes share L2.** The performance difference is measurable and significant: 15% more throughput, 47% lower latency, 50% less CPU overhead. There's no reason to use VXLAN on a flat network. VXLAN is for crossing L3 boundaries — if your nodes are on the same switch, use host-gw.

**3. Disable K3s built-in Traefik.** The bundled Traefik version lags behind upstream releases, and K3s doesn't support custom Traefik Helm values. If you need IngressRoute CRDs, middleware chains, or any Traefik configuration beyond basic Ingress — install your own. The `--disable=traefik` flag is one of the first things we set.

**4. Taint control plane nodes.** Without the `CriticalAddonsOnly` taint, K3s schedules application pods on control plane nodes. This seems harmless until a misbehaving pod OOM-kills etcd. Control plane nodes should run only system components: CoreDNS, metrics-server, kube-proxy. Everything else goes on workers.

**5. Test your etcd restores regularly.** A backup you've never restored is a hope, not a backup. Our quarterly restore drills have caught two issues: once the snapshot was corrupted (rsync was interrupted), once the restore procedure changed after a K3s upgrade (new flags required). Both would have been discovered during an actual incident if we hadn't tested proactively.
