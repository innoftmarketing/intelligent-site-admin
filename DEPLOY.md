# Deploying the Admin Panel

Private back-office panel for the Intelligent Website product. Deployed as a
Docker container via Coolify on the same Hetzner VPS that runs the WhatsApp
backend.

## One-time setup

1. **Create a GitHub repository** (private recommended) for this codebase.
   Suggested name: `innoftmarketing/intelligent-site-admin`.

2. **Push this folder to that repo:**
   ```
   cd /Users/iliaselguerouahi/Desktop/PROJECTS/Site_Inteligent/admin-panel
   git add .
   git commit -m "Initial admin panel — CRUD, auth, history, deploy"
   git branch -M main
   git remote add origin git@github.com:innoftmarketing/intelligent-site-admin.git
   git push -u origin main
   ```

3. **In Coolify** (https://188.245.198.89:8000):
   - Create a new project → New resource → Public or Private Git repository
   - Source: the new GitHub repo, branch `main`
   - Build pack: `Dockerfile`
   - Dockerfile path: `Dockerfile` (repo root)
   - Exposed port: `3000`
   - Domain: `admin.innoft.link` (or any subdomain you can route)

4. **Environment variables in Coolify** (use `.env.example` as reference):
   - `DATABASE_URL=postgresql://paperclip:paperclip@db-lvqfh3pwp2pqs6qnhrvdm6ct:5432/intelligent_site`
   - `MASTER_ENCRYPTION_KEY=<same value as the backend .env>`
   - `ADMIN_PASSWORD=<pick a strong password>`
   - `SESSION_SECRET=<run: openssl rand -hex 32>`
   - `NODE_ENV=production`

5. **Network:** Make sure the admin panel container is on the same Docker
   network as the existing Postgres container so `db-lvqfh3pwp2pqs6qnhrvdm6ct`
   resolves. In Coolify this is typically automatic if both live in the
   same project.

6. **Deploy.** Coolify will build the Dockerfile and start the container.
   First build takes ~2 minutes; subsequent deploys are ~30 seconds thanks
   to Docker layer caching.

## Updating

Any `git push origin main` triggers a redeploy automatically through Coolify's
webhook integration (same pattern as the backend).

## Local development

```
# In one terminal: open the SSH tunnel to production Postgres
ssh -i ~/.ssh/paperclip_vps -L 54321:10.0.7.2:5432 -N root@188.245.198.89

# In another terminal: start the dev server
yarn dev
```

Then visit http://localhost:3000 — login password is whatever you set in
`.env.local` as `ADMIN_PASSWORD`.

## Production smoke test

After deploy, run through this checklist:

1. `curl https://admin.innoft.link/api/health` → `{"status":"ok","clientCount":N}`
2. Visit `https://admin.innoft.link` → redirects to `/login`
3. Enter admin password → lands on `/clients` showing at least the two existing clients
4. Open any client → all sections render, edit button works, brand-color swatches show
5. Conversations and Change log tabs → render (may be empty for the second test client)
6. Add Client form → submit with fake data → row appears in list and in Postgres
7. Check backend docker logs for errors: `docker logs --tail 100 intelligent-site-backend`

## Rolling back

Since the panel is stateless (it just reads/writes the existing database),
rolling back is just a `git revert` + `git push`. No data migration to undo.
