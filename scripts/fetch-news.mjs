/**
 * Hourly GitHub Action / local script:
 * Fetches RSS feeds, normalizes into public/data/news.json
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Parser from 'rss-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'news.json')
const MAX_PER_CATEGORY = 8
const MAX_TOTAL = 96

const FEEDS = [
  {
    source: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world_politics',
  },
  {
    source: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'war_conflict',
  },
  {
    source: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    category: 'diplomacy',
  },
  {
    source: 'BBC Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'weather_climate',
  },
  {
    source: 'BBC Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    category: 'technology',
  },
  {
    source: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'technology',
  },
  {
    source: 'The Guardian Culture',
    url: 'https://www.theguardian.com/culture/rss',
    category: 'creativity_arts',
  },
  {
    source: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'economy_business',
  },
  {
    source: 'The Guardian Environment',
    url: 'https://www.theguardian.com/environment/rss',
    category: 'environment',
  },
  {
    source: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    category: 'sports',
  },
  {
    source: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    category: 'cybersecurity',
  },
  {
    source: 'BleepingComputer',
    url: 'https://www.bleepingcomputer.com/feed/',
    category: 'cybersecurity',
  },
  {
    source: 'MIT Tech Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'ai_innovation',
  },
  {
    source: 'ReliefWeb',
    url: 'https://reliefweb.int/updates/rss.xml',
    category: 'disasters',
  },
  {
    source: 'BD24Live',
    url: 'https://www.bd24live.com/feed',
    category: 'world_politics',
    region: 'bangladesh',
  },
  {
    source: 'Prothom Alo',
    url: 'https://www.prothomalo.com/feed/',
    category: 'world_politics',
    region: 'bangladesh',
  },
]

const CATEGORY_KEYWORDS = {
  war_conflict: [
    'war',
    'conflict',
    'military',
    'missile',
    'troops',
    'invasion',
    'ceasefire',
    'airstrike',
    'battlefield',
    'armed',
  ],
  diplomacy: [
    'diplomat',
    'embassy',
    'summit',
    'treaty',
    'sanctions',
    'negotiation',
    'foreign minister',
    'geopolitic',
    'alliance',
  ],
  weather_climate: [
    'weather',
    'climate',
    'storm',
    'hurricane',
    'heatwave',
    'rainfall',
    'temperature',
    'flood forecast',
    'drought',
  ],
  technology: [
    'tech',
    'software',
    'chip',
    'smartphone',
    'startup',
    'gadget',
    'internet',
    'digital',
  ],
  creativity_arts: [
    'art',
    'museum',
    'film',
    'music',
    'theatre',
    'culture',
    'festival',
    'novel',
    'exhibition',
  ],
  economy_business: [
    'economy',
    'market',
    'stock',
    'inflation',
    'trade',
    'bank',
    'gdp',
    'business',
    ' ent',
  ],
  environment: [
    'environment',
    'emission',
    'renewable',
    'wildlife',
    'pollution',
    'biodiversity',
    'carbon',
    'energy',
  ],
  world_politics: [
    'election',
    'parliament',
    'president',
    'prime minister',
    'government',
    'vote',
    'legislation',
    'policy',
  ],
  sports: [
    'football',
    'soccer',
    'olympic',
    'tennis',
    'cricket',
    'championship',
    'match',
    'league',
    'athlete',
  ],
  cybersecurity: [
    'cyber',
    'hack',
    'malware',
    'ransomware',
    'breach',
    'phishing',
    'vulnerability',
    'security flaw',
  ],
  ai_innovation: [
    'artificial intelligence',
    ' ai ',
    'machine learning',
    'chatgpt',
    'openai',
    'llm',
    'robot',
    'automation',
  ],
  disasters: [
    'earthquake',
    'tsunami',
    'wildfire',
    'disaster',
    'emergency',
    'evacuation',
    'landslide',
    'humanitarian',
    'casualty',
  ],
}

const REGION_KEYWORDS = {
  americas: [
    'united states',
    'u.s.',
    'usa',
    'america',
    'canada',
    'mexico',
    'brazil',
    'argentina',
    'washington',
    'ottawa',
    'latin america',
  ],
  europe: [
    'europe',
    'eu ',
    'uk ',
    'britain',
    'france',
    'germany',
    'italy',
    'spain',
    'ukraine',
    'russia',
    'london',
    'paris',
    'berlin',
    'brussels',
  ],
  africa: [
    'africa',
    'nigeria',
    'kenya',
    'egypt',
    'south africa',
    'ethiopia',
    'sudan',
    'ghana',
    'morocco',
  ],
  middle_east: [
    'israel',
    'gaza',
    'iran',
    'iraq',
    'syria',
    'saudi',
    'yemen',
    'lebanon',
    'qatar',
    'turkey',
    'middle east',
  ],
  asia_pacific: [
    'china',
    'japan',
    'india',
    'korea',
    'taiwan',
    'australia',
    'indonesia',
    'pakistan',
    'philippines',
    'vietnam',
    'asia',
    'pacific',
  ],
  bangladesh: [
    'bangladesh',
    'dhaka',
    'chittagong',
    'chattogram',
    'sylhet',
    'khulna',
    'rajshahi',
    'bengali',
    'bangla',
    'padma',
    'jamuna',
  ],
}

function hashId(url, title) {
  return createHash('sha256').update(`${url}|${title}`).digest('hex').slice(0, 16)
}

function inferCategory(text, fallback) {
  const hay = ` ${text.toLowerCase()} `
  let best = fallback
  let bestScore = 0
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
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

function inferRegion(text) {
  const hay = text.toLowerCase()
  let best = 'global'
  let bestScore = 0
  for (const [region, words] of Object.entries(REGION_KEYWORDS)) {
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

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'GlobeBriefNewsBot/1.0 (+https://github.com/)',
  },
})

async function fetchFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url)
    return (result.items ?? []).slice(0, 12).map((item) => {
      const titleRaw = item.title
      const title =
        (typeof titleRaw === 'string'
          ? titleRaw
          : Array.isArray(titleRaw)
            ? titleRaw.join(' ')
            : titleRaw?._ || titleRaw?.['#text'] || String(titleRaw ?? '')
        )
          .trim() || 'Untitled'
      const linkRaw = item.link || item.guid || feed.url
      const url = typeof linkRaw === 'string' ? linkRaw : String(linkRaw ?? feed.url)
      const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')
      const blob = `${title} ${summary}`
      return {
        id: hashId(url, title),
        title,
        url,
        source: feed.source,
        category: inferCategory(blob, feed.category),
        region: feed.region || inferRegion(blob),
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        summary: summary.slice(0, 420),
        image: item.enclosure?.url,
      }
    })
  } catch (err) {
    console.warn(`Feed failed: ${feed.source} — ${err.message}`)
    return []
  }
}

async function main() {
  const batches = await Promise.all(FEEDS.map(fetchFeed))
  const merged = batches.flat()

  const seen = new Set()
  const deduped = []
  for (const article of merged) {
    const key = article.url
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(article)
  }

  const byCategory = new Map()
  for (const article of deduped) {
    const list = byCategory.get(article.category) ?? []
    if (list.length < MAX_PER_CATEGORY) {
      list.push(article)
      byCategory.set(article.category, list)
    }
  }

  // Keep Bangladesh visible even when world_politics is already full.
  const reservedBd = deduped
    .filter((a) => a.region === 'bangladesh')
    .slice(0, 10)
  const reservedIds = new Set(reservedBd.map((a) => a.id))

  let articles = [
    ...reservedBd,
    ...[...byCategory.values()].flat().filter((a) => !reservedIds.has(a.id)),
  ]
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
  articles = articles.slice(0, MAX_TOTAL)

  const payload = {
    generatedAt: new Date().toISOString(),
    articles,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${articles.length} articles to ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
