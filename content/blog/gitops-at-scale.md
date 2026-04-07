---
title: "GitOps at Scale: Managing 42+ ArgoCD Applications"
date: "2026-01-10"
tags: ["gitops", "argocd", "kubernetes", "helm"]
description: "How we designed a centralized Helm chart system for 32+ microservices"
published: true
---

# GitOps at Scale: Managing 42+ ArgoCD Applications

Managing Kubernetes manifests for 32+ microservices across 4 projects gets complex fast. Here's how we tamed it with a centralized Helm chart and ArgoCD.

## The Problem

- 32+ microservices, each needing Deployment, Service, Ingress, HPA, etc.
- 4 projects with different environments (dev, staging, production)
- Values scattered across repositories
- No consistent resource limits or security policies

## Solution: 3-Tier Value Hierarchy

Instead of per-service Helm charts, we built ONE centralized chart:

```
centralized-chart/
├── templates/          # Shared K8s templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
└── values/
    ├── _defaults.yaml       # Tier 1: Global defaults
    ├── project-a/
    │   ├── _project.yaml    # Tier 2: Project overrides
    │   ├── api.yaml         # Tier 3: Service-specific
    │   └── worker.yaml
    └── project-b/
        ├── _project.yaml
        └── gateway.yaml
```

### Value Resolution

```
Tier 3 (service) > Tier 2 (project) > Tier 1 (defaults)
```

Adding a new microservice = one YAML file with only the differences.

## ArgoCD Application Sets

We use ApplicationSets to auto-discover services:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
spec:
  generators:
    - git:
        repoURL: https://github.com/org/deploy
        directories:
          - path: "values/*/[!_]*"
```

This automatically creates an ArgoCD Application for every service values file.

## Results

- **42+ Applications** managed from a single chart repo
- **100+ pods** across 9 namespaces on GKE
- **Zero drift** — ArgoCD auto-syncs every 3 minutes
- New service deployment: **add one YAML file, push, done**

## Migration: Nginx to Traefik v3

Mid-project, we migrated ingress controllers:
- Traefik v3's IngressRoute CRD gave us more routing flexibility
- cert-manager integration simplified TLS certificate management
- Middleware chains for rate limiting, auth, and headers

## Lessons Learned

1. One chart to rule them all works — but only with a strict value hierarchy.
2. ApplicationSets are magic. Auto-discovery eliminates manual Application creation.
3. Always have a staging cluster that mirrors production topology.
