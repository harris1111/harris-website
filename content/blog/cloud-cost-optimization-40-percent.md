---
title: "How We Cut AWS Cloud Costs by 40%"
date: "2025-07-05"
tags: ["aws", "cost-optimization", "kubernetes", "keda"]
description: "Instance right-sizing, spot nodes, and KEDA scale-to-zero reduced our monthly bill by 40%"
published: true
---

# How We Cut AWS Cloud Costs by 40%

Our AWS bill was growing faster than our revenue. After a focused optimization sprint, we reduced costs by 40% without sacrificing performance.

## The Audit

First step: understand where money goes. We used AWS Cost Explorer and tagged everything.

| Category | Before | After | Savings |
|----------|--------|-------|---------|
| EC2/EKS Compute | $3,200 | $1,800 | 44% |
| RDS/Database | $800 | $650 | 19% |
| Data Transfer | $400 | $350 | 12% |
| **Total** | **$4,400** | **$2,800** | **36%** |

Plus eliminating the Jenkins instance ($150) and reducing NAT Gateway costs ($100) = **~40% total.**

## Strategy 1: Instance Right-Sizing

Most instances were over-provisioned — running t3.xlarge when t3.medium was sufficient.

Process:
1. Enable CloudWatch detailed monitoring (1-minute intervals)
2. Observe CPU/memory for 2 weeks during peak and off-peak
3. Right-size: if peak CPU < 40%, downsize one tier

```bash
# Check average CPU across fleet
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --period 3600 \
  --statistics Average \
  --start-time 2025-06-01 \
  --end-time 2025-06-14
```

Result: 6 out of 10 instances downsized. Zero performance impact.

## Strategy 2: Spot Nodes for EKS

Non-critical workloads (staging, batch jobs, CI runners) moved to spot instances:

```yaml
# EKS managed node group with spot
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
managedNodeGroups:
  - name: spot-workers
    instanceTypes: [t3.large, t3.xlarge, t3a.large]
    spot: true
    minSize: 0
    maxSize: 10
    labels:
      node-type: spot
    taints:
      - key: spot
        value: "true"
        effect: NoSchedule
```

Workloads that tolerate spot must explicitly tolerate the taint. Production stays on on-demand.

## Strategy 3: KEDA Scale-to-Zero

The biggest win. Most staging services sit idle 90% of the time.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: staging-api
spec:
  scaleTargetRef:
    name: staging-api
  minReplicaCount: 0  # Scale to zero!
  maxReplicaCount: 3
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: http_requests_total
        query: sum(rate(http_requests_total{service="staging-api"}[2m]))
        threshold: "5"
```

When no traffic → 0 pods. First request triggers scale-up (~15 seconds cold start). Acceptable for staging.

## Strategy 4: Reserved Instances for Databases

RDS instances run 24/7 — perfect for reserved pricing:
- 1-year reserved, partial upfront: 30% discount
- Applied to production PostgreSQL and MongoDB

## Results

- **40% monthly cost reduction** ($4,400 → $2,800)
- Zero performance degradation in production
- Staging cold starts: 15s (acceptable trade-off)
- Spot interruption rate: ~5% (handled gracefully by K8s rescheduling)

## Lessons

1. **Measure before optimizing.** Without CloudWatch data, we would have guessed wrong about which instances to downsize.
2. **Spot instances need graceful shutdown.** Handle SIGTERM properly — you get 2 minutes warning before spot reclamation.
3. **KEDA + staging = free money.** Scale-to-zero for non-production is the lowest-effort, highest-impact optimization.
