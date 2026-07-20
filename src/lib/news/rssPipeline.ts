import type { CategoryId, NewsArticle, NewsFeedFile, RegionId } from '../../types/news'

export const MAX_PER_CATEGORY = 8
export const MAX_TOTAL = 96

export interface FeedSource {
  source: string
  url: string
  category: CategoryId
  region?: RegionId
}

export const FEEDS: FeedSource[] = [
  { source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world_politics' },
  { source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'war_conflict' },
  { source: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'diplomacy' },
  { source: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'weather_climate' },
  { source: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology' },
  { source: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology' },
  { source: 'The Guardian Culture', url: 'https://www.theguardian.com/culture/rss', category: 'creativity_arts' },
  { source: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'economy_business' },
  { source: 'The Guardian Environment', url: 'https://www.theguardian.com/environment/rss', category: 'environment' },
  { source: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports' },
  { source: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'cybersecurity' },
  { source: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'cybersecurity' },
  { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'ai_innovation' },
  { source: 'ReliefWeb', url: 'https://reliefweb.int/updates/rss.xml', category: 'disasters' },
  { source: 'BD24Live', url: 'https://www.bd24live.com/feed', category: 'world_politics', region: 'bangladesh' },
  { source: 'Prothom Alo', url: 'https://www.prothomalo.com/feed/', category: 'world_politics', region: 'bangladesh' },
]

const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  war_conflict: ['war', 'conflict', 'military', 'missile', 'troops', 'invasion', 'ceasefire', 'airstrike', 'battlefield', 'armed'],
  diplomacy: ['diplomat', 'embassy', 'summit', 'treaty', 'sanctions', 'negotiation', 'foreign minister', 'geopolitic', 'alliance'],
  weather_climate: ['weather', 'climate', 'storm', 'hurricane', 'heatwave', 'rainfall', 'temperature', 'flood forecast', 'drought'],
  technology: ['tech', 'software', 'chip', 'smartphone', 'startup', 'gadget', 'internet', 'digital'],
  creativity_arts: ['art', 'museum', 'film', 'music', 'theatre', 'culture', 'festival', 'novel', 'exhibition'],
  economy_business: ['economy', 'market', 'stock', 'inflation', 'trade', 'bank', 'gdp', 'business', ' ent'],
  environment: ['environment', 'emission', 'renewable', 'wildlife', 'pollution', 'biodiversity', 'carbon', 'energy'],
  world_politics: ['election', 'parliament', 'president', 'prime minister', 'government', 'vote', 'legislation', 'policy'],
  sports: ['football', 'soccer', 'olympic', 'tennis', 'cricket', 'championship', 'match', 'league', 'athlete'],
  cybersecurity: ['cyber', 'hack', 'malware', 'ransomware', 'breach', 'phishing', 'vulnerability', 'security flaw'],
  ai_innovation: ['artificial intelligence', ' ai ', 'machine learning', 'chatgpt', 'openai', 'llm', 'robot', 'automation'],
  disasters: ['earthquake', 'tsunami', 'wildfire', 'disaster', 'emergency', 'evacuation', 'landslide', 'humanitarian', 'casualty'],
}

const REGION_KEYWORDS: Record<Exclude<RegionId, 'global'>, string[]> = {
  americas: ['united states', 'u.s.', 'usa', 'america', 'canada', 'mexico', 'brazil', 'argentina', 'washington', 'ottawa', 'latin america'],
  europe: ['europe', 'eu ', 'uk ', 'britain', 'france', 'germany', 'italy', 'spain', 'ukraine', 'russia', 'london', 'paris', 'berlin', 'brussels'],
  africa: ['africa', 'nigeria', 'kenya', 'egypt', 'south africa', 'ethiopia', 'sudan', 'ghana', 'morocco'],
  middle_east: ['israel', 'gaza', 'iran', 'iraq', 'syria', 'saudi', 'yemen', 'lebanon', 'qatar', 'turkey', 'middle east'],
  asia_pacific: ['china', 'japan', 'india', 'korea', 'taiwan', 'australia', 'indonesia', 'pakistan', 'philippines', 'vietnam', 'asia', 'pacific'],
  bangladesh: ['bangladesh', 'dhaka', 'chittagong', 'chattogram', 'sylhet', 'khulna', 'rajshahi', 'bengali', 'bangla', 'padma', 'jamuna'],
}

function stripHtml(html = ''): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function textContent(el: Element | null): string {
  return el?.textContent?.trim() ?? ''
}

async function hashId(url: string, title: string): Promise<string> {
  const data = new TextEncoder().encode(`${url}|${title}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

function inferCategory(text: string, fallback: CategoryId): CategoryId {
  const hay = ` ${text.toLowerCase()} `
  let best = fallback
  let bestScore = 0
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [CategoryId, string[]][]) {
    let score = 0
    for (const w of words) {
      if (hay.includes(w)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }
  return best
}

function inferRegion(text: string): RegionId {
  const hay = text.toLowerCase()
  let best: RegionId = 'global'
  let bestScore = 0
  for (const [region, words] of Object.entries(REGION_KEYWORDS) as [Exclude<RegionId, 'global'>, string[]][]) {
    let score = 0
    for (const w of words) {
      if (hay.includes(w)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = region
    }
  }
  return best
}

async function fetchRssXml(feedUrl: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.text()
}

function parseRssItems(xml: string, feed: FeedSource): Omit<NewsArticle, 'id'>[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid RSS XML')
  }

  const nodes = [...doc.querySelectorAll('item'), ...doc.querySelectorAll('entry')]
  return nodes.slice(0, 12).map((node) => {
    const title = textContent(node.querySelector('title')) || 'Untitled'
    const url =
      textContent(node.querySelector('link[href]')) ||
      node.querySelector('link')?.getAttribute('href') ||
      textContent(node.querySelector('link')) ||
      textContent(node.querySelector('guid')) ||
      feed.url
    const summary = stripHtml(
      textContent(node.querySelector('description')) ||
        textContent(node.querySelector('summary')) ||
        textContent(node.querySelector('content\\:encoded')) ||
        textContent(node.querySelector('encoded')),
    )
    const publishedRaw =
      textContent(node.querySelector('pubDate')) ||
      textContent(node.querySelector('published')) ||
      textContent(node.querySelector('updated')) ||
      new Date().toISOString()
    const parsedDate = new Date(publishedRaw)
    const publishedAt = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString()
    const blob = `${title} ${summary}`

    return {
      title,
      url,
      source: feed.source,
      category: inferCategory(blob, feed.category),
      region: feed.region ?? inferRegion(blob),
      publishedAt,
      summary: summary.slice(0, 420),
    }
  })
}

async function fetchFeedArticles(feed: FeedSource): Promise<NewsArticle[]> {
  try {
    const xml = await fetchRssXml(feed.url)
    const items = parseRssItems(xml, feed)
    const articles: NewsArticle[] = []
    for (const item of items) {
      articles.push({ ...item, id: await hashId(item.url, item.title) })
    }
    return articles
  } catch (err) {
    console.warn(`Feed failed: ${feed.source}`, err)
    return []
  }
}

export function aggregateArticles(merged: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  const deduped: NewsArticle[] = []
  for (const article of merged) {
    if (seen.has(article.url)) continue
    seen.add(article.url)
    deduped.push(article)
  }

  const byCategory = new Map<CategoryId, NewsArticle[]>()
  for (const article of deduped) {
    const list = byCategory.get(article.category) ?? []
    if (list.length < MAX_PER_CATEGORY) {
      list.push(article)
      byCategory.set(article.category, list)
    }
  }

  const reservedBd = deduped.filter((a) => a.region === 'bangladesh').slice(0, 10)
  const reservedIds = new Set(reservedBd.map((a) => a.id))

  let articles = [
    ...reservedBd,
    ...[...byCategory.values()].flat().filter((a) => !reservedIds.has(a.id)),
  ]
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
  return articles.slice(0, MAX_TOTAL)
}

export async function fetchLiveRssFeed(): Promise<NewsFeedFile> {
  const batches = await Promise.all(FEEDS.map(fetchFeedArticles))
  const articles = aggregateArticles(batches.flat())
  return {
    generatedAt: new Date().toISOString(),
    articles,
  }
}
