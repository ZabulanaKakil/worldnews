import type { NewsArticle, OlderBatch } from '../types/news'
import { formatDateTime } from '../lib/format'
import { NewsCard } from './NewsCard'

interface SharedActions {
  onDetails: (article: NewsArticle) => void
  onMarkSeen?: (article: NewsArticle) => void
  onUnmarkSeen?: (articleId: string) => void
}

interface ListFeedProps extends SharedActions {
  mode: 'live' | 'seen'
  articles: NewsArticle[]
  newIds: Set<string>
  emptyMessage: string
  isSeenList?: boolean
}

interface OlderFeedProps extends SharedActions {
  mode: 'older'
  batches: OlderBatch[]
  emptyMessage: string
}

type NewsFeedProps = ListFeedProps | OlderFeedProps

export function NewsFeed(props: NewsFeedProps) {
  if (props.mode === 'older') {
    if (props.batches.length === 0) {
      return <p className="empty-state">{props.emptyMessage}</p>
    }

    return (
      <div className="older-stack">
        {props.batches.map((batch) => (
          <section key={batch.id} className="older-batch">
            <h3 className="batch-heading">
              Archived {formatDateTime(batch.archivedAt)}
              <span className="tab-count">{batch.articles.length}</span>
            </h3>
            <div className="news-grid">
              {batch.articles.map((article) => (
                <NewsCard
                  key={`${batch.id}-${article.id}`}
                  article={article}
                  isNew={false}
                  onDetails={props.onDetails}
                  onMarkSeen={props.onMarkSeen}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  if (props.articles.length === 0) {
    return <p className="empty-state">{props.emptyMessage}</p>
  }

  return (
    <div className="news-grid">
      {props.articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          isNew={props.newIds.has(article.id)}
          isSeen={props.isSeenList}
          onDetails={props.onDetails}
          onMarkSeen={props.onMarkSeen}
          onUnmarkSeen={props.onUnmarkSeen}
        />
      ))}
    </div>
  )
}
