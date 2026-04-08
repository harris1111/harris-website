---
title: "GitOps at Scale: Managing 42+ ArgoCD Applications"
date: "2026-01-10"
tags: ["gitops", "argocd", "kubernetes", "helm"]
description: "How we designed a centralized Helm chart system for 32+ microservices"
published: true
---

# GitOps at Scale: Managing 42+ ArgoCD Applications

Managing Kubernetes manifests for 32+ microservices across 4 projects gets complex fast. Every team had their own Helm charts, their own value files, their own conventions for resource limits and health checks. Some services had HPA, some didn't. Some used Ingress, some used raw Services with NodePort. It was a mess hiding behind "it works."

Here's how we tamed it with a centralized Helm chart, a strict value hierarchy, and ArgoCD ApplicationSets that auto-discover new services.

## The Problem in Detail

When I audited our Kubernetes setup, I found:

- **32+ microservices** across 4 projects, each with its own Helm chart (or worse, raw YAML manifests)
- **4 environments** per project (dev, staging, production, and one project had a "demo" env)
- Values scattered across repositories — some in the app repo, some in a deploy repo, some in a wiki page
- No consistent resource limits. One service requested 4GB memory for a Go binary that used 50MB
- No consistent security policies — half the pods ran as root
- Deploying a new microservice took 2-3 hours of copying and adapting Helm boilerplate

The breaking point: we discovered a staging service had been using the production database connection string for 3 weeks. Nobody noticed because each service managed its own secrets differently.

## Solution: One Chart to Rule Them All

Instead of per-service Helm charts, we built ONE centralized chart with a 3-tier value hierarchy. The chart contains every Kubernetes resource a service could need — Deployment, Service, Ingress, HPA, PDB, ServiceAccount, ConfigMap. Services opt in to what they need via their values file.

```
centralized-chart/
├── Chart.yaml
├── templates/
│   ├── _helpers.tpl           # Naming conventions, labels
│   ├── deployment.yaml        # Always created
│   ├── service.yaml           # Always created
│   ├── ingress.yaml           # Created if ingress.enabled=true
│   ├── hpa.yaml               # Created if autoscaling.enabled=true
│   ├── pdb.yaml               # Created if pdb.enabled=true
│   ├── serviceaccount.yaml    # Created if serviceAccount.create=true
│   └── configmap.yaml         # Created if configMap is defined
└── values/
    ├── _defaults.yaml           # Tier 1: Global defaults
    ├── project-alpha/
    │   ├── _project.yaml        # Tier 2: Project overrides
    │   ├── api-gateway.yaml     # Tier 3: Service-specific
    │   ├── user-service.yaml
    │   └── notification.yaml
    ├── project-beta/
    │   ├── _project.yaml
    │   ├── indexer.yaml
    │   └── query-engine.yaml
    └── project-gamma/
        ├── _project.yaml
        └── web-frontend.yaml
```

### The 3-Tier Value Hierarchy

Values resolve in this priority order:

```
Tier 3 (service-specific) > Tier 2 (project defaults) > Tier 1 (global defaults)
```

**Tier 1 — Global Defaults** (`_defaults.yaml`):

```yaml
# Every service gets these unless overridden
replicaCount: 2
image:
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
livenessProbe:
  httpGet:
    path: /healthz
    port: http
  initialDelaySeconds: 10
  periodSeconds: 15
readinessProbe:
  httpGet:
    path: /readyz
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10
autoscaling:
  enabled: false
pdb:
  enabled: true
  minAvailable: 1
```

This is where we enforce organizational standards. Every pod runs as non-root with a read-only filesystem. Every pod has health checks. Every service with 2+ replicas gets a PodDisruptionBudget.

**Tier 2 — Project Defaults** (`project-alpha/_project.yaml`):

```yaml
# All project-alpha services share these
image:
  registry: ghcr.io/orochi-network
namespace: alpha-production
ingress:
  className: traefik
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    traefik.ingress.kubernetes.io/router.middlewares: alpha-ratelimit@kubernetescrd
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 512Mi
```

Projects can override global defaults — for example, project-alpha services generally need more memory than the global default.

**Tier 3 — Service-Specific** (`project-alpha/api-gateway.yaml`):

```yaml
# Only this service needs these overrides
image:
  repository: api-gateway
  tag: "v2.4.1"
replicaCount: 3
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 1Gi
ingress:
  enabled: true
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
env:
  - name: LOG_LEVEL
    value: "info"
  - name: DB_HOST
    valueFrom:
      secretKeyRef:
        name: alpha-db-credentials
        key: host
```

