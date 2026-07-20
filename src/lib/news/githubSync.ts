import type { NewsFeedFile } from '../../types/news'

const REPO = 'ZabulanaKakil/worldnews'
const FILE_PATH = 'public/data/news.json'
const TOKEN_KEY = 'globebrief_gh_token'

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
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  if (response.status === 404) return undefined
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Could not read news.json (${response.status}): ${err}`)
  }
  const data = (await response.json()) as { sha: string }
  return data.sha
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
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
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
