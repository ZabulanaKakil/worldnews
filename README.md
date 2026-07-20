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

Live site: **https://zabulanakakil.github.io/worldnews/**

1. Push to `main` — the **Deploy to GitHub Pages** workflow builds `dist/` and pushes it to the `gh-pages` branch.
2. In the repo: **Settings → Pages → Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages` / `/ (root)`
3. Do **not** serve from the `main` branch root — that exposes dev `index.html` instead of the built app.
4. The `Fetch news feed` workflow runs hourly and updates `public/data/news.json` on `main`; push triggers a fresh deploy.

Preview the production build locally:

```bash
npm run build
npm run preview:pages
```

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
