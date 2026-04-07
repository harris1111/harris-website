@AGENTS.md

# Harris Website — Terminal CV

## Project
- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL via Prisma 7 + @prisma/adapter-pg
- **Deploy:** Docker + Nginx on VPS
- **Repo:** harris1111/harris-website

## Architecture

```
src/
├── app/                  # Next.js App Router
│   ├── page.tsx          # Terminal (main page)
│   ├── about/page.tsx    # Full CV page (terminal style, scrollable)
│   ├── blog/page.tsx     # Blog listing page
│   ├── blog/[slug]/      # Individual blog post (SSG)
│   ├── api/blog/         # Blog API (list + single post)
│   ├── api/guestbook/    # Guestbook CRUD API
│   ├── api/health/       # Health check endpoint
│   ├── layout.tsx        # Root layout (fonts, JSON-LD, meta)
│   ├── globals.css       # CSS variables, theme tokens, scrollbar
│   ├── sitemap.ts        # Dynamic sitemap
│   └── robots.ts         # robots.txt
├── commands/             # Terminal command handlers (one per file)
│   ├── registry.ts       # Command registry + parser + tab completion
│   ├── builtin.ts        # help, clear, whoami, echo, man + registers all
│   ├── about.ts          # Profile summary
│   ├── skills.ts         # Skills table (supports category filter)
│   ├── experience.ts     # Work history (supports company filter)
│   ├── education.ts
│   ├── contact.ts
│   ├── social.ts
│   ├── certifications.ts
│   ├── projects.ts
│   ├── timeline.ts       # ASCII career timeline
│   ├── download-cv.ts    # Triggers PDF download
│   ├── history-cmd.ts    # Shows command history
│   ├── filesystem.ts     # cd, ls, cat, pwd, tree
│   ├── theme.ts          # Theme switching
│   ├── blog.ts           # Blog list/view (fetches from API)
│   ├── guestbook.ts      # Guestbook read/write (fetches from API)
│   ├── easter-eggs.ts    # neofetch, cowsay, fortune, sudo, matrix, date, uname
│   ├── open.ts           # Navigate to /about, /blog, /home
│   └── format-helpers.tsx # Shared JSX formatting components
├── components/
│   ├── terminal.tsx       # Main terminal container + welcome animation
│   ├── terminal-input.tsx # Inline prompt + input + keyboard handlers
│   ├── terminal-output.tsx# Renders output entries
│   └── crt-overlay.tsx    # CRT scanlines for matrix theme
├── hooks/
│   ├── use-terminal.ts    # Terminal state (outputs, history, cwd, theme)
│   └── use-typewriter.ts  # Character-by-character typing animation
├── data/
│   ├── profile.ts         # All CV data (SINGLE SOURCE OF TRUTH)
│   ├── filesystem.ts      # Virtual filesystem tree + path resolver
│   ├── ascii-banner.ts    # Welcome banner + lines
│   └── quotes.ts          # Fortune quotes
├── themes/
│   └── themes.ts          # 5 theme definitions + applyTheme()
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── blog.ts            # Blog post loader (fs-based, build-time)
│   ├── rate-limit.ts      # In-memory rate limiter
│   └── profanity-filter.ts# Word list filter + HTML sanitizer
├── types/
│   └── index.ts           # All TypeScript interfaces
└── generated/prisma/      # Prisma generated client (gitignored)

content/blog/              # Markdown blog posts (frontmatter + content)
docker/
├── Dockerfile             # Multi-stage (standalone output)
├── docker-compose.yml     # App + PostgreSQL + Nginx
└── nginx.conf             # Reverse proxy, caching, gzip
.github/workflows/
└── deploy.yml             # CI/CD: lint → build → Docker push to ghcr.io
```

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Terminal (main experience) |
| `/about` | Static | Full CV in terminal style |
| `/blog` | Static | Blog listing page |
| `/blog/[slug]` | SSG | Individual blog posts |
| `/api/blog` | Dynamic | Blog list JSON |
| `/api/blog/[slug]` | Dynamic | Single blog post JSON |
| `/api/guestbook` | Dynamic | GET entries / POST new entry |
| `/api/health` | Dynamic | Health check |
| `/sitemap.xml` | Static | Sitemap |
| `/robots.txt` | Static | Robots |

## Bugs & Lessons Learned

### Prisma 7 Breaking Changes
- **Import path:** Prisma 7 generates to `src/generated/prisma/client.ts` — NOT `src/generated/prisma`. No `index.ts`. Import from `@/generated/prisma/client`.
- **Adapter required:** `new PrismaClient()` with zero args fails in v7. Must pass `{ adapter: new PrismaPg(pool) }` using `@prisma/adapter-pg` + `pg`.
- **Generated files gitignored:** `/src/generated/prisma` is in .gitignore. Run `npx prisma generate` after clone.

