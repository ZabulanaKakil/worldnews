import { CATEGORIES } from '../../config/categories'
import { REGIONS } from '../../config/regions'
import type { NewsArticle } from '../../types/news'

export interface NamedCount {
  id: string
  name: string
  value: number
  color: string
}

export function categoryCounts(articles: NewsArticle[]): NamedCount[] {
  const map = new Map<string, number>()
  for (const a of articles) {
    map.set(a.category, (map.get(a.category) ?? 0) + 1)
  }
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: c.shortLabel,
    value: map.get(c.id) ?? 0,
    color: c.color,
  })).filter((c) => c.value > 0)
}

export function regionCounts(articles: NewsArticle[]): NamedCount[] {
  const map = new Map<string, number>()
  for (const a of articles) {
    map.set(a.region, (map.get(a.region) ?? 0) + 1)
  }
  return REGIONS.map((r) => ({
    id: r.id,
    name: r.label,
    value: map.get(r.id) ?? 0,
    color: r.color,
  })).filter((r) => r.value > 0)
}

export function sourceCounts(articles: NewsArticle[]): NamedCount[] {
  const map = new Map<string, number>()
  for (const a of articles) {
    map.set(a.source, (map.get(a.source) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({
      id: name,
      name,
      value,
      color: '#2f7d7a',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}
