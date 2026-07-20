import {
  categoryCounts,
  regionCounts,
  sourceCounts,
} from '../lib/news/stats'
import type { NewsArticle } from '../types/news'
import { CategoryChart } from './charts/CategoryChart'
import { RegionChart } from './charts/RegionChart'
import { SourceChart } from './charts/SourceChart'

interface VisualPanelProps {
  articles: NewsArticle[]
}

export function VisualPanel({ articles }: VisualPanelProps) {
  const categories = categoryCounts(articles)
  const regions = regionCounts(articles)
  const sources = sourceCounts(articles)

  return (
    <aside className="visual-panel" aria-label="Feed visuals">
      <section className="visual-card">
        <h2>Topics in view</h2>
        <p className="visual-sub">Share of stories by category</p>
        <CategoryChart data={categories} />
      </section>

      <section className="visual-card">
        <h2>Corners of the world</h2>
        <p className="visual-sub">Story volume by region</p>
        <RegionChart data={regions} />
      </section>

      <section className="visual-card">
        <h2>Sources</h2>
        <p className="visual-sub">Top outlets in this feed</p>
        <SourceChart data={sources} />
      </section>
    </aside>
  )
}
