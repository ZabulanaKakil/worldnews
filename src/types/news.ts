export type CategoryId =
  | 'war_conflict'
  | 'diplomacy'
  | 'weather_climate'
  | 'technology'
  | 'creativity_arts'
  | 'economy_business'
  | 'environment'
  | 'world_politics'
  | 'sports'
  | 'cybersecurity'
  | 'ai_innovation'
  | 'disasters'

export type RegionId =
  | 'americas'
  | 'europe'
  | 'africa'
  | 'middle_east'
  | 'asia_pacific'
  | 'bangladesh'
  | 'global'

export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  category: CategoryId
  region: RegionId
  publishedAt: string
  summary: string
  image?: string
}

export interface NewsFeedFile {
  generatedAt: string
  articles: NewsArticle[]
}

export interface OlderBatch {
  id: string
  archivedAt: string
  articles: NewsArticle[]
}

export type AppTab = 'live' | 'older' | 'seen'

export interface FeedState {
  live: NewsArticle[]
  older: OlderBatch[]
  seen: NewsArticle[]
  newIds: string[]
  feedGeneratedAt: string | null
  lastRefreshedAt: string | null
}
