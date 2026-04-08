---
title: "Multi-Region GCP Architecture: VPCs, Firewalls, and Jump Boxes"
date: "2025-09-18"
tags: ["gcp", "cloud", "networking", "security"]
description: "Designing multi-region GCP infrastructure with 11 VPCs, 50+ firewall rules, and Cloudflare-only ingress"
published: true
---

# Multi-Region GCP Architecture: VPCs, Firewalls, and Jump Boxes

Our Web3 platform needed presence in Singapore, Tokyo, and UAE. Low latency for users in each region, data sovereignty compliance for certain workloads, and resilience against regional outages. The challenge wasn't just "deploy in multiple regions" — it was designing a network architecture that's secure by default, manageable at scale, and doesn't require a networking PhD to operate.

Here's how we structured the GCP infrastructure: 11 VPCs segmented by function, 50+ firewall rules organized in priority tiers, Cloudflare-only ingress for DDoS mitigation, and a jump box pattern that eliminated direct SSH to production.

## Why Function-Based VPCs, Not Region-Based

The first architectural decision was VPC topology. Two common approaches:

**Region-based**: One VPC per region. Simple mental model, but firewall rules get duplicated — the "allow database traffic" rule exists in every regional VPC.

**Function-based**: One VPC per function (app, database, monitoring, etc.). Each VPC spans multiple regions via subnets. A firewall rule on `db-vpc` applies to ALL database subnets regardless of region.

We chose function-based. Here's why:

```
Region-based (rejected):
  sgp-vpc: app subnet + db subnet + monitor subnet
  tyo-vpc: app subnet + db subnet + monitor subnet
  uae-vpc: app subnet + db subnet
  → Firewall rules duplicated across 3 VPCs
  → Adding a new rule = change 3 VPCs
  → Easy to forget one region

Function-based (chosen):
  app-vpc:      sgp-subnet, tyo-subnet, uae-subnet
  db-vpc:       sgp-subnet, tyo-subnet
  monitor-vpc:  sgp-subnet
  security-vpc: sgp-subnet
  build-vpc:    sgp-subnet
  → Firewall rules defined once per function
  → Adding "block all non-internal traffic to databases" = one rule on db-vpc
  → Impossible to forget a region
```

The trade-off: VPC peering is needed for cross-VPC communication (app pods talking to databases). GCP limits VPC peering to 25 peers per VPC. With 11 VPCs, we use 10 peering connections on the busiest VPC — safe margin, but something to watch.

## VPC Design

11 VPCs, each with a clear security boundary:

| VPC | Purpose | Regions | Subnet CIDRs |
|-----|---------|---------|---------------|
| app-vpc | Application workloads (GKE) | SGP, TYO, UAE | 10.0.{1-3}.0/24 |
| db-vpc | PostgreSQL, MongoDB, Redis | SGP, TYO | 10.1.{1-2}.0/24 |
| cache-vpc | Redis, Memcached (low-latency) | SGP, TYO, UAE | 10.2.{1-3}.0/24 |
| queue-vpc | Kafka, RabbitMQ | SGP | 10.3.1.0/24 |
| monitor-vpc | Prometheus, Grafana, Loki | SGP | 10.4.1.0/24 |
| security-vpc | Vault, jump boxes, audit logs | SGP | 10.5.1.0/24 |
| build-vpc | CI/CD runners (GitHub Actions self-hosted) | SGP | 10.6.1.0/24 |
| storage-vpc | GCS proxies, backup endpoints | SGP | 10.7.1.0/24 |
| edge-vpc | Cloudflare Tunnel origins | SGP, TYO, UAE | 10.8.{1-3}.0/24 |
| mgmt-vpc | Bastion hosts, admin tools | SGP | 10.9.1.0/24 |
| sandbox-vpc | Developer experimentation | SGP | 10.10.1.0/24 |

Each VPC is peered with only the VPCs it needs to communicate with. `db-vpc` peers with `app-vpc` and `monitor-vpc` (for metric scraping), but NOT with `sandbox-vpc` or `build-vpc`. Principle of least privilege applied to network topology.

## Firewall Architecture

50+ firewall rules organized in priority tiers. GCP evaluates firewall rules by priority number — lower number = higher priority. A DENY at priority 100 beats an ALLOW at priority 200.

