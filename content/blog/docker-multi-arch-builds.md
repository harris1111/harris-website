---
title: "Multi-Architecture Docker Builds for amd64 and arm64"
date: "2025-06-10"
tags: ["docker", "cicd", "multi-arch", "github-actions"]
description: "Building cross-platform Docker images with buildx, QEMU, and GitHub Actions for amd64/arm64"
published: true
---

# Multi-Architecture Docker Builds for amd64 and arm64

Our K3s cluster on Proxmox runs arm64 nodes alongside amd64 GKE pods. Every Docker image needs to work on both architectures. Here's how we automated it.

## Why Multi-Arch

- GKE nodes: amd64 (Intel/AMD)
- Proxmox K3s: could be either architecture depending on hardware
- Developer laptops: M-series Macs are arm64
- One image manifest, any architecture pulls the right layer

## Docker Buildx Setup

Buildx with QEMU emulation handles cross-compilation:

```bash
# One-time setup
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

## Multi-Stage Dockerfile

The key: separate build and runtime stages with explicit `--platform`:

```dockerfile
# Build stage — runs on native arch for speed
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage — target architecture
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

`$BUILDPLATFORM` is the host arch (fast native compilation). The runtime stage uses the target arch.

## GitHub Actions Workflow

```yaml
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ghcr.io/org/app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

GHA cache (`type=gha`) avoids rebuilding layers that haven't changed — saves ~60% build time on subsequent runs.

## Templated Dockerfile Generator

With 17+ repos needing Dockerfiles, we built a generator:

```bash
./generate-dockerfile.sh --type=nodejs --multi-arch
./generate-dockerfile.sh --type=nextjs --multi-arch
./generate-dockerfile.sh --type=rust --multi-arch
./generate-dockerfile.sh --type=nginx --multi-arch
```

Each template handles architecture-specific nuances:
- **Node.js:** `npm ci` works cross-platform
- **Rust:** Needs cross-compilation toolchain (`cross` crate)
- **Nginx:** Static assets only — no arch-specific code

## 5 Compilation Targets

| Target | Build Tool | Arch Handling |
|--------|-----------|---------------|
| Node.js | npm | Native (interpreted) |
| Next.js | npm + standalone | Native |
| Rust | cargo + cross | Cross-compile |
| WASM | wasm-pack | Architecture-independent |
| Nginx | Static copy | Architecture-independent |

## Gotchas

1. **QEMU is slow.** arm64 builds on amd64 hosts take 3-5x longer. Use `$BUILDPLATFORM` for compilation stages.
2. **Native modules break.** `node-gyp` packages (bcrypt, sharp) need to compile for target arch. Use pre-built binaries or Alpine-compatible alternatives.
3. **Layer caching per-arch.** Each architecture has its own cache. First build for a new arch is cold.

## Results

- Every image supports amd64 + arm64
- Single `docker pull` works on any platform
- Build time: ~4 min (with cache), ~12 min (cold)
- Developer Macs pull native arm64 — no Rosetta overhead
