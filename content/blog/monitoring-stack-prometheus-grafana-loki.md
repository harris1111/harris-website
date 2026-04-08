---
title: "Building an Observability Stack: Prometheus, Grafana, Loki, and Alloy"
date: "2025-11-20"
tags: ["monitoring", "prometheus", "grafana", "loki", "observability"]
description: "How we built a monitoring stack that reduced MTTR by 30% with custom LogQL queries and S3 archival"
published: true
---

# Building an Observability Stack: Prometheus, Grafana, Loki, and Alloy

Monitoring isn't optional. We learned this the hard way — our first production incident took 4 hours to diagnose because we had no centralized logging. A microservice was silently OOM-killing every 20 minutes, restarting, and losing its in-memory state. Kubernetes kept it "healthy" because the pod restarted successfully. Users saw intermittent errors. We had no logs, no metrics, no alerts. Just a Slack channel filling up with "is the API down again?"

That incident was the catalyst for building a proper observability stack. This post covers the architecture, the tool choices, the custom queries that actually caught incidents, and the operational lessons from running it for 8 months.

## The Three Pillars

Observability has three pillars: metrics (what happened), logs (why it happened), and traces (where it happened). We started with metrics and logs — they cover 95% of debugging needs. Traces are on our roadmap but weren't urgent for our scale.

```
                          ┌─────────────────────────┐
                          │       Grafana            │
                          │  Dashboards + Alerts     │
                          └──────┬──────┬───────────┘
                                 │      │
                    ┌────────────┘      └────────────┐
                    │                                │
              ┌─────┴──────┐                  ┌──────┴─────┐
              │ Prometheus  │                  │    Loki    │
              │  (metrics)  │                  │   (logs)   │
              └─────┬──────┘                  └──────┬─────┘
                    │                                │
              ┌─────┴────────────────────────────────┴─────┐
              │              Grafana Alloy                   │
              │    (unified collector — metrics + logs)      │
              └─────────────────┬───────────────────────────┘
                                │
         ┌──────────┬───────────┼───────────┬──────────┐
         │          │           │           │          │
      K8s pods   Nginx      System      ArgoCD     VMs
      stdout     access     journals    sync       node-
      stderr     errors                 status     exporter
```

## Why Alloy Over Promtail

Grafana Alloy (formerly Grafana Agent) replaced both Promtail (log collector) and the Prometheus scrape config. One binary handles:

- **Log collection**: Tails container stdout/stderr, system journals, and log files
- **Metrics scraping**: Acts as a Prometheus remote-write proxy, scraping targets and forwarding to Prometheus
- **Label enrichment**: Adds Kubernetes metadata (pod name, namespace, deployment) to both logs and metrics

Before Alloy, we ran Promtail for logs AND configured Prometheus to scrape targets directly. Two configs to maintain, two processes to monitor, two failure modes. Alloy unified this.

```river
// alloy config — /etc/alloy/config.alloy

// Discover Kubernetes pods
discovery.kubernetes "pods" {
  role = "pod"
}

// Scrape pod metrics
prometheus.scrape "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.default.receiver]
}

// Collect pod logs
loki.source.kubernetes "pods" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [loki.write.default.receiver]
}

// Send metrics to Prometheus
prometheus.remote_write "default" {
  endpoint {
    url = "http://prometheus:9090/api/v1/write"
  }
}

// Send logs to Loki
loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```

## What We Monitor

### Metrics (Prometheus)

We scrape ~150 metric endpoints across the infrastructure:

**Infrastructure metrics:**
- Container CPU/memory/network via cAdvisor (built into kubelet)
- Kubernetes pod state via kube-state-metrics (pending, running, failed, evicted)
- Node health via node-exporter (CPU, RAM, disk, network, filesystem)
- ZFS pool health on Proxmox host (capacity, scrub errors, read/write IOPS)

**Application metrics:**
- HTTP request latency histograms (p50, p95, p99) per service
- Request count by status code (2xx, 4xx, 5xx)
- Database connection pool utilization
- Queue depth and processing rate for async workers

