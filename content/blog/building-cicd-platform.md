---
title: "Building a Centralized CI/CD Platform from Scratch"
date: "2026-03-15"
tags: ["devops", "cicd", "github-actions"]
description: "How we built a 3-tier CI/CD framework serving 17+ repositories at Orochi Network"
published: true
---

# Building a Centralized CI/CD Platform from Scratch

When I joined Orochi Network, each repository had its own CI/CD pipeline — duplicated YAML, inconsistent build steps, and no shared logic. Over 3 months, we built a centralized framework that now serves 17+ repositories.

## The Problem

- 17+ repos with copy-pasted workflow files
- No consistent Docker build process
- Developers bypassing security checks (no commit signing)
- Each repo maintained its own Dockerfile variants

## The 3-Tier Architecture

We designed a layered system:

```
Tier 1: Composite Actions (26 actions)
  └── Reusable building blocks: checkout, build, push, sign

Tier 2: Reusable Workflows (12 workflows)
  └── Orchestrate actions into pipelines: build-and-push, deploy, test

Tier 3: Repository Workflows
  └── Thin wrappers calling Tier 2 workflows with repo-specific config
```

### Tier 1: Composite Actions

Each action does one thing well. Examples:
- `docker-build-push`: Multi-arch build (amd64/arm64) with caching
- `commit-sign-verify`: Enforces GPG/SSH signatures
- `helm-deploy`: Deploys via ArgoCD with health checks

### Tier 2: Reusable Workflows

Workflows compose actions into full pipelines:

```yaml
# .github/workflows/build-and-push.yml
name: Build and Push
on:
  workflow_call:
    inputs:
      dockerfile: { type: string, default: "Dockerfile" }
      platforms: { type: string, default: "linux/amd64,linux/arm64" }
```

### Templated Dockerfile Generator

We built a CLI tool that generates optimized Dockerfiles from templates:
- 4 project types: Node.js, Nginx, Next.js, Rust
- Multi-stage builds with security hardening
- Consistent base images and layer caching

## Results

- **Zero workflow duplication** across 17+ repos
- **Multi-arch builds** (amd64/arm64) on every push
- **Enforced commit signing** — no unsigned commits reach main
- **~40% reduction** in CI pipeline maintenance time

## Lessons Learned

1. Start with conventions, not tools. Define what "a good pipeline" looks like before writing YAML.
2. Composite actions > reusable workflows for small units. Workflows for orchestration.
3. Version your CI framework. Breaking changes in shared actions affect all repos.
