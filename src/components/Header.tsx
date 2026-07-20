import { formatDateTime, formatRelativeTime } from '../lib/format'

interface HeaderProps {
  feedGeneratedAt: string | null
  lastRefreshedAt: string | null
  isRefreshing: boolean
  syncMessage?: string | null
  onRefresh: () => void
}

export function Header({
  feedGeneratedAt,
  lastRefreshedAt,
  isRefreshing,
  syncMessage,
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
          {syncMessage && <span className="sync-message">{syncMessage}</span>}
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Pulling RSS…' : 'Refresh feed'}
        </button>
      </div>
    </header>
  )
}
