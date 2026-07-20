import { useCallback, useEffect, useState } from 'react'
import { fetchNewsFeed } from '../lib/news/fetchFeed'
import {
  isAuthError,
  pollNewsFeedFromGitHub,
  triggerFetchNewsWorkflow,
} from '../lib/news/githubSync'
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

function applyRefresh(
  data: { articles: NewsArticle[]; generatedAt: string },
  live: NewsArticle[],
  persisted: ReturnType<typeof loadPersistedFeed>,
  seen: NewsArticle[],
) {
  const newLiveIds = new Set(data.articles.map((a) => a.id))
  const archivedOlder = archiveLiveBatch(live, persisted.older, newLiveIds)
  const newIds = data.articles.map((a) => a.id)

  const nextPersisted = {
    older: archivedOlder,
    newIds,
    previousLiveIds: data.articles.map((a) => a.id),
    lastRefreshedAt: new Date().toISOString(),
  }

  savePersistedFeed(nextPersisted)
  return toFeedState(data.articles, nextPersisted, data.generatedAt, seen)
}

export function useNewsFeed() {
  const [feed, setFeed] = useState<FeedState>(() =>
    toFeedState([], loadPersistedFeed(), null, loadSeenArticles()),
  )
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [needsTokenSetup, setNeedsTokenSetup] = useState(false)

  const loadInitial = useCallback(async () => {
    setStatus('loading')
    setError(null)
    setSyncMessage(null)
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
    setSyncMessage('Starting RSS fetch on GitHub…')
    setNeedsTokenSetup(false)

    try {
      const persisted = loadPersistedFeed()
      const seen = loadSeenArticles()
      const previousGeneratedAt = feed.feedGeneratedAt

      await triggerFetchNewsWorkflow()

      const data = await pollNewsFeedFromGitHub(previousGeneratedAt, (msg) => {
        setSyncMessage(msg)
      })

      setSyncMessage(`Loaded ${data.articles.length} stories from GitHub.`)

      setFeed(applyRefresh(data, feed.live, persisted, seen))
      setStatus('idle')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed'
      setError(message)
      if (isAuthError(message)) setNeedsTokenSetup(true)
      setSyncMessage(null)
      setStatus('error')
    }
  }, [feed.live, feed.feedGeneratedAt])

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
    syncMessage,
    needsTokenSetup,
    refresh,
    reload: loadInitial,
    markSeen,
    unmarkSeen,
  }
}
