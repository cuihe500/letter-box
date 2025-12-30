# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router (RSC by default). API routes live in `app/api/**/route.ts`.
- `lib/`: server utilities (Prisma client in `lib/db.ts`, auth helpers in `lib/auth/*`).
- `prisma/`: database schema (`prisma/schema.prisma`) and migrations.
- `prisma.config.ts`: Prisma CLI config (schema/migrations paths, datasource URL via env).
- `scripts/`: one-off scripts (for example `scripts/seed-users.ts`).
- `public/`: static assets.
- `api-test.http`: REST Client requests for manual API testing.

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run dev`: start the local dev server at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint (Next core-web-vitals + TypeScript rules).

Database/auth setup:
- Put `DATABASE_URL` (MySQL/MariaDB) and `SESSION_SECRET` (32+ chars) in `.env` (recommended for Prisma CLI) or `.env.local` (don’t commit env files).
- Apply migrations: `npx prisma migrate dev`; after schema changes: `npx prisma generate`.
- Seed initial users (interactive): `npm run seed` (or `npx tsx scripts/seed-users.ts`) (creates `admin` and `viewer`).

## Coding Style & Naming Conventions

- TypeScript is `strict`; avoid `any` (use `unknown` + narrowing).
- Prefer Server Components; add `'use client'` only when needed.
- Components: `PascalCase`; files: `kebab-case` (match existing patterns).
- Use the `@/*` import alias (example: `import { prisma } from '@/lib/db'`).

## Testing Guidelines

- No automated test runner yet. Before opening a PR: run `npm run lint` and `npm run build`, then smoke-test auth endpoints with `api-test.http` (VS Code REST Client).

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (`feat: …`, `fix: …`, etc.); existing history uses Chinese summaries—keep consistent.
- PRs: include a short “what/why”, manual test steps, and screenshots for UI changes; call out any Prisma migrations.

## Agent-Specific Instructions

- Read `CLAUDE.md` before substantial changes; it defines UX/RSC/security constraints for this project.
- If a Codex “skill” is mentioned or clearly applicable, open its `SKILL.md` and follow its workflow; prefer existing scripts/templates and keep context minimal.
