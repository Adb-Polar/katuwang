# Deployment Plan

How to take Katuwang from local dev to a publicly reachable URL, using only
free-tier services. Covers two hosting options (Oracle Cloud, Render), a free
MySQL-compatible database (TiDB Cloud Serverless), and a free domain
(`.tech` / `.me` via the GitHub Student Developer Pack).

Status: **planning** — nothing here has been executed yet.

---

## 1. What we are deploying

| Piece | What it is | Where it goes |
|---|---|---|
| **App** | Next.js 16 server (`pnpm build` + `pnpm start`), one long-running Node process | Oracle Cloud VM **or** Render web service |
| **Database** | MySQL 8 / MariaDB-compatible, accessed via Prisma 7 + `@prisma/adapter-mariadb` | TiDB Cloud Serverless (free) — or co-located on the Oracle VM |
| **Email** | Outbound SMTP for password-reset mail (`src/lib/mail.ts`) | Any SMTP provider (Brevo free tier / Gmail App Password) — not hosted by us |
| **Domain** | `katuwang.tech` or `katuwang.me` (final name TBD) | Registered free for 1 year via GitHub Student Pack; DNS managed at the registrar or Cloudflare |

The app is a **normal always-on server**, not serverless. Whichever host we
pick runs `next start` as a persistent process, so the standard Prisma
connection pool works and there is nothing special to configure for database
connections.

### Not in scope / deliberately excluded from the deployed build

- `src/app/dev/`, `src/app/dev/login/`, `src/app/api/dev/` — dev-only, already
  hard-`404` when `NODE_ENV=production`. See §6.
- `prisma/seed.ts` — never run against production.
- `docs/`, `design/`, `*.xlsx` — internal, not needed at runtime.

---

## 2. Hosting option A — Render (recommended for the capstone demo)

**Free "Web Service" tier.** Easiest path, no server administration, no card.

### Characteristics
- Runs the app as a persistent container (`pnpm build` → `pnpm start`).
- **Sleeps after 15 minutes of inactivity**; the next request cold-starts in
  ~30–60 s, then it is fast again until it idles.
- 750 instance-hours / month (enough for one always-registered service).
- Free TLS on the `*.onrender.com` subdomain and on custom domains.
- Auto-deploys on push to a chosen branch.

### Setup steps
1. Push the repo to GitHub (personal account or org — Render has no org
   restriction, unlike Vercel Hobby).
2. Render dashboard → **New → Web Service** → connect the repo.
3. Settings:
   - **Environment:** Node
   - **Build command:** `corepack enable && pnpm install --frozen-lockfile && pnpm build`
   - **Start command:** `pnpm start`
   - **Branch:** `production` (see §8) or `main`
   - **Auto-Deploy:** On
4. Add environment variables (§5).
5. Add a **pre-deploy command** for migrations: `pnpm exec prisma migrate deploy`
   (Render supports a dedicated "Pre-Deploy Command" field).
6. First deploy. Watch the log for a successful `next start` and an open port.
7. Add the custom domain (§7) under **Settings → Custom Domains**; copy the
   CNAME / A record Render shows and set it at the registrar.

### Known limitation to accept
The 15-minute sleep means the first visitor after a quiet period waits up to a
minute. For a defense/demo this is fine (open the URL a few minutes early to
"warm" it). If it becomes a problem, an external uptime pinger (e.g.
UptimeRobot, 5-minute interval) keeps it awake within the 750-hour budget, or
move to Option B.

---

## 3. Hosting option B — Oracle Cloud (always-on, permanent free)

**"Always Free" ARM VM.** No sleep, no monthly hour cap, but you administer a
Linux box.

### Free-tier resources (2026)
| Resource | Always-Free limit |
|---|---|
| Compute (ARM Ampere A1) | 1,500 OCPU-hrs + 9,000 GB-RAM-hrs / month = **2 CPU + 12 GB RAM running 24/7** |
| Block storage | 200 GB total (boot + data) |
| Outbound transfer | 10 TB / month |
| Load balancer | 1 × 10 Mbps (optional; can skip and use nginx) |
| MySQL HeatWave (managed) | 1 node, 50 GB data + 50 GB backup — an alternative to TiDB if we want the DB on Oracle too |

