import { lazy, Suspense, useMemo, useState } from 'react'
import { CategoryFilter } from './components/CategoryFilter'
import { Header } from './components/Header'
import { NewsDetailModal } from './components/NewsDetailModal'
import { NewsFeed } from './components/NewsFeed'
import { RegionFilter } from './components/RegionFilter'
import { TabNav } from './components/TabNav'
import { useNewsFeed } from './hooks/useNewsFeed'
import { filterArticles, sortByNewest } from './lib/news/filters'
import type { AppTab, CategoryId, NewsArticle, RegionId } from './types/news'

const VisualPanel = lazy(async () => {
  const mod = await import('./components/VisualPanel')
  return { default: mod.VisualPanel }
})

const TAB_COPY: Record<AppTab, { title: string; body: string }> = {
  live: {
    title: 'Live desk',
    body: 'Current batch from the hourly feed. Refresh archives stories that left Live into Older News.',
  },
  older: {
    title: 'Archived refreshes',
    body: 'Stories that dropped out of Live after a refresh. Items still in Live are never duplicated here.',
  },
  seen: {
    title: 'Seen',
    body: 'Marked by you this browser session. Cleared when you close the tab/site or clear site data.',
  },
}

export default function App() {
  const { feed, status, error, refresh, reload, markSeen, unmarkSeen } =
    useNewsFeed()
  const [tab, setTab] = useState<AppTab>('live')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [region, setRegion] = useState<RegionId | 'all'>('all')
  const [detail, setDetail] = useState<NewsArticle | null>(null)

  const newIds = useMemo(() => new Set(feed.newIds), [feed.newIds])
  const seenIds = useMemo(
    () => new Set(feed.seen.map((a) => a.id)),
    [feed.seen],
  )

  const liveArticles = useMemo(
    () =>
      sortByNewest(
        filterArticles(feed.live, category, region).filter(
          (a) => !seenIds.has(a.id),
        ),
      ),
    [feed.live, category, region, seenIds],
  )

  const olderBatches = useMemo(
    () =>
      feed.older
        .map((batch) => ({
          ...batch,
          articles: sortByNewest(
            filterArticles(batch.articles, category, region).filter(
              (a) => !seenIds.has(a.id),
            ),
          ),
        }))
        .filter((batch) => batch.articles.length > 0),
    [feed.older, category, region, seenIds],
  )

  const seenArticles = useMemo(
    () => sortByNewest(filterArticles(feed.seen, category, region)),
    [feed.seen, category, region],
  )

  const olderCount = feed.older.reduce(
    (sum, b) => sum + b.articles.filter((a) => !seenIds.has(a.id)).length,
    0,
  )
  const liveCount = feed.live.filter((a) => !seenIds.has(a.id)).length

  const chartArticles =
    tab === 'live'
      ? liveArticles
      : tab === 'older'
        ? olderBatches.flatMap((b) => b.articles)
        : seenArticles

  const isBusy = status === 'loading' || status === 'refreshing'
  const copy = TAB_COPY[tab]

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />

      <Header
        feedGeneratedAt={feed.feedGeneratedAt}
        lastRefreshedAt={feed.lastRefreshedAt}
        isRefreshing={status === 'refreshing'}
        onRefresh={() => {
          void refresh()
          setTab('live')
        }}
      />

      <TabNav
        tab={tab}
        liveCount={liveCount}
        olderCount={olderCount}
        seenCount={feed.seen.length}
        onChange={setTab}
      />

      <div className="filters">
        <CategoryFilter value={category} onChange={setCategory} />
        <RegionFilter value={region} onChange={setRegion} />
      </div>

      {error && (
        <div className="banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      )}

      {status === 'loading' && (
        <p className="empty-state">Loading world desk…</p>
      )}

      {status !== 'loading' && (
        <div className="desk-layout">
          <main className="feed-column">
            <div className="section-head">
              <h2>{copy.title}</h2>
              <p>{copy.body}</p>
            </div>

            {tab === 'live' && (
              <NewsFeed
                mode="live"
                articles={liveArticles}
                newIds={newIds}
                onDetails={setDetail}
                onMarkSeen={markSeen}
                emptyMessage={
                  isBusy
                    ? 'Updating…'
                    : 'No stories match these filters. Try another topic or region.'
                }
              />
            )}

            {tab === 'older' && (
              <NewsFeed
                mode="older"
                batches={olderBatches}
                onDetails={setDetail}
                onMarkSeen={markSeen}
                emptyMessage="No older news yet. Refresh archives Live stories that are no longer in the new feed."
              />
            )}

            {tab === 'seen' && (
              <NewsFeed
                mode="seen"
                articles={seenArticles}
                newIds={new Set()}
                isSeenList
                onDetails={setDetail}
                onUnmarkSeen={unmarkSeen}
                emptyMessage="Nothing marked seen yet. Use Mark seen on a story card."
              />
            )}
          </main>

          <Suspense
            fallback={
              <aside className="visual-panel">
                <p className="empty-state">Loading visuals…</p>
              </aside>
            }
          >
            <VisualPanel articles={chartArticles} />
          </Suspense>
        </div>
      )}

      <footer className="site-footer">
        <p>
          GlobeBrief pulls public RSS via GitHub Actions into static JSON — no
          backend. Seen items use session storage (cleared when the site session
          ends or site data is cleared).
        </p>
      </footer>

      <NewsDetailModal
        article={detail}
        onClose={() => setDetail(null)}
        onMarkSeen={markSeen}
        isSeen={detail ? seenIds.has(detail.id) : false}
      />
    </div>
  )
}
