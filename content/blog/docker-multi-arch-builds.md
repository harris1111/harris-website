---
title: "Multi-Architecture Docker Builds for amd64 and arm64"
date: "2025-06-10"
tags: ["docker", "cicd", "multi-arch", "github-actions"]
description: "Building cross-platform Docker images with buildx, QEMU, and GitHub Actions for amd64/arm64"
published: true
---

# Multi-Architecture Docker Builds for amd64 and arm64

Our infrastructure runs on two CPU architectures. GKE nodes are amd64 (Intel/AMD). Some Proxmox K3s worker nodes run arm64. Developer laptops are a mix — half the team is on M-series Macs (arm64), the other half on Intel/AMD machines. When someone builds a Docker image on their M2 MacBook and pushes it, the image is arm64-only. Deploy it to GKE and you get `exec format error` — the container tries to run arm64 binaries on an amd64 kernel.

The fix: every Docker image we build must support both architectures. One image manifest, two platform-specific layers. `docker pull` automatically selects the right one. This post covers the complete setup: buildx configuration, multi-stage Dockerfile patterns, GitHub Actions automation, the templated Dockerfile generator we built for 17+ repos, and the gotchas that cost us hours of debugging.

## How Multi-Arch Docker Images Work

A Docker "image" is actually a manifest that points to one or more platform-specific images. When you run `docker pull myapp:latest`, Docker checks the manifest, identifies your platform (e.g., `linux/amd64`), and pulls the matching image.

```
myapp:latest (manifest list)
├── linux/amd64 → sha256:abc123... (Intel/AMD image)
└── linux/arm64 → sha256:def456... (ARM image)
```

Before multi-arch manifests, you had to maintain separate tags: `myapp:latest-amd64` and `myapp:latest-arm64`. Users had to know their architecture and pull the right tag. Multi-arch manifests make this invisible — `docker pull myapp:latest` just works on any platform.

Docker Buildx (an extended builder) with QEMU emulation handles the cross-compilation. Buildx builds the image for each target platform, pushes the platform-specific images, and creates the manifest list that ties them together.

## Setting Up Buildx

Buildx uses a builder instance with the `docker-container` driver. This driver runs builds inside a BuildKit container, which supports cross-platform building via QEMU:

```bash
# One-time setup: create a buildx builder
docker buildx create --name multiarch \
  --driver docker-container \
  --platform linux/amd64,linux/arm64 \
  --use

# Verify it's working
docker buildx inspect --bootstrap
# Output should show:
# Platforms: linux/amd64, linux/arm64, ...
```

Under the hood, `--platform linux/arm64` on an amd64 host uses QEMU user-mode emulation. The kernel intercepts arm64 binary syscalls and translates them via QEMU. This is transparent to the build process — `npm ci` thinks it's running natively on arm64.

QEMU emulation is **slow**. An arm64 build on an amd64 host takes 3-5x longer than a native build. This is why our Dockerfile strategy matters — we minimize what runs under emulation.

## The Multi-Stage Dockerfile Pattern

The key insight: separate the **build stage** (compile code, install dependencies) from the **runtime stage** (run the application). The build stage runs on the host architecture for speed. Only the runtime stage targets the final architecture.

### Node.js Example

```dockerfile
# ============================================
# Build stage — runs on HOST architecture (fast)
# ============================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

# $BUILDPLATFORM = the host's arch (e.g., linux/amd64)
# This stage runs NATIVELY, no emulation

WORKDIR /app

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune devDependencies — only keep production deps
RUN npm ci --omit=dev

# ============================================
# Runtime stage — runs on TARGET architecture
# ============================================
FROM node:20-alpine AS runner

# This stage uses the TARGET platform (e.g., linux/arm64)
# But we're only COPYING files, not compiling — so QEMU overhead is minimal

WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 appuser

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set ownership
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

**Why this is fast**: The `builder` stage does all the heavy lifting (npm install, TypeScript compilation, bundling) on the host's native architecture — no emulation. The `runner` stage only copies files and sets permissions — trivial operations that finish in seconds even under QEMU.

Without `--platform=$BUILDPLATFORM`, the build stage would run under QEMU for the non-native architecture. `npm ci` under QEMU takes 8-12 minutes instead of 1-2 minutes.

### Next.js Standalone Example

Next.js standalone output bundles the application into a self-contained directory that includes a minimal Node.js server:

```dockerfile
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# IMPORTANT: Set target platform for Next.js native modules
# next.config.ts must have: output: "standalone"
ARG TARGETPLATFORM
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output structure
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Rust Cross-Compilation Example

Rust has excellent cross-compilation support via the `cross` tool, but the Dockerfile pattern is different — Rust compiles to native binaries, so the build stage must target the correct architecture:

