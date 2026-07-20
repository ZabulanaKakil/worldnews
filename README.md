# GlobeBrief

Frontend-only world news desk (React + Vite) hosted on **GitHub Pages**. An hourly **GitHub Action** fetches public RSS feeds into `public/data/news.json`. Manual **Refresh** archives the current Live batch into **Older News** (browser `localStorage`) and reloads the static feed; newly arrived stories get a **New** label.

## Categories (v1)

War & Conflict · Diplomacy · Weather & Climate · Technology · Arts & Culture · Economy · Environment · World Politics · Sports · Cybersecurity · AI & Innovation · Disasters

## Local development

```bash
npm install
npm run dev
```

Optional: regenerate the feed locally (network required):

```bash
npm run fetch-news
```

## GitHub Pages setup

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Ensure the default branch is `main` or `master` (deploy workflow listens to both).
4. After the first deploy, open the Pages URL.
5. The `Fetch news feed` workflow runs hourly and on manual dispatch; it commits updated `public/data/news.json`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local Vite server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run fetch-news` | Pull RSS → `public/data/news.json` |

## Board decisions (locked into this build)

1. **IA** — Tabs: Live / Older; category + region filters; card fields; header Refresh + timestamps.
2. **Data** — Actions RSS → JSON schema; client archive + New via `localStorage`.
3. **Visual** — Teal/ink desk theme; Recharts donut/bars; cards for stories & chart blocks; mobile feed-first.
4. **Architecture** — Vite React TS, `base: './'`, `fetch-news.yml` + `deploy.yml`.
5. **Build order** — Scaffold → feed script → Live/filters → Refresh/Older/New → charts → polish.
