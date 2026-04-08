---
title: "How We Cut AWS Cloud Costs by 40%"
date: "2025-07-05"
tags: ["aws", "cost-optimization", "kubernetes", "keda"]
description: "Instance right-sizing, spot nodes, and KEDA scale-to-zero reduced our monthly bill by 40%"
published: true
---

# How We Cut AWS Cloud Costs by 40%

Our AWS bill was growing faster than our revenue. Every quarter, the finance team would flag the increasing cloud spend, and every quarter the engineering response was the same: "We need it for production." Nobody questioned whether we actually needed a `t3.xlarge` running 24/7 for a staging service that receives traffic 8 hours a day.

After a focused 3-week optimization sprint, we reduced monthly cloud costs by 40% — from $4,400 to $2,800 — without sacrificing production performance. This is a detailed account of every optimization we made, the data that justified each decision, and the trade-offs we accepted.

## Step Zero: The Audit

You can't optimize what you don't measure. Before touching any infrastructure, we spent the first week understanding where money goes.

**Tooling**:
- AWS Cost Explorer with daily granularity and tag-based filtering
- AWS Trusted Advisor for quick right-sizing recommendations
- CloudWatch detailed monitoring (1-minute intervals) on all EC2 instances
- A spreadsheet tracking every resource, its purpose, and its monthly cost

**Tagging strategy**: We tagged every resource with `team`, `environment`, and `service`. Untagged resources went into a "mystery" bucket that we investigated one by one. We found 3 orphaned EBS volumes ($45/month), 2 unused Elastic IPs ($15/month), and an RDS snapshot from 2023 that cost $12/month. Quick wins before the real optimization began.

After 2 weeks of data collection, our cost breakdown:

| Category | Monthly Cost | % of Total | Notes |
|----------|-------------|------------|-------|
| EC2/EKS Compute | $3,200 | 73% | 10 instances + 3 EKS node groups |
| RDS/Databases | $800 | 18% | 2 RDS instances (PostgreSQL, MongoDB on Atlas) |
| Data Transfer | $400 | 9% | NAT Gateway + cross-AZ traffic |
| Other (S3, Route53, etc.) | $100 | 2% | Negligible |
| **Total** | **$4,400** | **100%** | |

73% of our bill was compute. That's where the optimization potential was.

## Strategy 1: Instance Right-Sizing

The biggest category of waste: over-provisioned instances. Engineers tend to choose "safe" instance sizes — bigger than needed, because downsizing a running service feels risky while upsizing feels proactive. The result is a fleet where most instances use 15-25% of their allocated resources.

### The Process

1. **Enable CloudWatch detailed monitoring** on all EC2 instances (1-minute intervals instead of 5-minute). This costs ~$3.50/month per instance but gives much more accurate peak detection.

2. **Observe for 2 full weeks** during both peak and off-peak hours. One week isn't enough — you'll miss weekly patterns (Monday morning traffic spikes, Friday afternoon batch jobs, weekend lulls).

3. **Right-size rule**: If peak CPU averaged over any 1-hour window stays below 40%, downsize one tier. If peak memory stays below 50%, downsize.

```bash
# Pull 2-week CPU averages for all instances
for instance_id in $(aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text); do
  avg_cpu=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=${instance_id} \
    --period 3600 \
    --statistics Average Maximum \
    --start-time $(date -d '14 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date +%Y-%m-%dT%H:%M:%S) \
    --query 'Datapoints[].{Avg:Average,Max:Maximum}' \
    --output json)
  echo "${instance_id}: ${avg_cpu}"
done
```

### The Results

| Instance | Before | Peak CPU | Peak RAM | After | Monthly Savings |
|----------|--------|----------|----------|-------|----------------|
| api-prod | t3.xlarge | 32% | 45% | t3.large | $67 |
| api-staging | t3.xlarge | 8% | 20% | t3.medium | $100 |
| worker-prod | t3.large | 25% | 35% | t3.medium | $34 |
| worker-staging | t3.large | 5% | 12% | t3.small | $51 |
| admin-panel | t3.large | 12% | 18% | t3.medium | $34 |
| monitoring | t3.xlarge | 28% | 60% | t3.large | $67 |

6 out of 10 instances downsized. Two instances (the production database proxy and the CI runner) were already right-sized. Two were over-provisioned but handled bursty workloads — we left them for now and addressed them with auto-scaling later.

**Total savings from right-sizing: $353/month.**

Zero performance impact. We monitored CloudWatch alarms for 2 weeks after each downsize. Not a single alarm fired. The services literally didn't notice the smaller instances.

### The Psychology Lesson

The hardest part wasn't technical — it was convincing engineers that downsizing was safe. "But what if we get a traffic spike?" The data showed that our "spikes" used 40% of the oversized instance — meaning they'd use 80% of the right-sized instance. Still fine. We established a rule: **if peak usage exceeds 70% for more than 30 minutes after downsizing, we upsize immediately, no questions asked.** This safety net made the team comfortable. We never triggered it.

