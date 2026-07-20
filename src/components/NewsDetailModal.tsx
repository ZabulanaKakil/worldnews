import { useEffect } from 'react'
import { CATEGORY_MAP } from '../config/categories'
import { REGION_MAP } from '../config/regions'
import { formatDateTime, formatRelativeTime } from '../lib/format'
import type { NewsArticle } from '../types/news'

interface NewsDetailModalProps {
  article: NewsArticle | null
  onClose: () => void
  onMarkSeen?: (article: NewsArticle) => void
  isSeen?: boolean
}

export function NewsDetailModal({
  article,
  onClose,
  onMarkSeen,
  isSeen = false,
}: NewsDetailModalProps) {
  useEffect(() => {
    if (!article) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [article, onClose])

  if (!article) return null

  const category = CATEGORY_MAP[article.category]
  const region = REGION_MAP[article.region]

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-top">
          <span
            className="cat-pill"
            style={{ backgroundColor: category?.color ?? '#666' }}
          >
            {category?.label ?? article.category}
          </span>
          <span className="region-label">{region?.label ?? article.region}</span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <h2 id="news-detail-title" className="modal-title">
          {article.title}
        </h2>

        <p className="modal-meta">
          {article.source}
          <span aria-hidden="true"> · </span>
          <time dateTime={article.publishedAt}>
            {formatDateTime(article.publishedAt)} ({formatRelativeTime(article.publishedAt)})
          </time>
        </p>

        {article.image && (
          <img className="modal-image" src={article.image} alt="" loading="lazy" />
        )}

        <p className="modal-body">
          {article.summary || 'No summary available for this story.'}
        </p>

        <div className="modal-actions">
          <a
            className="btn-primary"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full story
          </a>
          {!isSeen && onMarkSeen && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onMarkSeen(article)
                onClose()
              }}
            >
              Mark seen
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
