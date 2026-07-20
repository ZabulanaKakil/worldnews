import type { NewsFeedFile } from '../../types/news'

const REPO = 'ZabulanaKakil/worldnews'
const FILE_PATH = 'public/data/news.json'
const TOKEN_KEY = 'globebrief_gh_token'
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}`

function getToken(): string | null {
  const fromEnv = import.meta.env.VITE_GITHUB_TOKEN
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function hasGitHubToken(): boolean {
  return getToken() !== null
}

export function saveGitHubToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token.trim())
}

export function clearGitHubToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

async function getExistingSha(token: string): Promise<string | undefined> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=main`,
    { headers: authHeaders(token) },
  )
  if (response.status === 404) return undefined
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Could not read news.json (${response.status}): ${err}`)
  }
  const data = (await response.json()) as { sha: string }
  return data.sha
}

/** Starts the server-side RSS fetch workflow (no browser CORS issues). */
export async function triggerFetchNewsWorkflow(): Promise<void> {
  const token = getToken()
  if (!token) {
    throw new Error(
      'No GitHub token. Add repo secret GH_PAGES_COMMIT_TOKEN, then redeploy — or paste a token in GitHub sync.',
    )
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/fetch-news.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  )

  if (!response.ok) {
    const err = await response.text()
    if (response.status === 403 || response.status === 404) {
      throw new Error(
        'Token cannot start Actions. Use a fine-grained PAT with Contents + Actions (Read and write).',
      )
    }
    throw new Error(`Could not start RSS workflow (${response.status}): ${err}`)
  }
}

/** Poll main branch until fetch-news.yml commits a fresh news.json. */
export async function pollNewsFeedFromGitHub(
  previousGeneratedAt: string | null,
  onProgress?: (message: string) => void,
): Promise<NewsFeedFile> {
  const deadline = Date.now() + 180_000

  while (Date.now() < deadline) {
    onProgress?.('GitHub is pulling RSS feeds…')

    try {
      const response = await fetch(`${RAW_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (response.ok) {
        const data = (await response.json()) as NewsFeedFile
        const isNew =
          data.generatedAt &&
          data.generatedAt !== previousGeneratedAt &&
          Array.isArray(data.articles) &&
          data.articles.length > 0

        if (isNew) {
          return data
        }
      }
    } catch {
      // keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error(
    'Timed out waiting for RSS update. Open GitHub → Actions → Fetch news feed to check for errors.',
  )
}

export async function commitNewsFeedToGitHub(feed: NewsFeedFile): Promise<void> {
  const token = getToken()
  if (!token) {
    throw new Error(
      'No GitHub token. Add repo secret GH_PAGES_COMMIT_TOKEN for deploy, or paste a token in Settings.',
    )
  }

  const json = `${JSON.stringify(feed, null, 2)}\n`
  const sha = await getExistingSha(token)

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'chore: update news feed from Refresh',
        content: toBase64Utf8(json),
        branch: 'main',
        ...(sha ? { sha } : {}),
      }),
    },
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub commit failed (${response.status}): ${err}`)
  }
}
