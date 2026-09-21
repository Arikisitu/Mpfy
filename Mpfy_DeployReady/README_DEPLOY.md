# Mpfy — Production Deployment

## Architecture
- GitHub: source control
- Vercel: Next.js hosting and API routes
- PostgreSQL: production database
- YouTube Data API v3: optional catalog/search metadata
- YouTube IFrame Player API: playback

## 1. Local verification

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

## 2. Configure PostgreSQL

Create a PostgreSQL database on Neon, Supabase, or another hosted PostgreSQL provider. Copy its connection string into `DATABASE_URL`.

Then apply the schema:

```bash
npx drizzle-kit push
```

Do this once against the production database before using account/library features.

## 3. Environment variables on Vercel

Add:

- `DATABASE_URL`
- `AUTH_SECRET`
- `YOUTUBE_API_KEY` (optional)
- `SMTP_URL` (optional)
- `NEXT_PUBLIC_SITE_URL` (your deployed URL)

Never commit `.env` or real secrets to GitHub.

## 4. Deploy

Push this folder to GitHub, import the repository into Vercel, select Next.js, and deploy.

Vercel automatically runs `npm install` and `npm run build`.

## 5. Verify

Open:

- `/api/health`
- `/`
- `/search`
- `/auth`

`/api/health` should report a healthy application/database after the database is configured.