**Adding a new microservice = one YAML file with only the differences from project defaults.** A minimal service values file can be as short as 5 lines:

```yaml
image:
  repository: notification-worker
  tag: "v1.0.0"
replicaCount: 1
autoscaling:
  enabled: false
```

## ArgoCD ApplicationSets: Auto-Discovery

The magic of this architecture is that ArgoCD auto-discovers new services. We use a Git directory generator that watches for new value files:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: all-services
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/org/deploy-config
        revision: main
        directories:
          - path: "values/*/[!_]*"    # Match service files, skip _defaults and _project
  template:
    metadata:
      name: "{{path.basename}}"
    spec:
      project: default
      source:
        repoURL: https://github.com/org/deploy-config
        targetRevision: main
        path: centralized-chart
        helm:
          valueFiles:
            - "values/_defaults.yaml"
            - "values/{{path[1]}}/_project.yaml"
            - "values/{{path[1]}}/{{path.basename}}.yaml"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{path[1]}}-production"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

The `[!_]*` glob skips files starting with `_` (our convention for defaults/project files), so only actual service files trigger Application creation.

**The workflow for deploying a new service is now:**
1. Create a values file: `values/project-alpha/my-new-service.yaml`
2. Push to main
3. ArgoCD auto-discovers it, creates the Application, syncs it
4. Done. No clicking through UIs, no manual Application creation.

## Migration: Nginx to Traefik v3

Mid-project, we migrated ingress controllers from the bundled Nginx to Traefik v3. The reasons:

- Traefik v3's IngressRoute CRD gave us routing flexibility that Ingress objects couldn't match
- Built-in middleware chains for rate limiting, authentication headers, and path rewriting
- cert-manager integration was cleaner with Traefik's native ACME support
- Dashboard for debugging routing issues (invaluable during migration)

The migration was zero-downtime: we ran both controllers in parallel for 2 weeks, gradually moved services by changing `ingressClassName`, then decommissioned Nginx.

```yaml
# Traefik middleware chain example
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: api-chain
spec:
  chain:
    middlewares:
      - name: rate-limit
      - name: cors-headers
      - name: strip-prefix
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
spec:
  rateLimit:
    average: 100
    burst: 50
    period: 1m
```

## Monitoring the GitOps Pipeline

We added Prometheus metrics for ArgoCD sync status:

```yaml
# Alert on sync failures
- alert: ArgoCDSyncFailed
  expr: argocd_app_info{sync_status="OutOfSync"} == 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "{{ $labels.name }} has been OutOfSync for 10 minutes"
```

A Grafana dashboard shows the health of all 42+ applications at a glance: sync status, last sync time, health status, and resource consumption.

## Results

- **42+ Applications** managed from a single chart repo — zero per-service Helm charts
- **100+ pods** across 9 namespaces on GKE, all with consistent resource limits and security policies
- **Zero drift** — ArgoCD auto-syncs every 3 minutes with self-heal enabled
- New service deployment: **add one YAML file, push, done** (5 minutes vs. 2-3 hours)
- **Consistent security baseline**: every pod runs non-root, read-only filesystem, no privilege escalation
- **PodDisruptionBudgets** on every multi-replica service — rolling updates no longer cause outages

## Lessons Learned

**1. One chart to rule them all works — but only with a strict value hierarchy.** Without the 3-tier system, the single chart would have been a mess of conditional logic. The hierarchy keeps it clean: organizational standards at tier 1, project conventions at tier 2, service specifics at tier 3.

**2. ApplicationSets are magic.** Auto-discovery eliminated the entire category of "forgot to create the ArgoCD Application" incidents. When the values file exists, the Application exists. When it's deleted, the Application is pruned. GitOps in its purest form.

**3. Always have a staging cluster that mirrors production topology.** We caught 4 misconfiguration issues in staging before they hit production, including a malformed HPA that would have caused infinite scaling.

**4. Invest in the defaults file.** The `_defaults.yaml` is where you enforce organizational standards. If security contexts are opt-in, teams won't add them. Make them opt-out by putting them in defaults. The same applies to health checks, resource limits, and PodDisruptionBudgets.

**5. Version your chart with real semver.** When the centralized chart changes, all 42+ services are affected. We use Helm chart versioning and test every change in staging before promoting to production. Breaking changes get a migration guide and a 1-week adoption window.
