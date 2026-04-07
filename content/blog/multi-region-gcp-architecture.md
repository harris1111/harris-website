---
title: "Multi-Region GCP Architecture: VPCs, Firewalls, and Jump Boxes"
date: "2025-09-18"
tags: ["gcp", "cloud", "networking", "security"]
description: "Designing multi-region GCP infrastructure with 11 VPCs, 50+ firewall rules, and Cloudflare-only ingress"
published: true
---

# Multi-Region GCP Architecture: VPCs, Firewalls, and Jump Boxes

Our Web3 platform needed presence in Singapore, Tokyo, and UAE. Here's how we structured the GCP infrastructure for security, isolation, and manageability.

## VPC Strategy

11 VPCs segmented by function — not by region. Each VPC spans regions via subnets:

| VPC | Purpose | Subnets |
|-----|---------|---------|
| app-vpc | Application workloads | SGP, TYO, UAE |
| db-vpc | Databases (PostgreSQL, MongoDB, Redis) | SGP, TYO |
| monitor-vpc | Prometheus, Grafana, Loki | SGP |
| security-vpc | Vault, jump boxes | SGP |
| build-vpc | CI/CD runners | SGP |

Why not one VPC per region? Function-based VPCs let us apply consistent firewall policies per concern. A database firewall rule applies to ALL database subnets regardless of region.

## Firewall Architecture

50+ rules organized in priority tiers:

```
Priority 100-199: DENY rules (block known bad patterns)
Priority 200-299: Cloudflare-only ingress (ALLOW source ranges)
Priority 300-399: Internal service-to-service
Priority 400-499: Monitoring and health checks
Priority 900-999: Default deny-all
```

### Cloudflare-Only Ingress

No direct internet access to our load balancers. All traffic must pass through Cloudflare:

```bash
# Cloudflare IP ranges as source
gcloud compute firewall-rules create allow-cloudflare-https \
  --network=app-vpc \
  --allow=tcp:443 \
  --source-ranges="173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,..." \
  --target-tags=web-server \
  --priority=200
```

This blocks direct IP access, preventing DDoS bypass.

## Jump Box Access Pattern

No SSH directly to production VMs. All access through a hardened jump box:

```
Developer → Wireguard VPN → Jump Box (security-vpc) → Target VM
```

Jump box rules:
- YubiKey SSH only (no password, no regular keys)
- Session recording via `script` command
- Auto-logout after 15 minutes idle
- IP allowlist (VPN subnet only)

## Cloud NAT

GKE pods need outbound internet (pull images, call APIs) but shouldn't have public IPs:

```bash
gcloud compute routers create nat-router --region=asia-southeast1 --network=app-vpc
gcloud compute routers nats create nat-config \
  --router=nat-router \
  --region=asia-southeast1 \
  --auto-allocate-nat-external-ips \
  --nat-all-subnet-ip-ranges
```

## Lessons

1. **VPC peering is limited to 25 peers.** Plan your VPC topology upfront — splitting later is painful.
2. **Firewall rule priority matters.** A DENY at priority 100 beats an ALLOW at 200. We debugged a connectivity issue for 2 hours before finding a misplaced deny rule.
3. **Cloudflare-only ingress is the simplest DDoS mitigation.** Zero cost, massive protection.
4. **Tag-based firewall rules** are easier to manage than IP-based. Tag your instances (`web-server`, `database`, `monitor`) and write rules against tags.
