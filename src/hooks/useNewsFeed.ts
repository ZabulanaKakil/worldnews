import { useCallback, useEffect, useState } from 'react'
import { fetchNewsFeed } from '../lib/news/fetchFeed'
import {
  archiveLiveBatch,
  loadPersistedFeed,
  loadSeenArticles,
  pruneOlderAgainstLive,
  savePersistedFeed,
  saveSeenArticles,
  toFeedState,
} from '../lib/news/storage'
import type { FeedState, NewsArticle } from '../types/news'

type Status = 'idle' | 'loading' | 'refreshing' | 'error'

export function useNewsFeed() {
  const [feed, setFeed] = useState<FeedState>(() =>
    toFeedState([], loadPersistedFeed(), null, loadSeenArticles()),
  )
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const loadInitial = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const data = await fetchNewsFeed(false)
      const persisted = loadPersistedFeed()
      const seen = loadSeenArticles()
      const liveIds = new Set(data.articles.map((a) => a.id))

      if (persisted.previousLiveIds.length === 0) {
        const nextPersisted = {
          ...persisted,
          older: pruneOlderAgainstLive(persisted.older, liveIds),
          newIds: [],
          previousLiveIds: data.articles.map((a) => a.id),
          lastRefreshedAt: new Date().toISOString(),
        }
        savePersistedFeed(nextPersisted)
        setFeed(toFeedState(data.articles, nextPersisted, data.generatedAt, seen))
      } else {
        const previous = new Set(persisted.previousLiveIds)
        const arrived = data.articles
          .filter((a) => !previous.has(a.id))
          .map((a) => a.id)
        const newIds = [...new Set([...persisted.newIds, ...arrived])]
        const nextPersisted = {
          ...persisted,
          older: pruneOlderAgainstLive(persisted.older, liveIds),
          newIds,
        }
        savePersistedFeed(nextPersisted)
        setFeed(toFeedState(data.articles, nextPersisted, data.generatedAt, seen))
      }

      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load news')
      setStatus('error')
    }
  }, [])

  const refresh = useCallback(async () => {
    setStatus('refreshing')
    setError(null)
    try {
      const persisted = loadPersistedFeed()
      const seen = loadSeenArticles()
      const data = await fetchNewsFeed(true)
      const newLiveIds = new Set(data.articles.map((a) => a.id))
      const archivedOlder = archiveLiveBatch(
        feed.live,
        persisted.older,
        newLiveIds,
      )

      const newIds = data.articles.map((a) => a.id)

      const nextPersisted = {
        older: archivedOlder,
        newIds,
        previousLiveIds: data.articles.map((a) => a.id),
        lastRefreshedAt: new Date().toISOString(),
      }

      savePersistedFeed(nextPersisted)
      setFeed(toFeedState(data.articles, nextPersisted, data.generatedAt, seen))
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
      setStatus('error')
    }
  }, [feed.live])

  const markSeen = useCallback((article: NewsArticle) => {
    setFeed((prev) => {
      if (prev.seen.some((a) => a.id === article.id)) return prev
      const seen = [article, ...prev.seen]
      saveSeenArticles(seen)
      return { ...prev, seen }
    })
  }, [])

  const unmarkSeen = useCallback((articleId: string) => {
    setFeed((prev) => {
      const seen = prev.seen.filter((a) => a.id !== articleId)
      saveSeenArticles(seen)
      return { ...prev, seen }
    })
  }, [])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  return {
    feed,
    status,
    error,
    refresh,
    reload: loadInitial,
    markSeen,
    unmarkSeen,
  }
}
