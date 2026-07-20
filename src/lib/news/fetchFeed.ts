import type { NewsFeedFile } from '../../types/news'

const DATA_URL = `${import.meta.env.BASE_URL}data/news.json`

export async function fetchNewsFeed(cacheBust = false): Promise<NewsFeedFile> {
  const url = cacheBust
    ? `${DATA_URL}?t=${Date.now()}`
    : DATA_URL

  const response = await fetch(url, {
    cache: cacheBust ? 'no-store' : 'default',
  })

  if (!response.ok) {
    throw new Error(`Failed to load news feed (${response.status})`)
  }

  const data = (await response.json()) as NewsFeedFile
  if (!data || !Array.isArray(data.articles)) {
    throw new Error('News feed is malformed')
  }

  return data
}
