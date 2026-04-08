---
title: "Building a Centralized CI/CD Platform from Scratch"
date: "2026-03-15"
tags: ["devops", "cicd", "github-actions"]
description: "How we built a 3-tier CI/CD framework serving 17+ repositories at Orochi Network"
published: true
---

# Building a Centralized CI/CD Platform from Scratch

When I joined Orochi Network, each repository had its own CI/CD pipeline — duplicated YAML, inconsistent build steps, and no shared logic. Over 3 months, we built a centralized framework that now serves 17+ repositories. This is the story of that transformation: the problems we faced, the architecture we designed, and the trade-offs we made along the way.

## The Problem Was Worse Than It Looked

On paper, "each repo has its own CI/CD" sounds manageable. In practice, it was chaos.

- **17+ repos** with copy-pasted workflow files, each slightly different
- No consistent Docker build process — some repos used `docker build`, others used `buildx`, one was still running `docker-compose` in CI
- Developers were bypassing security checks. Commit signing? Optional. Image scanning? Nonexistent.
- Each repo maintained its own Dockerfile variants — we found 23 Dockerfiles across the org, many with conflicting base images
- A simple change like "upgrade Node.js base image from 18 to 20" required touching every single repo

The tipping point came when we discovered a production container running an unpatched Alpine base image from 6 months ago. Nobody knew which Dockerfile produced it. That week, I started sketching the architecture on a whiteboard.

## Designing the 3-Tier Architecture

The core insight was that CI/CD logic has natural layers of abstraction, similar to how software has functions, modules, and applications. We designed three tiers:

```
Tier 1: Composite Actions (26 actions)
  └── Reusable building blocks: checkout, build, push, sign
      Think of these as functions — small, tested, single-purpose

Tier 2: Reusable Workflows (12 workflows)
  └── Orchestrate actions into pipelines: build-and-push, deploy, test
      Think of these as modules — composing functions into useful sequences

Tier 3: Repository Workflows
  └── Thin wrappers calling Tier 2 workflows with repo-specific config
      Think of these as applications — minimal config, maximum reuse
```

All shared actions and workflows live in a single `.github-actions` monorepo. Repos reference them via `uses: org/.github-actions/.github/actions/docker-build-push@v2`.

### Tier 1: Composite Actions

Each action does exactly one thing. This was a deliberate choice — early prototypes combined too much logic into single actions, making them hard to test and reuse. Here are some examples:

**docker-build-push** — Multi-arch build with caching:

```yaml
name: Docker Build and Push
description: Build and push multi-arch Docker image with layer caching
inputs:
  dockerfile:
    description: Path to Dockerfile
    default: "Dockerfile"
  platforms:
    description: Target platforms
    default: "linux/amd64,linux/arm64"
  cache-from:
    description: Cache source
    default: "type=gha"
  image:
    description: Full image name with tag
    required: true

runs:
  using: composite
  steps:
    - uses: docker/setup-qemu-action@v3
    - uses: docker/setup-buildx-action@v3
    - uses: docker/build-push-action@v5
      with:
        context: .
        file: ${{ inputs.dockerfile }}
        platforms: ${{ inputs.platforms }}
        push: true
        tags: ${{ inputs.image }}
        cache-from: ${{ inputs.cache-from }}
        cache-to: type=gha,mode=max
```

**commit-sign-verify** — Enforces GPG/SSH signatures on all commits in a PR:

```yaml
runs:
  using: composite
  steps:
    - name: Verify commit signatures
      shell: bash
      run: |
        UNSIGNED=$(git log --format='%H %G?' origin/main..HEAD | grep -E ' N$' | awk '{print $1}')
        if [ -n "$UNSIGNED" ]; then
          echo "::error::Unsigned commits found:"
          echo "$UNSIGNED"
          exit 1
        fi
```

We built 26 composite actions covering: checkout with caching, Docker builds, Helm deploys, commit signing, image scanning (Trivy), notification (Slack), artifact uploading, and secret detection.

### Tier 2: Reusable Workflows

Workflows compose actions into full pipelines. The key design decision: every workflow uses `workflow_call` so repos can invoke them with minimal configuration.