```
Priority 100-199: DENY rules (block known bad patterns)
  ├── 100: Deny all ingress from known malicious CIDRs (updated weekly)
  ├── 110: Deny all ingress to database ports from non-VPC sources
  └── 150: Deny all egress to known C2 domains (IP-based blocklist)

Priority 200-299: Cloudflare-only ingress (public-facing services)
  ├── 200: Allow HTTPS (443) from Cloudflare IP ranges → app-vpc
  ├── 210: Allow HTTP (80) from Cloudflare IP ranges → app-vpc (redirect to HTTPS)
  └── 250: Allow Cloudflare Tunnel traffic → edge-vpc

Priority 300-399: Internal service-to-service
  ├── 300: Allow app-vpc → db-vpc on database ports (5432, 27017, 6379)
  ├── 310: Allow app-vpc → cache-vpc on Redis port (6379)
  ├── 320: Allow app-vpc → queue-vpc on Kafka port (9092)
  └── 350: Allow all VPCs → monitor-vpc on metrics port (9090, 3100)

Priority 400-499: Monitoring and health checks
  ├── 400: Allow GCP health check IPs → app-vpc on health port
  ├── 410: Allow monitor-vpc → all VPCs on node-exporter port (9100)
  └── 450: Allow GKE master → app-vpc on kubelet port (10250)

Priority 500-599: Management access
  ├── 500: Allow security-vpc → all VPCs on SSH (22) — jump box access
  └── 510: Allow mgmt-vpc → monitor-vpc on Grafana port (3000)

Priority 900-999: Default deny-all
  └── 999: Deny all ingress (explicit, even though GCP implies it)
```

### Why Explicit Default Deny

