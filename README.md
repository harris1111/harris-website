# harris-website

Terminal-style interactive CV for **Nguyen Minh An** — DevOps Engineer.

The entire site is a terminal emulator. Type commands to explore my CV, read blog posts, and sign the guestbook.

## Features

- **Terminal UI**: Full terminal emulator with command history, tab completion, keyboard shortcuts
- **CV Commands**: `about`, `skills`, `experience`, `education`, `contact`, `social`, `timeline`, `projects`, `certifications`
- **Virtual Filesystem**: Navigate with `cd`, `ls`, `cat`, `pwd`, `tree`
- **Blog System**: Markdown blog posts in `content/blog/`, rendered in terminal and as SEO pages
- **Guestbook**: PostgreSQL-backed guestbook with rate limiting
- **5 Themes**: dark, light, nord-dark, nord-light, matrix (with CRT effects)
- **Easter Eggs**: `neofetch`, `cowsay`, `fortune`, `sudo hire-me`
- **SEO**: JSON-LD, sitemap, robots.txt, OG tags

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + CSS variables |
| Database | PostgreSQL + Prisma 7 |
| Font | JetBrains Mono |
| Deploy | Docker + Nginx |

## Quick Start

```bash
# Install
npm install

# Generate Prisma client
npx prisma generate

# Dev server
npm run dev
```

## Docker Deployment

```bash
cd docker

# Set password
export POSTGRES_PASSWORD=your-secure-password

# Start all services
docker compose up -d

# Run database migrations
docker exec harris-website npx prisma migrate deploy
```

Services: Next.js (3000), PostgreSQL (5432), Nginx (80/443).

## Adding Blog Posts

Create a `.md` file in `content/blog/`:

```yaml
---
title: "Your Post Title"
date: "2026-04-08"
tags: ["tag1", "tag2"]
description: "Brief description"
published: true
---

Your markdown content here...
```

Rebuild to publish: `npm run build`

## Commands

| Command | Description |
|---------|------------|
| `help` | Show all commands |
| `about` | Profile summary |
| `skills` | Technical skills |
| `experience` | Work history |
| `blog` | List/read blog posts |
| `guestbook` | Read/sign guestbook |
| `theme` | Change terminal theme |
| `neofetch` | System info display |
| `tree` | Directory tree |

## License

MIT
