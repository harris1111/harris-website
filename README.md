# harris-website

Terminal-style interactive CV for **Nguyen Minh An** — DevOps Engineer.

The main page is a fully interactive terminal emulator. Type commands to explore my CV, read blog posts, sign the guestbook, and switch themes. Traditional web pages also available for SEO and browsing.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Interactive terminal (main experience) |
| `/about` | Full CV in terminal style — skills, experience, education, links |
| `/blog` | Blog listing with post cards |
| `/blog/[slug]` | Individual blog post |

## Features

- **Terminal UI**: Command history (ArrowUp/Down), tab completion, Ctrl+L/C, auto-scroll, live syntax highlighting
- **33+ Commands**: CV info (`about`, `skills`, `experience`, `education`, `contact`, `social`, `timeline`, `projects`, `certifications`), file navigation (`cd`, `ls`, `cat`, `pwd`, `tree`), content (`blog`, `guestbook`, `download-cv`), system (`theme`, `help`, `man`, `clear`, `history`, `whoami`, `echo`, `date`, `uname`), hacker tools (`nmap`, `ping`, `traceroute`, `ssh`, `hack`, `exploit`, `decrypt`), fun (`neofetch`, `cowsay`, `fortune`, `sudo`, `matrix`, `open`)
- **Hacker Simulation**: 7 commands with animated line-by-line output, 15+ scenarios per phase, progress bars, real tech stack references (Next.js, Prisma, PostgreSQL, Docker, Nginx)
- **Virtual Filesystem**: Navigate CV data with `cd`, `ls`, `cat`, `pwd`, `tree` + hidden `.classified` file for CTF
- **Blog System**: Markdown in `content/blog/`, terminal + web rendering, frontmatter-based
- **Guestbook**: PostgreSQL-backed, rate-limited (1/IP/hour), profanity filter
- **6 Themes**: dark, light, nord-dark, nord-light, matrix, hacker (unlockable cyberpunk neon theme)
- **Easter Egg CTF**: Welcome banner hints → `.classified` file → `hack cv.minhan.dev` → `sudo hire-me` → unlock hacker theme + 11 mini eggs with rewards
- **System Dashboard**: Desktop sidebar (lg+ screens) with live CPU/memory/disk metrics, Docker PS, kubectl status
- **SEO**: JSON-LD Person schema, sitemap, robots.txt, OG/Twitter cards, SSG blog pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database | PostgreSQL + Prisma 7 |
| Font | JetBrains Mono (Google Fonts) |
| Deploy | Docker + Nginx + GitHub Actions |

## Quick Start

```bash
# Clone
git clone https://github.com/harris1111/harris-website.git
cd harris-website

# Install
npm install

# Generate Prisma client
npx prisma generate

# Dev server
npm run dev
```

Visit http://localhost:3000

> **Note:** Guestbook requires PostgreSQL. Set `DATABASE_URL` in `.env` or use Docker (see below). All other features work without a database.

## Docker Deployment

```bash
cd docker

# Set database password
export POSTGRES_PASSWORD=your-secure-password

# Start all services (Next.js + PostgreSQL + Nginx)
docker compose up -d

# Run database migrations
docker exec harris-website npx prisma migrate deploy
```

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80, 443 | Reverse proxy, gzip, static caching |
| Next.js | 3000 | App server (standalone mode) |
| PostgreSQL | 5432 | Guestbook database |

### SSL Setup

1. Install certbot on your VPS
2. Obtain certificate: `certbot certonly --standalone -d your-domain.com`
3. Uncomment SSL section in `docker/nginx.conf`
4. Mount certs volume in `docker/docker-compose.yml`

## Adding Blog Posts

Create `content/blog/your-slug.md`:

```yaml
---
title: "Your Post Title"
date: "2026-04-08"
tags: ["devops", "kubernetes"]
description: "Brief description for SEO and listing"
published: true
---

Your markdown content here. Supports headings, code blocks, lists, etc.
```

Rebuild to publish: `npm run build` (or push to trigger CI/CD)

Set `published: false` to hide a draft.

## Adding Terminal Commands