```yaml
# .github/workflows/build-and-push.yml
name: Build and Push
on:
  workflow_call:
    inputs:
      dockerfile:
        type: string
        default: "Dockerfile"
      platforms:
        type: string
        default: "linux/amd64,linux/arm64"
      image-name:
        type: string
        required: true
    secrets:
      REGISTRY_TOKEN:
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/commit-sign-verify
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.REGISTRY_TOKEN }}
      - uses: ./.github/actions/docker-build-push
        with:
          dockerfile: ${{ inputs.dockerfile }}
          platforms: ${{ inputs.platforms }}
          image: ghcr.io/orochi-network/${{ inputs.image-name }}:${{ github.sha }}
      - uses: ./.github/actions/trivy-scan
        with:
          image: ghcr.io/orochi-network/${{ inputs.image-name }}:${{ github.sha }}
```

Notice that commit signing and image scanning are baked in — developers can't skip them.

### Tier 3: Repository Workflows

This is what individual repos look like. A complete CI/CD pipeline in 15 lines:

```yaml
# In any repo: .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    uses: orochi-network/.github-actions/.github/workflows/build-and-push.yml@v2
    with:
      image-name: my-service
      dockerfile: docker/Dockerfile
    secrets:
      REGISTRY_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

That's it. Multi-arch build, commit signing, image scanning, push to GHCR — all inherited from the shared framework.

## The Templated Dockerfile Generator

With standardized pipelines, we still had the Dockerfile problem. Each project type (Node.js, Next.js, Rust, Nginx) needed different build patterns, but the security hardening and best practices should be consistent.

We built a CLI tool that generates optimized Dockerfiles from templates:

```bash
./generate-dockerfile.sh --type=nextjs --multi-arch --with-healthcheck
```

This produces a multi-stage Dockerfile with:
- `$BUILDPLATFORM` for fast native compilation in build stages
- Non-root user in runtime stage
- Minimal base images (Alpine or distroless)
- Health check endpoint
- Proper `.dockerignore` generation

We support 4 project types with 5 compilation targets:

| Type | Build Tool | Multi-Arch Strategy |
|------|-----------|---------------------|
| Node.js | npm ci | Native (interpreted) |
| Next.js | npm + standalone output | Native |
| Rust | cargo + cross crate | Cross-compilation |
| WASM | wasm-pack | Architecture-independent |
| Nginx | Static copy | Architecture-independent |

## Versioning Strategy

Breaking changes in shared actions affect all 17+ repos. We use a strict versioning scheme:

- **Major versions** (`v1`, `v2`): Breaking changes. Repos pin to major version.
- **Minor versions** (`v2.1`, `v2.2`): New features, backward-compatible. Auto-adopted.
- **Release branches**: `release/v1`, `release/v2` — repos reference these via `@v2`.

When we shipped v2 (adding multi-arch support), we gave teams 2 weeks to migrate. A migration guide documented every breaking change with before/after YAML snippets.

## Results After 3 Months

- **Zero workflow duplication** across 17+ repos — every pipeline is a thin wrapper
- **Multi-arch builds** (amd64/arm64) on every push, automatically
- **Enforced commit signing** — no unsigned commits reach main, period
- **Image scanning** on every build — caught 12 critical CVEs in the first month
- **~40% reduction** in CI pipeline maintenance time across the engineering team
- **New repo onboarding**: from half a day to 15 minutes (copy template, change image name)

## Lessons Learned

**1. Start with conventions, not tools.** We spent the first two weeks defining what "a good pipeline" looks like — not writing YAML. What must every pipeline do? Build, scan, sign, push. What's optional? Deploy, notify, benchmark. This made the tier boundaries obvious.

**2. Composite actions > reusable workflows for small units.** Actions are more composable — you can mix and match them in any workflow. Workflows are better for orchestration where the sequence matters.

**3. Version your CI framework seriously.** We broke all 17 repos on day one of v2 development because someone pushed to main. After that incident, we adopted release branches and semantic versioning. Breaking changes get a migration period.

**4. Eat your own dogfood.** The `.github-actions` repo uses its own workflows for CI. If the shared actions break, we find out immediately — not when a downstream repo files an issue.

**5. Security must be non-optional.** When commit signing was opt-in, adoption was 30%. When we baked it into the shared workflow, adoption became 100% overnight. The same applies to image scanning and secret detection. Make the secure path the only path.
