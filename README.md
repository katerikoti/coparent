# CoParent

A bilingual (Finnish + English) shared parenting calendar and schedule management PWA.

Repository: https://github.com/katerikoti/coparent

## Current scope

The first implementation follows the product specification. It is intentionally focused on one primary family per signed-in user and common two- parent workflows.

Implemented:
- Registration, login, logout, account recovery emails/logging hook
- Single-user family creation
- Single-use invitation links (copy/paste, no email required)
- Family membership and access control
- Default recurring schedule: every other week, Wednesday 16:00 to Monday 08:00
- Parenting period generation and current parenting status
- Shared calendar, shared events, event editing/deletion
- School holidays as shared events
- Time-balance ledger and summaries
- Change request lifecycle and approval application
- Responsive layout and PWA metadata
- Finnish/English interface, per-user language preference

Intentionally limited in this version:
- One primary family is shown per user after sign-in
- Scheduling settings UI is basic; recurring rules are created with defaults
- Monthly/weekly visual calendar grids are agenda-style lists
- Holiday planner UI is represented through ordinary change requests
- Email delivery for password reset is a development logging hook
- Full auth/permission/holiday automated test suites are documented but not fully implemented

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- PostgreSQL on Neon
- Drizzle ORM
- Better Auth
- next-intl
- Vitest

## Setup

Use the interactive setup script:

```bash
git clone https://github.com/katerikoti/coparent.git
cd coparent
npm install
npm run setup:db
npm run dev
```

Open http://localhost:3000.

The setup script creates `.env.local`, generates a random auth secret, and applies migrations.

## Manual database setup

Create a Neon project, copy its connection string, then create `.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=any-long-random-string
DEFAULT_TIME_ZONE=Europe/Helsinki
```

Run:

```bash
npm run db:migrate
npm run dev
```

## Application flow

1. Visit `/`; signed-out users are redirected to sign in, signed-in users to the dashboard.
2. Register or log in. Navigation is hidden until authentication.
3. Create a family. This also creates the default recurring schedule.
4. Use "Invite other parent" to generate a single-use link.
5. The invited parent must authenticate first, then open and accept the link.
6. Both parents now share the same family, calendar, events, requests, and balance.
7. Use the dashboard for status, pending requests, and shortcuts.
8. Use calendar and events pages to manage shared events.
9. Use requests pages to propose and approve schedule changes.
10. Use balance pages for compensable differences.

## Tests

```bash
npm run test
```

Automated tests currently cover:
- Recurring Wednesday 16:00 to Monday 08:00 schedule behavior
- Half-day balance counting

## Deployment

1. Set the environment variables in Vercel.
2. Run `npm run db:migrate` against the production database.
3. Build and deploy.

## Data and privacy

- Secrets are never committed.
- `.env.local` is ignored.
- Schedule and balance calculations are server-side.
- Family data access is checked through `family_members`.
