import type { AppTab } from '../types/news'

interface TabNavProps {
  tab: AppTab
  liveCount: number
  olderCount: number
  seenCount: number
  onChange: (tab: AppTab) => void
}

export function TabNav({
  tab,
  liveCount,
  olderCount,
  seenCount,
  onChange,
}: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="News sections">
      <button
        type="button"
        className={tab === 'live' ? 'tab active' : 'tab'}
        onClick={() => onChange('live')}
        aria-current={tab === 'live' ? 'page' : undefined}
      >
        Live News
        <span className="tab-count">{liveCount}</span>
      </button>
      <button
        type="button"
        className={tab === 'older' ? 'tab active' : 'tab'}
        onClick={() => onChange('older')}
        aria-current={tab === 'older' ? 'page' : undefined}
      >
        Older News
        <span className="tab-count">{olderCount}</span>
      </button>
      <button
        type="button"
        className={tab === 'seen' ? 'tab active' : 'tab'}
        onClick={() => onChange('seen')}
        aria-current={tab === 'seen' ? 'page' : undefined}
      >
        Seen
        <span className="tab-count">{seenCount}</span>
      </button>
    </nav>
  )
}