### The one real catch — idle reclamation
An Always-Free VM is **deleted** if, over a rolling 7-day window, it stays
below **20 % CPU, 20 % network, and 20 % memory** (95th percentile). Mitigation:
run the database on the same VM (idle MariaDB holds enough memory to stay above
the 20 % memory floor), and/or a small cron job that generates light periodic
load. Also: signup can be refused for lack of regional ARM capacity — try a
different home region if so.

### Setup steps
1. Create an Oracle Cloud account, pick a home region with Ampere A1 capacity.
2. **Compute → Create Instance:**
   - Shape: `VM.Standard.A1.Flex`, 2 OCPU / 12 GB (or less)
   - Image: Ubuntu 22.04 (or Oracle Linux 9)
   - Add your SSH public key
   - Boot volume: 50 GB is plenty
3. **Networking:** in the VCN's default security list / NSG, open ingress on
   **80** and **443** (SSH 22 is open by default). Do **not** expose 3306.
4. SSH in, then:
   ```bash
   # Node 20 via nvm or nodesource, plus pnpm
   corepack enable
   # MariaDB (if hosting the DB here)
   sudo apt install -y mariadb-server nginx
   sudo mysql_secure_installation
   # create the app DB + user, bound to localhost only
   ```
5. Clone the repo (deploy key), `pnpm install --frozen-lockfile`, set env vars
   in `/etc/katuwang.env` (see §5), `pnpm build`.
6. Run the app under a process manager:
   - **systemd** unit calling `pnpm start` (`EnvironmentFile=/etc/katuwang.env`,
     `Restart=always`), or
   - **pm2** (`pm2 start "pnpm start" --name katuwang && pm2 save`), or
   - **Docker** — add a `Dockerfile` + `output: "standalone"` in
     `next.config.ts` and run `docker compose up -d`.
7. **nginx** reverse proxy: `server_name katuwang.tech;` → `proxy_pass
   http://127.0.0.1:3000;`. Then `certbot --nginx` for free Let's Encrypt TLS
   (auto-renews).
8. Migrations on each release: `pnpm exec prisma migrate deploy` before
   restarting the service.
9. Point the domain's A record at the VM's public IP (§7).

### Deploy/update flow (Option B)
```bash
git pull origin production
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm build
sudo systemctl restart katuwang    # or: pm2 reload katuwang
```
Wrap this in a `deploy.sh` on the VM.

---

## 4. Database — TiDB Cloud Serverless (free)

The MySQL-compatible free database. (Branded "TiDB Cloud Serverless" /
"Starter".) Chosen because our Prisma provider is already `mysql` and the
`@prisma/adapter-mariadb` client just needs a connection string.

### Free tier
- 25 GiB storage, generous monthly request quota, scale-to-zero
- 5 free clusters, no card
- TLS required on all connections
- Built-in connection pooling (irrelevant for our always-on server, but
  harmless)

### Setup steps
1. Sign up at TiDB Cloud, create a **Serverless** cluster (pick the region
   closest to the app host).
2. Set a database user + password. Note the host, port (`4000`), and the
   CA requirement.
3. Create the schema/database (e.g. `katuwang`).
4. Build the connection string for `DATABASE_URL`:
   ```
   mysql://<user>:<password>@<host>:4000/katuwang?ssl={"rejectUnauthorized":true}
   ```
   (TiDB uses public CAs, so no custom CA file is needed on most distros. If
   the driver rejects the cert, download TiDB's CA PEM and point the adapter
   at it.)
5. From a machine with the repo + env set:
   ```bash
   pnpm exec prisma migrate deploy   # creates all tables on the fresh DB
   ```
6. **Do not** run `prisma/seed.ts` against it. If we need a starting admin
   user, insert exactly one by hand or write a tiny one-off script that
   creates only the admin account (bcrypt hash, anon ID) — not the demo data.

### Alternatives (if TiDB doesn't work out)
| Option | Free | Note |
|---|---|---|
| **Oracle MySQL HeatWave** | 50 GB | Only if on Option B — keeps DB + app on Oracle |
| **Self-hosted MariaDB on the Oracle VM** | unlimited (within 200 GB disk) | Simplest for Option B; also helps beat idle-reclaim |
| **Aiven MySQL free plan** | ~1 GB, no backups | Too small once seed + real data grows |
| Neon / Supabase (Postgres) | 0.5 GB | Requires migrating `provider` to `postgresql` + swapping the adapter — more work, not planned |

---

## 5. Environment variables

Set these in the host's env-var UI (Render) or `/etc/katuwang.env` (Oracle).
Never commit them — `.env*` is already git-ignored.

