@AGENTS.md

# Harris Website — Terminal CV

## Project
- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL via Prisma 7 + @prisma/adapter-pg
- **Deploy:** Docker + Nginx on VPS
- **Plan:** `../plans/` directory

## Bugs & Lessons Learned

### Prisma 7 Breaking Changes
- **Import path:** Prisma 7 generates to `src/generated/prisma/client.ts` — NOT `src/generated/prisma`. There's no `index.ts`. Import from `@/generated/prisma/client`.
- **Adapter required:** `new PrismaClient()` with zero args fails in v7. Must pass `{ adapter: new PrismaPg(pool) }` using `@prisma/adapter-pg` + `pg` packages.
- **Generated files in .gitignore:** `/src/generated/prisma` is gitignored by default. Run `npx prisma generate` after clone.

### .env.example vs .gitignore
- Default Next.js `.gitignore` uses `.env*` glob which catches `.env.example`. Changed to explicit list: `.env`, `.env.local`, `.env.production`, `.env.development`.

## Code Conventions
- Tailwind v4 uses `@theme inline` blocks in CSS, not `tailwind.config.ts`
- Terminal color tokens: `--term-bg`, `--term-fg`, `--term-prompt`, `--term-accent`, `--term-error`, `--term-warning`, `--term-muted`, `--term-selection`, `--term-border`, `--term-link`
- Tailwind classes: `bg-term-bg`, `text-term-fg`, `text-term-prompt`, etc.
- Font: JetBrains Mono via `next/font/google`, variable `--font-mono`

## Commands
```bash
npm run dev     # Dev server
npm run build   # Production build
npm run lint    # ESLint
npx prisma generate  # Regenerate Prisma client
npx prisma validate  # Validate schema
```
