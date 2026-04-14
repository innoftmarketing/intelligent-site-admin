# Intelligent Website — Admin Panel

Private back-office web panel for the **Intelligent Website** SaaS product.
It talks directly to the same PostgreSQL database that the WhatsApp agent
and Trigger.dev tasks already use — no new data, no new APIs — and gives a
human a screen to manage the clients table without SSHing into the VPS.

## What it does

- **List clients** — searchable table with status badges and live-session indicators
- **Add a client** — full onboarding form mirroring `scripts/onboard-client.ts`
  from the backend (encrypted credentials, bcrypt-hashed PIN)
- **Edit a client** — inline editing of name, WordPress URL, and the entire
  brand profile (tone, language, do-nots, brand colors, etc.)
- **Rotate credentials and PIN** — replace WP API key/secret, reset PIN,
  unlock a locked account, force-end an active WhatsApp session
- **Soft delete / reactivate** — toggle `active` without losing data
- **Browse history** — read-only Conversations tab and Change log tab per client

## Stack

- Next.js 16 (App Router, server components, server actions)
- React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui-style primitives
- `pg` for direct PostgreSQL access (no ORM — matches the backend's style)
- `bcrypt` for PIN hashing
- `zod` for schema validation on forms and server actions
- Web Crypto API (HMAC-SHA256) for the signed admin session cookie —
  works in both the Edge runtime (proxy) and the Node runtime (actions)

## Auth

Single admin password, stored as the `ADMIN_PASSWORD` env var. Submitting
the right password sets a signed cookie that lasts 30 days. The Next.js
`proxy.ts` middleware bounces any unauthenticated request to `/login`.

Ready to upgrade to multi-user later — add a `users` table and swap the
password check for a real sign-in, everything else stays the same.

## Local development

```bash
# 1. Open an SSH tunnel to the production Postgres (in a dedicated terminal)
ssh -i ~/.ssh/paperclip_vps -L 54321:10.0.7.2:5432 -N root@188.245.198.89

# 2. Copy the example env file and fill in the values
cp .env.example .env.local
#    DATABASE_URL=postgresql://paperclip:paperclip@localhost:54321/intelligent_site
#    MASTER_ENCRYPTION_KEY=<same as backend>
#    ADMIN_PASSWORD=changeme
#    SESSION_SECRET=$(openssl rand -hex 32)

# 3. Install and run
yarn install
yarn dev
```

Visit <http://localhost:3000>, login with the admin password, and you're in.

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) for the step-by-step Coolify setup. tl;dr:

1. Push to a GitHub repo
2. New Coolify project → Dockerfile build pack → point at the repo
3. Set the 4 environment variables (same ones as `.env.example`)
4. Route to `admin.innoft.link` (or any other subdomain)
5. Deploy — first build is ~2 minutes, subsequent deploys ~30 seconds

## Project layout

```
app/
  (panel)/            Layout group — all authenticated pages
    clients/
      page.tsx        List view
      new/            Add client form
      [id]/           Client detail
        page.tsx
        conversations/
        changelog/
    layout.tsx        Header with Clients link + Sign out
  login/              Public login page
  logout/             POST route that clears the cookie
  api/health/         DB connectivity probe
components/
  add-client-form.tsx
  clients-table.tsx
  editable-client.tsx
  form-primitives.tsx
  status-badge.tsx
lib/
  db.ts               pg.Pool wrapper
  encryption.ts       AES-256-GCM — mirrors the backend
  auth-helpers.ts     bcrypt.hashPin — mirrors the backend
  session.ts          Web Crypto HMAC cookie helper
  clients.ts          Server-only DB queries
  clients-shared.ts   Pure types + helpers (client components can import)
  client-schema.ts    Zod validation shared between add and edit
  history.ts          Conversations + change_log queries
proxy.ts              Next.js middleware (auth bounce)
Dockerfile            Multi-stage, Next.js standalone output
DEPLOY.md             Coolify step-by-step
```

## Safety notes

- The panel writes directly to the **production** database. There's no
  separate dev/staging — every "Save changes" hits real data.
- The `MASTER_ENCRYPTION_KEY` now lives in two places (backend + panel).
  Any rotation must update both environments in lockstep.
- Every operational action is reversible: soft delete flips `active`,
  unlock clears the lock columns, end session NULLs the token. No hard
  deletes from the panel.
