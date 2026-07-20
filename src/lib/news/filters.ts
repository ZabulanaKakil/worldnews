import type { CategoryId, NewsArticle, RegionId } from '../../types/news'

export function filterArticles(
  articles: NewsArticle[],
  category: CategoryId | 'all',
  region: RegionId | 'all',
): NewsArticle[] {
  return articles.filter((article) => {
    const catOk = category === 'all' || article.category === category
    const regionOk = region === 'all' || article.region === region
    return catOk && regionOk
  })
}

export function sortByNewest(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}