1. Create `src/commands/your-command.ts`:
```typescript
import { register } from "./registry";

register({
  name: "your-command",
  description: "What it does",
  usage: "your-command [args]",
  execute: (args, ctx) => ({
    type: "text",
    content: "Output here",
  }),
});
```

2. Register in `src/commands/builtin.ts` → `registerAllCommands()`:
```typescript
require("./your-command");
```

## Updating CV Data

All CV data lives in `src/data/profile.ts` — single source of truth. Update this file and all commands, filesystem, and the `/about` page reflect changes automatically.

## Project Structure

```
harris-website/
├── content/blog/          # Markdown blog posts
├── docker/                # Dockerfile, docker-compose, nginx.conf
├── public/cv/             # CV PDF for download
├── src/
│   ├── app/               # Next.js pages and API routes
│   ├── commands/          # Terminal command handlers
│   ├── components/        # React components (terminal, CRT overlay)
│   ├── data/              # Profile data, filesystem tree, quotes
│   ├── hooks/             # useTerminal, useTypewriter
│   ├── lib/               # Prisma, blog loader, rate limit, profanity
│   ├── themes/            # 5 theme definitions
│   └── types/             # TypeScript interfaces
├── prisma/                # Database schema
└── .github/workflows/     # CI/CD pipeline
```

## Terminal Commands Reference

### Profile
| Command | Description |
|---------|------------|
| `about` | Profile summary |
| `skills [category]` | Skills table (filterable) |
| `experience [company]` | Work history (filterable) |
| `education` | Education background |
| `contact` | Contact information |
| `social` | Social media links |
| `projects` | Notable projects |
| `certifications` | Certifications |
| `timeline` | ASCII career timeline |
| `download-cv` | Download CV as PDF |

### Terminal
| Command | Description |
|---------|------------|
| `help` | List all commands (grouped by category) |
| `man <cmd>` | Manual page |
| `clear` | Clear terminal (keeps welcome banner) |
| `history` | Command history |
| `whoami` | Current user info |
| `echo <text>` | Print text |

### Navigation
| Command | Description |
|---------|------------|
| `cd [path]` | Change directory |
| `ls [path]` | List directory contents (detailed, colored) |
| `cat <file>` | Display file contents |
| `pwd` | Print working directory |
| `tree [-L depth]` | Display directory tree |
| `open <page>` | Open /about, /blog, /home |

### Content
| Command | Description |
|---------|------------|
| `blog [slug]` | List/read blog posts |
| `guestbook [--write]` | Read/sign guestbook |
| `theme [name\|--list]` | Switch theme (includes hacker theme) |

### Hacker Tools (CTF)
| Command | Description |
|---------|------------|
| `nmap <target>` | Network scan simulation |
| `ping <target>` | Ping with latency simulation |
| `traceroute <target>` | Trace route with hops |
| `ssh <target>` | SSH connection attempt |
| `hack <target>` | Exploit target server (odd minute = success, even = fail) |
| `exploit <target>` | Run exploit payload |
| `decrypt <cipher>` | Decrypt encrypted text |

### Fun
| Command | Description |
|---------|------------|
| `neofetch` | System info display |
| `cowsay <msg>` | ASCII cow |
| `fortune` | Random DevOps wisdom |
| `date` | Current date/time |
| `uname [-a]` | System info |
| `sudo <cmd>` | Privilege escalation (hints at hire-me) |
| `matrix` | Enter the Matrix |

### Easter Eggs
- **Welcome banner**: Hacker-style text scramble animation
- **`ls -la`**: Reveals `.classified` hidden file
- **`cat .classified`**: Hints at `hack` command
- **`hack cv.minhan.dev`**: Success finds `/root/hire-me.sh`, fails leak "sudo hire-me"
- **`sudo hire-me`**: 5 animated scenarios + HIRE ME ASCII art → unlocks **hacker theme**
- **11 mini eggs**: `about tldr`, `skills flex`, `experience honest`, `education gpa`, `certifications worth`, `projects broke`, `timeline speedrun`, `contact spam`, `social stalk`, `neofetch btw`, `help 42` (each shows reward like [1/11])

## License

MIT