| Variable | Required | Value / notes |
|---|---|---|
| `NODE_ENV` | yes | `production` (Render sets it automatically; set it explicitly on Oracle). Gates the `/dev` routes off. |
| `DATABASE_URL` | yes | TiDB connection string from §4, **or** `mysql://katuwang:<pw>@127.0.0.1:3306/katuwang` for a local MariaDB on the VM |
| `NEXTAUTH_URL` | yes | The final public URL, e.g. `https://katuwang.tech` |
| `NEXTAUTH_SECRET` | yes | Long random string — `openssl rand -base64 32` |
| `SMTP_HOST` | for email | e.g. `smtp-relay.brevo.com` |
| `SMTP_PORT` | for email | `587` |
| `SMTP_USER` | for email | provider login |
| `SMTP_PASS` | for email | provider key / app password |
| `SMTP_SECURE` | optional | `false` for 587 STARTTLS, `true` for 465 |
| `MAIL_FROM` | for email | `Katuwang <no-reply@katuwang.tech>` |

If SMTP vars are unset the app still runs — password-reset links are logged to
the server console instead of emailed (`isMailConfigured()` fallback). Fine for
an early demo, not for real users.

`SEED_*` variables are only read by `prisma/seed.ts` and are irrelevant in
production.

---

## 6. Pre-deployment code changes

Small changes to make before the first deploy. Track each in `Changes.md` and
`docs/TOTEST.txt` when done.

1. **Fix `next.config.ts`.** It currently has both `module.exports = { ... }`
   and `export default nextConfig`. Next 16 reads the ESM default export, so
   the `allowedDevOrigins` block is silently ignored. Merge into one config
   object. If we containerise (Docker on Oracle), also add
   `output: "standalone"`.

2. **Harden the dev-route guard.** `/dev`, `/dev/login`, `/api/dev` already
   check `NODE_ENV === "production"` and 404. Add a second layer in
   `src/proxy.ts` (middleware) that blocks `/dev` and `/api/dev` in production
   regardless, so exposure is not one deleted line away. Add a Vitest case
   asserting the guard exists.

3. **Add an ignore file** so internal files never reach the build context:
   - Render / general: not strictly needed (Render builds from git), but keep
     the repo clean.
   - Docker (Oracle): `.dockerignore` with
     ```
     docs/
     design/
     *.xlsx
     prisma/seed.ts
     src/**/__tests__/
     .env*
     node_modules
     .next
     ```

4. **Confirm the build is green** from a clean checkout:
   `pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm lint &&
   pnpm test && pnpm build`.

5. **Decide the seed story.** Production starts with an empty DB + schema from
   `prisma migrate deploy`. Write a minimal `scripts/create-admin.ts` (admin
   user only) if we need to log in on day one.

---

## 7. Domain — `.tech` / `.me` via GitHub Student Developer Pack

Your `@bicol-u.edu.ph` address qualifies for the Pack.

### Claiming (free for 1 year)
1. Apply once at `education.github.com/pack` with the school email.
2. From the Pack offers, claim either or both:
   - **`.me`** — free 1 year via Namecheap (+ free SSL). Renews ~$4.88/yr.
   - **`.tech`** — free 1 year via get.tech. Renews higher (~$40/yr) — treat
     as demo-period only unless we move it.
3. Pick the name (candidate: `katuwang.tech` / `katuwang.me` — confirm
   availability at claim time).

### DNS wiring
- **Render:** add the domain in Render → Custom Domains; it gives a CNAME
  (for `www` / subdomain) or an ALIAS/A value for the apex. Set those records
  at Namecheap / get.tech. TLS is issued automatically.
- **Oracle VM:** create an **A record** for the apex → the VM's public IP,
  and a CNAME `www` → apex. Then run `certbot --nginx` on the box for TLS.
- Optional: move DNS to Cloudflare (free) for a nicer DNS UI, caching, and
  at-cost renewals later. Not required.

### Catches to remember
- First-year-free, then normal renewal — set a calendar reminder; `.tech` is
  the expensive one to renew.
- 60-day registrar transfer lock after claiming.
- Keep `NEXTAUTH_URL` and `MAIL_FROM` in sync with whichever domain goes live.
- Use `.me` or `.tech` for the real link — avoid ultra-cheap TLDs (`.xyz`,
  `.top`) because the app sends password-reset email and those TLDs have
  weaker deliverability reputation.

---