GCP has an implied deny-all rule at the lowest priority. We add an explicit one at priority 999 because:
- It shows up in firewall logs (implied rules don't)
- New team members can see the "deny all" rule in the console — makes the security model visible
- We can add exceptions above 999 for debugging without touching the "real" rules

### Cloudflare-Only Ingress

This is our most important security decision. No direct internet access to our load balancers. ALL public traffic must pass through Cloudflare:

```bash
# Cloudflare publishes their IP ranges at:
# https://www.cloudflare.com/ips-v4 and /ips-v6

# Create firewall rule allowing only Cloudflare source IPs
gcloud compute firewall-rules create allow-cloudflare-https \
  --network=app-vpc \
  --allow=tcp:443 \
  --source-ranges="173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,\
103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,\
188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,\
104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22" \
  --target-tags=web-server \
  --priority=200 \
  --description="Allow HTTPS only from Cloudflare IP ranges"
```

What this achieves:
- **DDoS protection**: Cloudflare absorbs volumetric attacks. Only clean traffic reaches our infrastructure.
- **IP hiding**: Our GCP external IPs aren't exposed. Attackers can't bypass Cloudflare by hitting our IPs directly.
- **WAF**: Cloudflare's Web Application Firewall filters SQLi, XSS, and other application-layer attacks before they reach us.
- **Cost**: Free on Cloudflare's free tier. The firewall rule costs nothing on GCP.

We automated Cloudflare IP range updates with a weekly Cloud Function that fetches the current ranges and updates the firewall rule. Cloudflare rarely changes their ranges, but when they do, we want to catch it within a week — not when a user reports an outage.

## Jump Box Access Pattern

No engineer SSHes directly to production VMs. All access goes through a hardened jump box in the security-vpc:

```
Developer laptop
  → Wireguard VPN (authenticates the developer)
    → Jump box in security-vpc (authenticates the session)
      → Target VM in any VPC (via VPC peering)
```

Three layers of authentication:
1. **Wireguard VPN**: Developer must have a valid VPN peer key (YubiKey-backed)
2. **Jump box SSH**: YubiKey SSH authentication only — no passwords, no regular SSH keys
3. **Target VM SSH**: The jump box's SSH key is the only one authorized on target VMs

Jump box hardening:

```bash
# Session recording — every SSH session is logged
apt install -y script
echo 'script -q /var/log/ssh-sessions/$(whoami)-$(date +%s).log' >> /etc/profile.d/session-record.sh

# Auto-logout after 15 minutes idle
echo "TMOUT=900" >> /etc/profile.d/timeout.sh
echo "readonly TMOUT" >> /etc/profile.d/timeout.sh
echo "export TMOUT" >> /etc/profile.d/timeout.sh

# IP allowlist — only VPN subnet can reach the jump box
ufw allow from 10.10.3.0/24 to any port 22 comment 'SSH from VPN devs'
ufw deny 22 comment 'Block SSH from everywhere else'
```

Session recording is critical for audit compliance. Every keystroke on the jump box is logged. We retain session logs for 90 days. This also deters misuse — engineers know their sessions are recorded.

## Cloud NAT for GKE

GKE pods need outbound internet access (pull container images, call external APIs, send webhooks) but should NOT have public IPs. Cloud NAT provides outbound connectivity through a shared NAT gateway:

```bash
# Create NAT router
gcloud compute routers create nat-router \
  --region=asia-southeast1 \
  --network=app-vpc

# Configure NAT
gcloud compute routers nats create nat-config \
  --router=nat-router \
  --region=asia-southeast1 \
  --auto-allocate-nat-external-ips \
  --nat-all-subnet-ip-ranges \
  --min-ports-per-vm=1024 \
  --max-ports-per-vm=4096
```

The `--min-ports-per-vm` setting is important. Each outbound connection consumes a NAT port. Default is 64, which is insufficient for services that make many external API calls. We set 1024 minimum after hitting port exhaustion during a batch job that called an external API 500 times in parallel.

## Cross-Region Connectivity

VPC peering is regional — traffic between SGP and TYO goes over Google's backbone, not the public internet. Latency between our SGP and TYO subnets is consistently 60-70ms, compared to 80-100ms over the public internet.

For services that need cross-region communication (e.g., database replication), we use Internal TCP/UDP Load Balancers as regional endpoints. This gives us:
- Health checking on the backend (automatic failover)
- A stable IP per region (easier DNS configuration)
- Traffic logging for debugging

```bash
# Internal load balancer for PostgreSQL replication
gcloud compute forwarding-rules create db-ilb-sgp \
  --region=asia-southeast1 \
  --load-balancing-scheme=INTERNAL \
  --network=db-vpc \
  --subnet=db-sgp \
  --ip-protocol=TCP \
  --ports=5432 \
  --backend-service=db-backend-sgp
```

## Terraform: Infrastructure as Code

All of the above is defined in Terraform, not created via the console. Our Terraform structure:

```
terraform/
├── modules/
│   ├── vpc/              # VPC + subnets + peering
│   ├── firewall/         # Firewall rules with priority tiers
│   ├── gke/              # GKE cluster + node pools
│   ├── cloud-nat/        # NAT router + config
│   └── jump-box/         # Jump box VM + hardening
├── environments/
│   ├── production/
│   │   ├── main.tf       # Compose modules
│   │   └── terraform.tfvars
│   └── staging/
│       ├── main.tf
│       └── terraform.tfvars
└── global/
    └── cloudflare-ips.tf  # Cloudflare IP ranges (auto-updated)
```

Every infrastructure change goes through a PR → `terraform plan` in CI → human review → `terraform apply`. No ad-hoc console changes allowed. The Terraform state file is our source of truth for what infrastructure exists.

## Results

- **11 VPCs** with function-based segmentation — consistent security per concern
- **50+ firewall rules** in priority tiers — auditable, understandable, maintainable
- **Cloudflare-only ingress** — zero direct internet exposure, free DDoS protection
- **3 regions** (SGP, TYO, UAE) with 60-70ms inter-region latency
- **Zero unauthorized SSH sessions** in 10 months — jump box pattern works
- **Infrastructure fully codified** in Terraform — every change is reviewed and auditable

## Lessons Learned

**1. VPC peering is limited to 25 peers.** Plan your VPC topology upfront. We have 11 VPCs with ~8 peering connections on the busiest VPC. Splitting a VPC later requires recreating all resources — it's essentially a migration, not a reconfiguration. Draw the topology before creating anything.

**2. Firewall rule priority matters — a lot.** A DENY at priority 100 beats an ALLOW at priority 200. We debugged a connectivity issue for 2 hours before finding a misplaced deny rule at priority 110 that was blocking legitimate inter-VPC traffic. Now we maintain a priority allocation table in our wiki, and every new rule must justify its priority tier in the PR description.

**3. Cloudflare-only ingress is the simplest DDoS mitigation.** One firewall rule, zero cost, massive protection. Every public-facing service should route through Cloudflare (or equivalent). The only reason not to is if you need to expose non-HTTP protocols — in that case, use GCP Cloud Armor instead.

**4. Tag-based firewall rules scale better than IP-based.** Tag your GCE instances (`web-server`, `database`, `monitor`) and write firewall rules against tags. When you scale from 3 to 30 instances, the rules still work. IP-based rules need updating every time you add an instance.

**5. Cloud NAT port exhaustion is a silent killer.** The default 64 ports per VM is laughably low for any service that makes external API calls. Monitor `nat/port_usage` in Cloud Monitoring and set `--min-ports-per-vm` to at least 1024. We didn't learn this until a production batch job failed silently because it couldn't allocate NAT ports for outbound connections.