**Platform metrics:**
- ArgoCD sync status and duration per application
- Wireguard peer handshake times and transfer bytes
- cert-manager certificate expiry countdown
- Proxmox VM resource allocation vs. actual usage

Total metric series: ~45,000. Prometheus scrape interval: 15 seconds. Storage retention: 30 days local, then downsampled to S3.

### Logs (Loki)

Every log line from every service, centralized and searchable:

- All pod stdout/stderr via Alloy's Kubernetes log discovery
- Nginx access logs (JSON format — critical for LogQL queries)
- Nginx error logs
- System journals from all 28 VMs (sshd, fail2ban, kernel, systemd)
- Proxmox task logs (VM starts, stops, migrations)
- ArgoCD sync logs

We enforce JSON structured logging in all our application services. This is the single most impactful decision we made — structured logs make LogQL queries 10x more powerful.

```javascript
// Good — structured JSON log
logger.info({ event: "order_created", orderId: "abc123", userId: "user456", amount: 99.99, duration_ms: 45 });
// Output: {"level":"info","event":"order_created","orderId":"abc123","userId":"user456","amount":99.99,"duration_ms":45,"timestamp":"2025-11-20T10:30:00Z"}

// Bad — unstructured string log
console.log(`Order abc123 created for user user456, amount $99.99, took 45ms`);
// Good luck parsing this with LogQL
```

## Custom LogQL Queries That Actually Caught Incidents

LogQL is Loki's query language — think PromQL but for logs. Here are the queries pinned to our Grafana dashboards that have caught real incidents:

### Error Rate by Service (Caught: cascading failure across 3 services)

```logql
# Error rate by service in the last hour
sum(rate({namespace="production"} |= "error" [1h])) by (app)
```

This caught a cascading failure: one service's database connection pool exhausted, causing timeout errors that propagated to two downstream services. We saw the error rate spike in the upstream service 3 minutes before the downstream effects.

### Slow Requests (Caught: unindexed query causing 30s timeouts)

```logql
# Requests taking more than 2 seconds
{app="api-gateway"} | json | response_time > 2000
  | line_format "{{.method}} {{.path}} took {{.response_time}}ms"
```

This caught an unindexed MongoDB query that was doing a collection scan on a 2M-document collection. Response times went from 50ms to 30 seconds. The LogQL query showed us exactly which endpoint and which query parameters triggered the slow path.

### OOM Kills (Caught: memory leak in worker service)

```logql
# OOM kills with pod identification
{job="kubelet"} |= "OOMKilled"
  | line_format "{{.pod}} killed at {{.timestamp}}"
```

A Go worker service had a goroutine leak — each webhook handler spawned a goroutine that never terminated if the downstream service was unavailable. Over 8 hours, memory grew from 128MB to the 512MB limit, then OOM killed. This query alerted us after the second kill, and the log line told us exactly which pod.

### Failed Login Attempts (Security: brute-force SSH attempt from unknown IP)

```logql
# Failed SSH logins across all VMs
{job="systemd-journal"} |= "Failed password" OR |= "Invalid user"
  | pattern `<_> from <ip> port <_>`
  | count_over_time({job="systemd-journal"} |= "Failed password" [5m]) by (ip) > 10
```

This caught a brute-force SSH attempt from an IP outside our VPN range. The attacker was hitting our monitoring VM (which had a misconfigured firewall rule allowing SSH from a wider range than intended). We fixed the firewall rule and added the IP to fail2ban within 15 minutes.

## Alert Rules

We follow a strict alerting philosophy: **alert on symptoms, not causes.** Users don't care that CPU is high — they care that the API is slow.

```yaml
groups:
  - name: critical-symptoms
    rules:
      # Users experiencing errors
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5% for {{ $labels.service }}"
          runbook: "https://wiki.internal/runbooks/high-error-rate"

      # Users experiencing slowness
      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency above 2s for {{ $labels.service }}"

  - name: infrastructure
    rules:
      # Disk filling up (12 hours to full at current rate)
      - alert: DiskFillingUp
        expr: |
          predict_linear(node_filesystem_avail_bytes[6h], 12*3600) < 0
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.instance }} disk will be full in ~12 hours"

      # Certificate expiring soon
      - alert: CertExpiringSoon
        expr: certmanager_certificate_expiration_timestamp_seconds - time() < 7*24*3600
        labels:
          severity: warning
        annotations:
          summary: "Certificate {{ $labels.name }} expires in less than 7 days"

      # ArgoCD application out of sync
      - alert: ArgoCDOutOfSync
        expr: argocd_app_info{sync_status="OutOfSync"} == 1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.name }} has been OutOfSync for 15 minutes"
```