## Strategy 2: Spot Instances for Non-Critical Workloads

AWS Spot instances are spare EC2 capacity sold at up to 90% discount. The catch: AWS can reclaim them with 2 minutes notice. Perfect for workloads that can tolerate interruption.

We moved three categories to spot:

**1. Staging environment (all services)**
Staging is used during business hours and doesn't need 99.99% uptime. If a spot reclamation interrupts a staging deployment, the developer just retries.

**2. CI/CD runners**
Build jobs are idempotent — if a spot instance disappears mid-build, the build fails and retries on a new instance. We already handle flaky builds; spot reclamation is just another failure mode.

**3. Batch processing jobs**
Our nightly data aggregation jobs run for 2-3 hours. If interrupted, they checkpoint progress and resume. We designed them for exactly this scenario.

```yaml
# EKS managed node group with spot instances
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: our-cluster
  region: ap-southeast-1
managedNodeGroups:
  # Production: on-demand only (no spot risk)
  - name: prod-workers
    instanceTypes: [t3.large]
    minSize: 2
    maxSize: 6
    labels:
      node-type: on-demand
      environment: production

  # Spot: staging, CI, batch jobs
  - name: spot-workers
    instanceTypes: [t3.large, t3.xlarge, t3a.large, t3a.xlarge]
    spot: true
    minSize: 0
    maxSize: 10
    labels:
      node-type: spot
      environment: non-production
    taints:
      - key: spot
        value: "true"
        effect: NoSchedule
```

The taint `spot=true:NoSchedule` ensures only workloads that explicitly tolerate spot run on spot nodes. Production pods will never be scheduled on spot instances accidentally.

Workloads opt in to spot by adding a toleration:

```yaml
# Staging deployment — tolerates spot
spec:
  template:
    spec:
      tolerations:
        - key: spot
          operator: Equal
          value: "true"
          effect: NoSchedule
      nodeSelector:
        node-type: spot
```

**Multiple instance types are critical.** We specify 4 instance types (`t3.large`, `t3.xlarge`, `t3a.large`, `t3a.xlarge`). If one type is unavailable (capacity pool exhausted), EKS picks another. Single-type spot groups have much higher interruption rates.

**Handling spot interruptions gracefully**: Kubernetes already handles node failures — when a spot instance is reclaimed, the node becomes `NotReady`, pods are evicted, and Kubernetes reschedules them on available nodes. We added a `terminationGracePeriodSeconds: 120` to all staging deployments so pods get the full 2-minute warning to shut down cleanly.

**Spot savings: ~$800/month** (60-70% discount on ~$1,200 of non-production compute).

Spot interruption rate over 4 months: ~5%. Kubernetes handled every interruption automatically — rescheduled pods within 30 seconds of node reclamation.

## Strategy 3: KEDA Scale-to-Zero

This was the single biggest win. Most staging and development services sit idle 90% of the time. KEDA (Kubernetes Event-Driven Autoscaling) scales pods to zero when there's no traffic, and scales back up when the first request arrives.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: staging-api
  namespace: staging
spec:
  scaleTargetRef:
    name: staging-api
  minReplicaCount: 0      # Scale to zero when idle
  maxReplicaCount: 3       # Scale up to 3 under load
  cooldownPeriod: 300      # Wait 5 min of no traffic before scaling down
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: http_requests_total
        query: sum(rate(http_requests_total{service="staging-api"}[2m]))
        threshold: "5"     # Scale up if >5 req/sec over 2 min