```dockerfile
FROM --platform=$BUILDPLATFORM rust:1.75-alpine AS builder

# Install cross-compilation tools
RUN apk add --no-cache musl-dev

# Add target for cross-compilation
ARG TARGETPLATFORM
RUN case "$TARGETPLATFORM" in \
      "linux/amd64") echo "x86_64-unknown-linux-musl" > /tmp/target ;; \
      "linux/arm64") echo "aarch64-unknown-linux-musl" > /tmp/target ;; \
    esac \
 && rustup target add $(cat /tmp/target)

WORKDIR /app
COPY . .

# Cross-compile using cargo
RUN cargo build --release --target $(cat /tmp/target) \
 && cp target/$(cat /tmp/target)/release/myapp /tmp/myapp

# ---
FROM alpine:3.19 AS runner
RUN adduser -D appuser
COPY --from=builder /tmp/myapp /usr/local/bin/myapp
USER appuser
CMD ["myapp"]
```

Rust cross-compilation with musl produces fully static binaries — the runtime image is just Alpine (5MB) plus the binary. No runtime dependencies, no compatibility issues.

## GitHub Actions Workflow

Our CI workflow builds and pushes multi-arch images on every push to main and every tag:

```yaml
name: Build Multi-Arch Image

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      # QEMU enables arm64 emulation on the amd64 GitHub runner
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
        with:
          platforms: arm64

      # Buildx with docker-container driver for multi-platform
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Login to GitHub Container Registry
      - name: Login to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Generate image tags
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      # Build and push for both architectures
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false    # Avoid attestation issues with some registries

      # Verify the manifest (both platforms present)
      - name: Verify multi-arch manifest
        if: github.event_name != 'pull_request'
        run: |
          docker buildx imagetools inspect ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

### GHA Cache: The 60% Build Time Saver

The `cache-from: type=gha` and `cache-to: type=gha,mode=max` flags use GitHub Actions' built-in cache for Docker layer caching. On subsequent builds, layers that haven't changed (base image, npm install with unchanged lockfile, etc.) are pulled from cache instead of rebuilt.

Impact on our build times:

| Scenario | Without Cache | With GHA Cache | Savings |
|----------|--------------|----------------|---------|
| No code changes | 12 min | 2 min | 83% |
| Source code only | 12 min | 5 min | 58% |
| package-lock.json changed | 12 min | 8 min | 33% |
| Dockerfile changed | 12 min | 12 min | 0% |

Average across all builds: **~60% time savings** from caching.

The `mode=max` flag caches all layers, not just the final stage. This is important for multi-stage builds — without it, only the runner stage layers are cached, and the builder stage rebuilds from scratch every time.

## The Templated Dockerfile Generator

With 17+ repos needing Dockerfiles, maintaining them individually was the same duplication problem we solved for CI/CD pipelines. We built a generator:

```bash
# Generate an optimized Dockerfile for each project type
./generate-dockerfile.sh --type=nodejs --multi-arch --healthcheck --non-root
./generate-dockerfile.sh --type=nextjs --multi-arch --standalone
./generate-dockerfile.sh --type=rust --multi-arch --musl
./generate-dockerfile.sh --type=nginx --multi-arch --security-headers
```

Each template encodes best practices:

| Template | Build Strategy | Multi-Arch Approach | Base Image |
|----------|---------------|---------------------|------------|
| Node.js | `$BUILDPLATFORM` + npm ci | Native (interpreted) | node:20-alpine |
| Next.js | `$BUILDPLATFORM` + standalone | Native | node:20-alpine |
| Rust | Cross-compile via cargo target | Cross-compilation | rust → alpine |
| WASM | wasm-pack (arch-independent) | N/A | node:20-alpine |
| Nginx | Static file copy | N/A | nginx:alpine |

The generator also creates a matching `.dockerignore`:

```
node_modules
.next
dist
.git
*.md
.env*
docker-compose*.yml
```

A proper `.dockerignore` is critical for build performance. Without it, Docker sends the entire repo (including `node_modules`, `.git`, etc.) as build context. For a repo with a 500MB `.git` directory and 200MB `node_modules`, that's 700MB of unnecessary data transfer per build.

## Gotchas That Cost Us Hours

### Gotcha 1: QEMU Is Slow — Really Slow

Our first multi-arch builds took 25 minutes because we didn't use `--platform=$BUILDPLATFORM` on the build stage. Everything ran under QEMU, including `npm ci` (which compiles native modules like `esbuild` and `sharp`).

**Fix**: Always use `--platform=$BUILDPLATFORM` for build stages. Only the runtime stage should use the target platform — and it should only copy files, not compile anything.

Before/after:

| Stage | Without $BUILDPLATFORM | With $BUILDPLATFORM |
|-------|----------------------|---------------------|
| npm ci | 8 min (QEMU) | 1.5 min (native) |
| npm run build | 6 min (QEMU) | 2 min (native) |
| Runtime setup | 1 min | 1 min |
| **Total** | **15 min per arch** | **4.5 min per arch** |

### Gotcha 2: Native Modules Break Cross-Architecture

`node-gyp` packages (`bcrypt`, `sharp`, `canvas`) compile C/C++ code during `npm install`. If you install on amd64 (build stage) and run on arm64 (runtime stage), the compiled binaries won't work.

**Solutions** (in order of preference):
1. **Use pre-built binaries**: `sharp` and `esbuild` ship pre-built binaries for both architectures. Ensure your lockfile resolves the correct platform variant.
2. **Use Alpine-compatible alternatives**: `bcryptjs` (pure JS) instead of `bcrypt` (native). Slower but cross-platform.
3. **Install in the runtime stage**: If you must use native modules, run `npm ci --production` in the runtime stage (under QEMU). Slow but correct.

```dockerfile
# Option 3: Install native modules in the runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev    # Installs for the TARGET architecture
COPY --from=builder /app/dist ./dist
```

### Gotcha 3: Layer Caching Is Per-Architecture

Each architecture has its own layer cache. The first time you build for arm64, it's a cold build — even if you have a warm cache for amd64. This means your first multi-arch build takes roughly 2x the time of a single-arch build (parallel builds) or 2x (sequential builds).

Subsequent builds benefit from per-arch caching normally. Just don't be surprised by the cold first build.

### Gotcha 4: provenance Attestation Issues

Docker Buildx v0.10+ adds provenance attestations by default, which creates an extra manifest entry of type `application/vnd.in-toto+json`. Some registries (older Harbor, some ECR configurations) choke on this.

**Fix**: Add `provenance: false` to your build-push-action if you see manifest-related errors:

```yaml
- uses: docker/build-push-action@v5
  with:
    provenance: false    # Disable if your registry doesn't support attestations
