---
title: "Building AI Developer Infrastructure with SSH Containers and MCP"
date: "2025-03-15"
tags: ["ai", "devops", "containers", "developer-experience"]
description: "How we built 9 parallel SSH-accessible dev containers with Claude Code and MCP integration"
published: true
---

# Building AI Developer Infrastructure with SSH Containers and MCP

AI-assisted development changes how you think about developer environments. When AI agents need to run code, access tools, and manage files — they need real infrastructure.

## The Problem

- 9 developers using AI coding assistants (Claude Code, Cursor, Copilot)
- Each needs an isolated environment with project dependencies
- AI agents need SSH access to execute commands
- Shared packages shouldn't re-download for each developer
- Environment must be reproducible

## Architecture

```
Developer Laptop
  └─ SSH ──→ Dev Container (per-developer)
               ├── Project code (bind mount)
               ├── AI tools (Claude Code, MCP servers)
               ├── Node.js, Python, Go, Rust toolchains
               └── npm packages (shared Verdaccio registry)
                     ↕
               Verdaccio (private npm registry)
```

## Dev Container Setup

Each developer gets a dedicated container:

```yaml
# docker-compose.dev.yml
services:
  dev-alice:
    build: ./dev-container
    hostname: dev-alice
    ports:
      - "2201:22"
    volumes:
      - alice-workspace:/home/dev/workspace
      - shared-npm-cache:/home/dev/.npm
    environment:
      - NPM_CONFIG_REGISTRY=http://verdaccio:4873
      - DEV_USER=alice

  dev-bob:
    build: ./dev-container
    hostname: dev-bob
    ports:
      - "2202:22"
    volumes:
      - bob-workspace:/home/dev/workspace
      - shared-npm-cache:/home/dev/.npm
    environment:
      - NPM_CONFIG_REGISTRY=http://verdaccio:4873
      - DEV_USER=bob

  verdaccio:
    image: verdaccio/verdaccio
    ports:
      - "4873:4873"
    volumes:
      - verdaccio-storage:/verdaccio/storage
```

## Verdaccio: Private npm Registry

Why a private registry:
- Caches npm packages locally — installs go from ~2 minutes to ~10 seconds
- Publish internal packages without npm public
- Works offline (once cached)

```yaml
# verdaccio config.yaml
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    cache: true
packages:
  '@company/*':
    access: $all
    publish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    proxy: npmjs
```

## Claude Code + MCP Integration

Each dev container comes with Claude Code pre-installed and MCP servers configured:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/home/dev/workspace"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-git"]
    }
  }
}
```

AI agents can:
- Read/write project files via MCP filesystem
- Run git operations
- Execute shell commands via SSH
- Access the private npm registry

## SSH Key Management

Each developer's SSH key is injected via cloud-init:

```bash
# Per-developer key injection
for user in alice bob charlie; do
  docker exec dev-${user} \
    bash -c "echo '$(cat keys/${user}.pub)' >> /home/dev/.ssh/authorized_keys"
done
```

YubiKey-backed SSH keys required. No password authentication.

## Resource Limits

Each container gets bounded resources to prevent one dev from starving others:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

9 containers × 4 CPU = 36 cores max. Our EPYC 9654P has 192 threads — plenty of headroom.

## Results

- 9 developers with isolated, reproducible environments
- npm install time: 2 min → 10 sec (Verdaccio cache)
- AI agents work seamlessly — SSH + MCP = full environment access
- Zero "works on my machine" issues

## Lessons

1. **Shared package caches are huge.** Verdaccio alone saved ~20 minutes/day across the team.
2. **AI agents need real environments.** Sandboxed playgrounds with no real toolchains limit what AI can do. Give them SSH and let them work.
3. **Resource limits are essential** when running 9 containers on shared hardware. One runaway build shouldn't freeze everyone.
