# CoParent

Shared parenting calendar and schedule management PWA (Finnish + English).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- PostgreSQL on Neon
- Drizzle ORM
- Better Auth
- next-intl
- Vitest

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
# edit .env.local with your Neon DATABASE_URL
```

3. Run migrations (requires DATABASE_URL):

```bash
npm run db:migrate
```

Or push schema:
```bash
npm run db:push
```

4. Start dev server:

```bash
npm run dev
```

Open http://localhost:3000 (redirects to /fi).

## Database

Schema lives in `db/schema.ts`. Migrations in `drizzle/`.

## Tests

```bash
npm run test
```

Tests cover the recurring Wednesday→Monday schedule and half-day balance counting.

## Usage

1. Register two accounts.
2. First account creates a family (default recurring schedule applied).
3. Use "Invite other parent" on the dashboard to generate a single-use link.
4. Second account accepts the link (must be authenticated first).
5. Both parents see the shared calendar, events, requests, and balance.

## Deployment (Vercel)

- Set environment variables from `.env.example` in Vercel.
- Add Neon integration.
- Run migrations against the production database.
- Build command: `npm run build`.

## Notes

- Interface languages: Finnish (default) and English, per-user preference stored on the user record.
- Shared event titles and user-authored notes are never translated.
- Offline approvals are not permitted; authoritative data always comes from the server.