## 8. Version management / branching

Keep one source of truth; promote by fast-forward, never maintain a divergent
tree.

```
feature/*  →  main  →  production
```

- **`main`** — integration branch, holds everything including `/dev` tooling
  and `docs/`.
- **`production`** — exactly what the host deploys. Only ever fast-forwarded
  from `main` (or pointed at a release tag). No commits that `main` lacks, no
  hand edits, no merge-backs.
- **Promote:** when `main` is green and manually checked,
  `git push origin main:production` (or tag `v1.0.0` and deploy the tag).
- The host (Render auto-deploy, or `git pull` on the Oracle VM) tracks
  `production`.
- Environments differ by **env vars**, not code: a staging deploy (optional,
  from `main`) points at a throwaway TiDB cluster; `production` points at the
  real one.

If we later want the `/dev` files physically absent from the deployed tree,
generate that in CI (a job that strips the paths and force-pushes a `release`
branch) — do not do it by hand. Only meaningful on top of the `NODE_ENV`
guard, not instead of it.

---

## 9. Migrations in production

- Always `pnpm exec prisma migrate deploy` — applies committed migration files
  only, never generates or prompts.
- **Never** `prisma db push` or `prisma migrate dev` against the production DB.
- Order on every release: pull code → `migrate deploy` → `pnpm build` →
  restart. (Render: put `migrate deploy` in the Pre-Deploy Command so a failed
  migration aborts the release.)
- Note: some recent local schema changes (session pre/post-tests, subjects/
  topics) were applied locally via `db push` and may not have a committed
  migration file yet. **Before the first production deploy, reconcile
  `prisma/migrations/` with `schema.prisma`** (generate the missing migration
  with `prisma migrate diff` / `migrate dev` locally, commit it) so
  `migrate deploy` can build the schema from zero. Confirm with the owner
  before running any DB-affecting command.

---

## 10. Post-deploy verification checklist

Add these to `docs/TOTEST.txt` when executing:

- [ ] `https://<domain>` loads over HTTPS, valid cert, no mixed-content warnings
- [ ] `/dev`, `/dev/login`, `/api/dev` all return **404** in production
- [ ] Register a learner → login → land on `/learner`
- [ ] Register a tutor → appears in Admin → Registration Approvals (if the
      approval gate is on)
- [ ] Admin login works; `/admin` dashboard renders with real counts
- [ ] Create a class as a tutor; enrol as a learner; both see it
- [ ] Password-reset: request a link → email arrives (or is logged if SMTP
      unset) → reset works
- [ ] `NEXTAUTH_URL` matches the address in the browser (no callback-URL
      mismatch on login)
- [ ] DB survives a host restart (data persisted, not in-memory)
- [ ] Server logs are visible in the host dashboard / `journalctl`
- [ ] (Render) note the cold-start delay after 15 min idle is acceptable
- [ ] (Oracle) VM stays alive past 7 days — idle-reclaim not triggered

---

## 11. Rollback

- **Code:** `production` is a branch/tag — redeploy the previous commit/tag.
  Render: "Rollback to this deploy" in the dashboard. Oracle: `git checkout`
  the previous tag + rebuild + restart.
- **Database:** `migrate deploy` is forward-only. Before a risky migration,
  take a manual dump (`mysqldump` / TiDB export). There is no automatic
  down-migration.
- Keep the last known-good tag noted in `Changes.md`.

---

## 12. Cost summary & catches

| Item | Cost | Catch |
|---|---|---|
| Render web service | Free | Sleeps after 15 min idle; ~1 min cold start; 750 hrs/mo |
| Oracle Cloud VM | Free forever | You admin Linux; deleted if idle <20% for 7 days; signup capacity varies |
| TiDB Cloud Serverless | Free | 25 GiB cap; TLS mandatory; scale-to-zero adds a small first-query delay |
| `.me` domain | Free 1st year, ~$4.88/yr after | Renewal reminder; 60-day transfer lock |
| `.tech` domain | Free 1st year, ~$40/yr after | Expensive renewal — demo-period only unless moved |
| SMTP (Brevo free) | Free | ~300 emails/day cap; needs sender verification |

**Recommended starting combination:** Render (app) + TiDB Cloud Serverless
(DB) + `.me` domain from the Student Pack. Zero cost through the capstone
defense and evaluation period, minimal setup, no server to babysit. Move the
app to the Oracle VM later if an always-on host is needed for real TRIS use.