### .env.example vs .gitignore
- Default Next.js `.gitignore` uses `.env*` glob which catches `.env.example`. Changed to explicit list.

### Next.js 16 Standalone Output
- `output: "standalone"` in next.config.ts required for Docker.
- Produces `.next/standalone/server.js` as entry point.

### Command Context Mutations
- React state can't be mutated via `ctx.cwd = value` in command handlers.
- Must pass setter functions in TerminalContext (e.g., `setCwd`, `setTheme`).

### Layout overflow
- Don't put `overflow: hidden` or `h-full` on `<html>` or `<body>` — it blocks scrolling on non-terminal pages (`/about`, `/blog`).
- Terminal page handles its own viewport via `h-dvh overflow-y-auto` on its container.
- Body uses `min-h-screen`.

## Design Decisions

### Terminal Layout
- Input is **inline** after output (like a real terminal), NOT pinned at bottom
- Everything flows in one scrollable `div` with `h-dvh overflow-y-auto`
- Auto-scrolls to bottom on new output via `scrollIntoView`
- Prompt format: `harris@cv:{cwd}$\u00A0` (non-breaking space before cursor)

### Command System
- Commands register via side-effect `require()` imports in `builtin.ts` (not ES imports)
- Each command file calls `register()` at module load time
- `--help` flag handled globally in `registry.ts execute()` — no per-command logic needed
- Commands that need browser APIs (download-cv, open) check `typeof window !== "undefined"`

### Client-Server Boundary
- Blog and guestbook commands run **client-side** — they `fetch()` from API routes
- Blog loader (`src/lib/blog.ts`) uses `fs` — server-only (API routes + SSG pages)
- Profile data (`src/data/profile.ts`) is imported directly — works both sides

### Guestbook Operations
- Rate limiter is **in-memory Map** — resets on server restart (acceptable for single-instance)
- IP extracted from `x-forwarded-for` header (set by Nginx)
- 1 entry per IP per hour

## Code Conventions

### Theming
- CSS variables on `:root`: `--term-bg`, `--term-fg`, `--term-prompt`, `--term-accent`, `--term-error`, `--term-warning`, `--term-muted`, `--term-selection`, `--term-border`, `--term-link`
- Tailwind v4 `@theme inline` block maps vars to `bg-term-bg`, `text-term-fg`, etc.
- Theme switching: `applyTheme(name)` sets CSS vars + saves to localStorage
- 5 themes: dark (default), light, nord-dark, nord-light, matrix

### Adding Commands
1. Create `src/commands/your-command.ts`
2. Import and call `register()` from `./registry`
3. Add `require("./your-command")` in `builtin.ts` → `registerAllCommands()`

### Adding Blog Posts
1. Create `content/blog/your-slug.md` with frontmatter
2. `published: true` to show, `false` to hide
3. Rebuild — post appears in terminal `blog` command, `/blog` listing, and `/blog/your-slug`

### Profile Data
- **Single source of truth:** `src/data/profile.ts`
- All commands, filesystem, /about page read from this file
- Update profile.ts when CV changes — everything else reflects automatically

### Key Dependencies
- `gray-matter` — blog frontmatter parsing (server-side only)
- `@prisma/adapter-pg` + `pg` — Prisma 7 PostgreSQL driver
- `next-mdx-remote` + `shiki` — installed but blog currently renders raw markdown (MDX rendering available for future enhancement)

### File Naming
- Commands: kebab-case (`easter-eggs.ts`, `download-cv.ts`, `history-cmd.ts`)
- Components: kebab-case (`terminal-input.tsx`, `crt-overlay.tsx`)
- Data/hooks: kebab-case (`use-terminal.ts`, `ascii-banner.ts`)

## Commands
```bash
npm run dev              # Dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx prisma generate     # Regenerate Prisma client (after clone)
npx prisma validate     # Validate schema
npx prisma migrate deploy  # Run migrations (production)
npx gitnexus analyze    # Re-index codebase for GitNexus
```

## Docker
```bash
cd docker
export POSTGRES_PASSWORD=your-password
docker compose up -d
docker exec harris-website npx prisma migrate deploy
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **harris-website** (253 symbols, 434 relationships, 15 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/harris-website/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/harris-website/context` | Codebase overview, check index freshness |
| `gitnexus://repo/harris-website/clusters` | All functional areas |
| `gitnexus://repo/harris-website/processes` | All execution flows |
| `gitnexus://repo/harris-website/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
