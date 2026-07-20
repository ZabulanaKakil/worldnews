import type { FeedState, OlderBatch, NewsArticle } from '../../types/news'

const STORAGE_KEY = 'globebrief_feed_v1'
const SEEN_STORAGE_KEY = 'globebrief_seen_v1'
const MAX_OLDER_BATCHES = 10
const MAX_OLDER_ARTICLES = 200

export interface PersistedFeed {
  older: OlderBatch[]
  newIds: string[]
  lastRefreshedAt: string | null
  previousLiveIds: string[]
}

const emptyPersisted = (): PersistedFeed => ({
  older: [],
  newIds: [],
  lastRefreshedAt: null,
  previousLiveIds: [],
})

export function loadPersistedFeed(): PersistedFeed {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPersisted()
    const parsed = JSON.parse(raw) as PersistedFeed
    return {
      older: Array.isArray(parsed.older) ? parsed.older : [],
      newIds: Array.isArray(parsed.newIds) ? parsed.newIds : [],
      lastRefreshedAt: parsed.lastRefreshedAt ?? null,
      previousLiveIds: Array.isArray(parsed.previousLiveIds)
        ? parsed.previousLiveIds
        : [],
    }
  } catch {
    return emptyPersisted()
  }
}

export function savePersistedFeed(data: PersistedFeed): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Seen list lives in sessionStorage — cleared when the tab/site session ends or site data is cleared. */
export function loadSeenArticles(): NewsArticle[] {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as NewsArticle[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSeenArticles(articles: NewsArticle[]): void {
  sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(articles))
}

/**
 * Archive previous live articles that are NOT still present in the new live feed.
 */
export function archiveLiveBatch(
  previousLive: NewsArticle[],
  older: OlderBatch[],
  newLiveIds: Set<string>,
): OlderBatch[] {
  const toArchive = previousLive.filter((a) => !newLiveIds.has(a.id))
  if (toArchive.length === 0) {
    return pruneOlderAgainstLive(older, newLiveIds)
  }

  const batch: OlderBatch = {
    id: `batch_${Date.now()}`,
    archivedAt: new Date().toISOString(),
    articles: toArchive,
  }

  let next = pruneOlderAgainstLive([batch, ...older], newLiveIds)
  if (next.length > MAX_OLDER_BATCHES) {
    next = next.slice(0, MAX_OLDER_BATCHES)
  }

  let total = next.reduce((sum, b) => sum + b.articles.length, 0)
  while (total > MAX_OLDER_ARTICLES && next.length > 1) {
    const removed = next.pop()
    total -= removed?.articles.length ?? 0
  }

  return next
}

/** Drop any older articles that reappear in Live. */
export function pruneOlderAgainstLive(
  older: OlderBatch[],
  liveIds: Set<string>,
): OlderBatch[] {
  return older
    .map((batch) => ({
      ...batch,
      articles: batch.articles.filter((a) => !liveIds.has(a.id)),
    }))
    .filter((batch) => batch.articles.length > 0)
}

export function toFeedState(
  live: NewsArticle[],
  persisted: PersistedFeed,
  feedGeneratedAt: string | null,
  seen: NewsArticle[] = [],
): FeedState {
  return {
    live,
    older: persisted.older,
    seen,
    newIds: persisted.newIds,
    feedGeneratedAt,
    lastRefreshedAt: persisted.lastRefreshedAt,
  }
}
