---
title: "Building an Observability Stack: Prometheus, Grafana, Loki, and Alloy"
date: "2025-11-20"
tags: ["monitoring", "prometheus", "grafana", "loki", "observability"]
description: "How we built a monitoring stack that reduced MTTR by 30% with custom LogQL queries and S3 archival"
published: true
---

# Building an Observability Stack: Prometheus, Grafana, Loki, and Alloy

Monitoring isn't optional. After our first production incident took 4 hours to diagnose because we had no centralized logging, we built a proper observability stack.

## Architecture

```
Applications → Alloy (collector) → Prometheus (metrics)
                                  → Loki (logs)
                                  → Grafana (dashboards + alerts)
                                  → S3 (log archival, 30-day retention)
```

We chose Alloy over Promtail because it handles both metrics scraping and log collection in a single binary.

## What We Monitor

**Metrics (Prometheus):**
- Container CPU/memory/network (cAdvisor)
- Kubernetes pod state (kube-state-metrics)
- Node health (node-exporter)
- Application latency (custom histograms)
- ArgoCD sync status

**Logs (Loki):**
- All pod stdout/stderr via Alloy
- Nginx access/error logs
- System journals from VMs

## Custom LogQL Queries

The real power is in LogQL. Our most useful queries:

```logql
# Error rate by service in last hour
sum(rate({namespace="production"} |= "error" [1h])) by (app)

# Slow requests (>2s response time)
{app="api-gateway"} | json | response_time > 2000

# OOM kills
{job="kubelet"} |= "OOMKilled" | line_format "{{.pod}} killed at {{.timestamp}}"
```

## Alert Rules

```yaml
groups:
  - name: critical
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5% for {{ $labels.service }}"
```

## S3 Log Archival

Loki has a 7-day default retention. For compliance and post-mortems, we archive to S3:

- Alloy ships logs to both Loki (real-time) and S3 (archive)
- S3 lifecycle policy: 30 days standard → 90 days glacier → delete
- Cost: ~$2/month for our volume

## Results

- **MTTR reduced by 30%** — from ~4 hours to ~2.5 hours average
- **Zero blind spots** — every service has metrics and logs
- **Proactive alerting** — caught 3 incidents before users noticed

## Lessons

1. **Start with alerts, not dashboards.** A beautiful dashboard nobody watches is useless.
2. **Structured logging (JSON)** makes LogQL queries 10x easier. Enforce it in your app framework.
3. **Label cardinality kills Prometheus.** We learned this the hard way — don't use user IDs as labels.