Alert routing: critical alerts go to Slack + PagerDuty. Warnings go to Slack only. We use Grafana's built-in alerting (not Alertmanager) because it's simpler and integrates with our Grafana dashboards natively.

## S3 Log Archival

Loki has a 7-day default retention — fast to query, reasonable storage cost. But for compliance and post-mortems, we need logs older than 7 days. We archive to S3 with lifecycle policies:

- **Days 1-7**: Loki (real-time queryable)
- **Days 1-30**: S3 Standard (archived, queryable with effort)
- **Days 30-90**: S3 Glacier (cold archive, for compliance)
- **Day 90+**: Deleted

Alloy ships logs to both Loki (real-time) and S3 (archive) simultaneously. The S3 output uses daily partitioned paths:

```
s3://logs-archive/
├── 2025/11/20/
│   ├── production-api-gateway.json.gz
│   ├── production-user-service.json.gz
│   └── ...
├── 2025/11/21/
└── ...
```

Cost: ~$2/month for our log volume (~5GB/day compressed). Trivial compared to the debugging time it saves during post-mortems.

## Dashboards That People Actually Use

We built 8 dashboards, but only 3 get daily use:

**1. Service Health Overview** — The "morning check" dashboard. Shows error rates, latency percentiles, and pod counts for every production service on one screen. Green/yellow/red status boxes. Takes 10 seconds to scan.

**2. Kubernetes Cluster** — Node resource utilization, pod distribution, pending pods, eviction events. Used during capacity planning and when investigating scheduling issues.

**3. Log Explorer** — Full-text search across all log streams with Loki. This is where we spend 80% of debugging time. Pre-built filters for error, warning, and specific services.

The other 5 dashboards (network, database, ArgoCD, Wireguard, Proxmox host) are consulted during specific investigations, not daily.

## Results After 8 Months

- **MTTR reduced by 30%** — from ~4 hours to ~2.5 hours average incident resolution
- **Zero blind spots** — every service, every VM, every network link has metrics and logs
- **Proactive alerting** — caught 3 incidents before users noticed (memory leak, disk filling, certificate expiry)
- **Post-mortem quality improved** — S3 archives let us trace issues back weeks, not days
- **On-call confidence** — engineers actually trust the dashboards. "Check Grafana" is the first step in every incident, not "SSH into the server and grep logs."

## Lessons Learned

**1. Start with alerts, not dashboards.** A beautiful dashboard that nobody watches is useless. We defined our alert rules first (what symptoms matter?), then built dashboards to investigate those alerts. This ensures every dashboard panel answers a question someone actually asks during an incident.

**2. Structured logging (JSON) makes LogQL queries 10x easier.** Enforce it in your application framework from day one. Retrofitting structured logging onto existing services is painful — do it upfront. We made JSON logging the default in our service template, so new services get it automatically.

**3. Label cardinality kills Prometheus.** We learned this the hard way — someone added `user_id` as a metric label on the auth service. With 50,000 unique users, that created 50,000 time series per metric. Prometheus memory spiked to 12GB and scrapes started timing out. Rule: labels must have bounded cardinality (service name, HTTP method, status code — not user ID, request ID, or session token).

**4. Alert on symptoms, not causes.** "CPU > 80%" is a cause. "API latency > 2s" is a symptom. Users experience symptoms. Alert on what users experience, then use metrics and logs to find the cause. This reduces alert fatigue dramatically — we went from ~20 alerts/week to ~4.

**5. Two-week burn-in for new alerts.** Every new alert rule spends 2 weeks in "silent mode" — it fires but only logs, doesn't notify. This catches noisy alerts before they desensitize the team. If an alert fires more than once a day during burn-in, it needs a higher threshold or better targeting.
