# Mpfy — Your Clean Music Experience

Mpfy is an AI-built music discovery and playback web app: clean, fast, distraction-free.
It combines Apple-style polish, YouTube Music-style discovery and Spotify-style library
management into one original product.

> Built with AI-assisted development, human direction, and open web technologies.
> Not affiliated with YouTube, Apple, Spotify or MetroList.

## Features

- Three switchable appearance modes (Apple-inspired, YouTube Music-inspired, Spotify-inspired) + Dark / Light / AMOLED / System themes, persisted in localStorage
- Home dashboard with hero, quick access, trending, new releases, artists, curated playlists and a recommended mix
- Global debounced search across songs, artists, albums, playlists and videos with keyboard navigation, recent searches, skeletons and graceful errors
- Persistent mini-player, full-screen player and a professional queue (play next, reorder, remove, clear, save as playlist, shuffle)
- Library: liked songs, albums, artists, playlists (create / rename / delete / reorder), history, favorites
- Guest mode (localStorage) + accounts (sign up / login / logout / password reset) with server-synced libraries
- Installable PWA with offline shell, sitemap, robots.txt and SEO metadata
- **No third-party advertising UI in Mpfy itself.** Playback runs through YouTube's
  official IFrame embed; YouTube may apply its own policies inside the embed.

## 1. Installation

```bash
npm install
```

## 2. Environment variables

```bash
cp .env.example .env
```

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes (prod) | Signs session JWTs |
| `YOUTUBE_API_KEY` | no | Live metadata via YouTube Data API v3; demo catalog used otherwise |
| `SMTP_URL` | no | Enables real password-reset emails (demo code fallback otherwise) |

Secrets are read server-side only (`process.env`) and never shipped to the browser.

## 3. YouTube API setup

1. Create a project at <https://console.cloud.google.com>.
2. Enable **YouTube Data API v3** and create an API key.
3. Put it in `YOUTUBE_API_KEY`.

Playback uses the official **YouTube IFrame Player API** — no scraping, no stream
extraction, no ad blocking, no re-hosting. If a video's owner disabled embedding,
Mpfy shows “Playback unavailable for this track” and skips ahead.

## 4. Database setup

```bash
npx drizzle-kit push   # applies src/db/schema.ts to DATABASE_URL
```

Tables: `users`, `reset_requests`, `playlists`, `playlist_tracks`, `likes`, `history`.

## 5. Authentication setup

Sessions are signed JWTs in an httpOnly cookie (`AUTH_SECRET`). Passwords are
scrypt-hashed. Guests can import their local likes/history/playlists into their
account at first login automatically.

## 6. Development

```bash
npm run dev
```

## 7. Production build

```bash
npm run build
npm start
```

## 8. Deployment

Any Node.js host with PostgreSQL works (Vercel + managed Postgres, Railway, Fly.io…).
Set the environment variables above, run `drizzle-kit push`, then deploy the build.
`/api/health` is provided for load-balancer health checks.

## 9. Third-party services

- **YouTube / YouTube Data API v3** — metadata + official embed playback (Google LLC)
- **PostgreSQL + Drizzle ORM** — persistence
- Hosting & analytics providers of your choice (analytics off by default)

Mpfy does not imply endorsement by any of these services.

## 10. Legal considerations

Legal pages ship at `/legal/*` (About, Terms, Privacy, Copyright/DMCA, Third-party)
and are clearly labeled **templates** — review them for your business, jurisdiction
and actual service configuration before production use. Mpfy claims no ownership of
third-party music and never stores or re-streams copyrighted audio.

## Project structure

```
src/
  app/            # Next.js App Router pages + API routes
    api/          # auth, music, playlists, library, health
  components/     # reusable UI (cards, player, dialogs, layout…)
  services/       # music data adapter (YouTube API / demo catalog)
  state/          # zustand stores (player, library, settings, dialogs, toasts)
  lib/            # auth, rate limiting, yt embed engine, api client
  db/             # drizzle schema + client
  types/          # shared typed models
public/           # PWA manifest, icons, service worker, robots, sitemap
```
