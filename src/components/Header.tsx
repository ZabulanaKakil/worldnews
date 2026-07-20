import { formatDateTime, formatRelativeTime } from '../lib/format'

interface HeaderProps {
  feedGeneratedAt: string | null
  lastRefreshedAt: string | null
  isRefreshing: boolean
  onRefresh: () => void
}

export function Header({
  feedGeneratedAt,
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="brand-block">
        <p className="brand-mark">GlobeBrief</p>
        <p className="brand-tag">World news by topic — visual desk</p>
      </div>

      <div className="header-actions">
        <div className="refresh-meta" aria-live="polite">
          <span>
            Feed {formatRelativeTime(feedGeneratedAt)}
            <span className="meta-sep">·</span>
            {formatDateTime(feedGeneratedAt)}
          </span>
          <span>
            You refreshed {formatRelativeTime(lastRefreshedAt)}
          </span>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh feed'}
        </button>
      </div>
    </header>
  )
}