```

### Gotcha 5: Alpine + musl vs glibc

Alpine Linux uses musl libc instead of glibc. Most Node.js packages work fine, but some native modules compiled against glibc will segfault on Alpine. If you see mysterious crashes in the runtime stage, try switching to `node:20-slim` (Debian-based, glibc) instead of `node:20-alpine`.

We hit this with a Prisma client binary — it was compiled against glibc and silently crashed on Alpine. Switching to the slim base image fixed it. The image size increased from 80MB to 200MB, but reliability matters more.

## Verifying Multi-Arch Builds

After pushing, verify that both architectures are present in the manifest:

```bash
# Inspect the manifest list
docker buildx imagetools inspect ghcr.io/org/myapp:latest

# Output:
# Name:      ghcr.io/org/myapp:latest
# MediaType: application/vnd.oci.image.index.v1+json
# Digest:    sha256:...
#
# Manifests:
#   Name:      ghcr.io/org/myapp:latest@sha256:abc...
#   MediaType: application/vnd.oci.image.manifest.v1+json
#   Platform:  linux/amd64
#
#   Name:      ghcr.io/org/myapp:latest@sha256:def...
#   MediaType: application/vnd.oci.image.manifest.v1+json
#   Platform:  linux/arm64
```

We added this verification step to our CI pipeline — if either platform is missing from the manifest, the build fails.

## Results

- **Every image** supports amd64 + arm64 — no more `exec format error`
- **Single `docker pull`** works on any platform — GKE, K3s, developer MacBooks
- **Build time**: ~4 minutes with cache, ~12 minutes cold (both architectures)
- **Developer M-series Macs** pull native arm64 images — no Rosetta emulation overhead, container performance matches native
- **17+ repos** use generated Dockerfiles from 5 templates — consistent best practices, zero per-repo maintenance
- **Image sizes**: 80-200MB depending on base image and runtime — Alpine for most services, slim for Prisma-dependent ones

## Lessons Learned

**1. `$BUILDPLATFORM` is the single most important optimization.** Without it, compilation runs under QEMU and takes 3-5x longer. With it, only the lightweight runtime stage uses emulation. This one flag saved us 10+ minutes per build.

**2. Native modules are the #1 source of cross-arch bugs.** Audit your `package-lock.json` for native dependencies (`node-gyp`, `.node` binaries). Each one needs a cross-architecture strategy: pre-built binaries, pure-JS alternatives, or runtime-stage installation.

**3. Cache aggressively with GHA cache.** `type=gha,mode=max` caches ALL layers, not just the final stage. This is critical for multi-stage builds. Without `mode=max`, your expensive build stage rebuilds from scratch every time.

**4. Generate Dockerfiles, don't copy-paste them.** Our template generator ensures every repo gets the same security hardening (non-root user, health checks, minimal base image) and the same multi-arch optimizations. When we improve the template, all repos benefit — not just the ones whose maintainer saw the Slack message about the improvement.

**5. Test on both architectures in CI.** Building for arm64 doesn't guarantee the image works on arm64. We added a `docker run --platform linux/arm64` smoke test that starts the container and hits the health endpoint. This caught the Alpine/glibc issue before it reached production.
