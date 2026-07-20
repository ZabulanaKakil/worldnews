import { CATEGORY_MAP } from '../config/categories'
import { REGION_MAP } from '../config/regions'
import { formatDateTime, formatRelativeTime } from '../lib/format'
import type { NewsArticle } from '../types/news'

interface NewsCardProps {
  article: NewsArticle
  isNew: boolean
  isSeen?: boolean
  onDetails: (article: NewsArticle) => void
  onMarkSeen?: (article: NewsArticle) => void
  onUnmarkSeen?: (articleId: string) => void
}

export function NewsCard({
  article,
  isNew,
  isSeen = false,
  onDetails,
  onMarkSeen,
  onUnmarkSeen,
}: NewsCardProps) {
  const category = CATEGORY_MAP[article.category]
  const region = REGION_MAP[article.region]

  return (
    <article className={`news-card${isNew ? ' is-new' : ''}${isSeen ? ' is-seen' : ''}`}>
      <div className="news-card-top">
        <span
          className="cat-pill"
          style={{ backgroundColor: category?.color ?? '#666' }}
        >
          {category?.shortLabel ?? article.category}
        </span>
        <span className="region-label">{region?.label ?? article.region}</span>
        {isNew && !isSeen && <span className="new-badge">New</span>}
        {isSeen && <span className="seen-badge">Seen</span>}
      </div>

      <h3 className="news-title">{article.title}</h3>

      {article.summary && (
        <p className="news-summary">
          {article.summary.length > 160
            ? `${article.summary.slice(0, 160).trim()}…`
            : article.summary}
        </p>
      )}

      <footer className="news-meta">
        <span>{article.source}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)}>
          {formatRelativeTime(article.publishedAt)}
        </time>
      </footer>

      <div className="card-actions">
        <button type="button" className="btn-secondary" onClick={() => onDetails(article)}>
          More details
        </button>
        {isSeen ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onUnmarkSeen?.(article.id)}
          >
            Unmark seen
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onMarkSeen?.(article)}
          >
            Mark seen
          </button>
        )}
      </div>
    </article>
  )
}
