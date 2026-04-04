# PERFIN — personal finance

Next.js app for multi-user income and expense tracking (USD), monthly dashboard, fixed vs variable expenses, and salary vs other income.

- **UI:** English  
- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind, Prisma 5, PostgreSQL (e.g. [Railway](https://railway.app/)), session cookies signed with [jose](https://github.com/panva/jose) (`AUTH_SECRET`)

See also `AGENTS.md` and `docs/PLAN_FINANZAS_PERSONALES.md`.

## Local setup

1. Copy environment file and fill values:

   ```bash
   copy .env.example .env
   ```

2. In **Railway**, add a **PostgreSQL** plugin (or use an existing database), open **Variables** / **Connect** and copy the **Postgres connection URL** (often labeled `DATABASE_URL` or `POSTGRES_URL`). Set:

   - `DATABASE_URL` — full PostgreSQL URL (Railway usually provides it with user, password, host, port, and DB name; add `?sslmode=require` only if your client fails without SSL)
   - `AUTH_SECRET` — at least 16 random characters, e.g.  
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

3. Push the schema and run the dev server:

   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), register, then use **Dashboard** for the current month.

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run db:push` | Apply `schema.prisma` to the database (dev) |
| `npm run db:studio` | Prisma Studio |

## Deploy (Vercel + Railway Postgres)

Later: connect the Git repo to Vercel, set `DATABASE_URL` and `AUTH_SECRET` in the Vercel project settings (use your Railway **production** database URL if it differs from local).
