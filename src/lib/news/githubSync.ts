import type { NewsFeedFile } from '../../types/news'

const REPO = 'ZabulanaKakil/worldnews'
const FILE_PATH = 'public/data/news.json'
const TOKEN_KEY = 'globebrief_gh_token'
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}`

function normalizeToken(raw: string | null | undefined): string | null {
  const token = raw?.trim()
  if (!token) return null
  if (token === 'undefined' || token === 'null') return null
  return token
}

/** Session token wins so you can override a bad baked-in deploy token. */
export function getToken(): string | null {
  try {
    const saved = normalizeToken(sessionStorage.getItem(TOKEN_KEY))
    if (saved) return saved
  } catch {
    // ignore
  }
  return normalizeToken(import.meta.env.VITE_GITHUB_TOKEN)
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

export function isLikelyGitHubToken(token: string): boolean {
  const t = token.trim()
  return /^(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$/i.test(t)
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function authError(status: number, context: string): Error {
  if (status === 401) {
    return new Error(
      'GitHub token rejected (401 Bad credentials). Open GitHub sync below, paste a new fine-grained PAT (Contents + Actions: Read and write), Save, then Retry.',
    )
  }
  if (status === 403) {
    return new Error(
      `GitHub denied access (403) while ${context}. Your PAT needs Contents + Actions (Read and write) on ${REPO}.`,
    )
  }
  return new Error(`GitHub API error (${status}) while ${context}.`)
}

/** Quick check that the token is valid before starting a workflow. */
export async function verifyGitHubToken(token: string): Promise<void> {
  const normalized = normalizeToken(token)
  if (!normalized) {
    throw new Error('Token is empty.')
  }
  if (!isLikelyGitHubToken(normalized)) {
    throw new Error('Token format looks wrong. Use a fine-grained PAT (github_pat_…) or classic ghp_….')
  }

  const response = await fetch('https://api.github.com/user', {
    headers: authHeaders(normalized),
  })

  if (!response.ok) {
    throw authError(response.status, 'verifying token')
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
    throw authError(response.status, 'reading news.json')
  }
  const data = (await response.json()) as { sha: string }
  return data.sha
}

/** Starts the server-side RSS fetch workflow (no browser CORS issues). */
export async function triggerFetchNewsWorkflow(): Promise<void> {
  const token = getToken()
  if (!token) {
    throw new Error(
      'No GitHub token. Open GitHub sync below and paste a fine-grained PAT with Contents + Actions (Read and write).',
    )
  }

  await verifyGitHubToken(token)

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
    if (response.status === 404) {
      throw new Error('fetch-news.yml workflow not found on main branch.')
    }
    throw authError(response.status, 'starting RSS workflow')
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
    throw new Error('No GitHub token configured.')
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
    throw authError(response.status, 'committing news.json')
  }
}

export function isAuthError(message: string): boolean {
  return /401|403|token|credentials/i.test(message)
}