```

**How it works**:
1. Staging API has zero pods running (idle)
2. Developer sends a request to staging
3. Request hits the Kubernetes Service — no backends available
4. KEDA detects the metric (request count) and scales to 1 pod
5. Pod starts in ~15 seconds (container pull + app startup)
6. Request is served (developer waits 15 seconds for the first response)
7. After 5 minutes of no traffic, KEDA scales back to zero

**The 15-second cold start trade-off**: Staging services take 15 seconds to become available after being idle. We communicated this to the team upfront: "Staging has a 15-second cold start. This saves us $500/month. Is that acceptable?" Universal yes.

We applied KEDA scale-to-zero to 8 staging services and 3 development services:

| Service | Idle Time | Before (pods 24/7) | After (KEDA) | Savings |
|---------|-----------|--------------------|--------------| --------|
| staging-api | 85% idle | 2 pods | 0-2 pods | ~$120/mo |
| staging-worker | 90% idle | 2 pods | 0-2 pods | ~$120/mo |
| staging-frontend | 80% idle | 1 pod | 0-1 pod | ~$50/mo |
| dev-api (×3) | 95% idle | 1 pod each | 0-1 each | ~$150/mo |
| dev-worker (×2) | 95% idle | 1 pod each | 0-1 each | ~$80/mo |
| **Total** | | | | **~$520/mo** |

## Strategy 4: Reserved Instances for Databases

RDS instances run 24/7 with consistent, predictable load — the ideal candidate for reserved pricing. We committed to 1-year reserved instances with partial upfront payment:

| Database | Instance | On-Demand | Reserved (1yr) | Savings |
|----------|----------|-----------|----------------|---------|
| PostgreSQL (prod) | db.t3.large | $135/mo | $95/mo | $40/mo |
| PostgreSQL (staging) | db.t3.medium | $68/mo | $48/mo | $20/mo |

We chose 1-year over 3-year commitments because our database needs might change. The 30% discount on 1-year is sufficient; the 50% on 3-year isn't worth the lock-in risk.

**Reserved savings: $60/month.**

## Strategy 5: NAT Gateway Cost Reduction

NAT Gateway charges $0.045/GB for data processed. Our EKS pods pulling container images, calling external APIs, and downloading dependencies generated ~$150/month in NAT charges.

Two optimizations:

**1. VPC endpoints for AWS services**: S3, ECR, CloudWatch, and STS traffic no longer goes through NAT Gateway:

```bash
# S3 Gateway endpoint (free)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxx \
  --service-name com.amazonaws.ap-southeast-1.s3 \
  --route-table-ids rtb-xxx

# ECR Interface endpoint ($7.30/month but saves more in NAT charges)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-xxx \
  --service-name com.amazonaws.ap-southeast-1.ecr.api \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-xxx
```

**2. Container image caching**: We deployed a pull-through cache registry. Pods pull from the local cache first — only cache misses go through NAT to public registries.

**NAT savings: ~$100/month.**

## Final Results Summary

| Strategy | Monthly Savings | Effort | Risk |
|----------|----------------|--------|------|
| Instance right-sizing | $353 | Low (resize instances) | Very low |
| Spot instances | $800 | Medium (node groups + taints) | Low (non-prod only) |
| KEDA scale-to-zero | $520 | Medium (KEDA setup + testing) | Low (staging cold start) |
| Jenkins elimination | $150 | Already done (Tekton migration) | None |
| Reserved instances | $60 | Low (AWS console) | Low (1-year commitment) |
| NAT optimization | $100 | Low (VPC endpoints) | None |
| Orphaned resources | $72 | Low (delete unused) | None |
| **Total** | **~$2,055/mo** | | |

**Before: $4,400/month. After: ~$2,345/month. Actual savings: ~47%.**

The "40%" in the title is conservative — we rounded down because some savings fluctuate monthly (spot pricing varies, KEDA savings depend on usage patterns). On average, the bill consistently stays between $2,300-$2,800.

## The Savings Dashboard

We built a Grafana dashboard that tracks cloud costs in near-real-time using AWS Cost Explorer API:

```bash
# Daily cost check (runs via cron, pushes to Prometheus)
aws ce get-cost-and-usage \
  --time-period Start=$(date -d 'yesterday' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=environment \
  --output json
```

The dashboard shows:
- Daily spend by environment (production vs. staging vs. dev)
- Month-to-date running total with projection to month-end
- Spot vs. on-demand breakdown
- KEDA pod-hours saved (pods that would be running without scale-to-zero)
- Alert when daily spend exceeds 120% of 30-day rolling average

The cost alert has already caught two incidents: a runaway batch job that spawned 50 pods (caught within 4 hours), and a forgotten load test that left 10 staging replicas running for a weekend.

## Lessons Learned

**1. Measure before optimizing.** Without 2 weeks of CloudWatch data, we would have guessed wrong about which instances to downsize. The admin panel instance "felt" heavily used but averaged 12% CPU. The monitoring instance "felt" idle but peaked at 60% memory during scrape cycles. Data beats intuition.

**2. Spot instances need graceful shutdown handling.** AWS gives you a 2-minute warning before spot reclamation. Your pods must handle SIGTERM properly — flush buffers, complete in-flight requests, checkpoint state. A pod that ignores SIGTERM and gets SIGKILL will corrupt data or drop requests.

**3. KEDA + staging = free money.** Scale-to-zero for non-production environments is the lowest-effort, highest-impact optimization available to any team running Kubernetes. The 15-second cold start is a trivial trade-off. If your staging services run 24/7, you're paying for 16 hours of idle compute per day.

**4. VPC endpoints pay for themselves immediately.** The ECR interface endpoint costs $7.30/month but saves ~$30/month in NAT Gateway charges for container image pulls alone. S3 gateway endpoints are free. There's no reason not to deploy them.

**5. Make cost visible to engineers.** Before the Grafana dashboard, cloud costs were an abstract number that only the finance team cared about. After: engineers see the daily burn rate, understand which resources cost what, and proactively flag waste. Visibility drives accountability. We added a daily Slack bot that posts yesterday's spend — the team started self-policing staging resources within a week.
