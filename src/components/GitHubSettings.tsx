import { useEffect, useState } from 'react'
import {
  clearGitHubToken,
  getToken,
  hasGitHubToken,
  isLikelyGitHubToken,
  saveGitHubToken,
  verifyGitHubToken,
} from '../lib/news/githubSync'

interface GitHubSettingsProps {
  forceOpen?: boolean
}

export function GitHubSettings({ forceOpen = false }: GitHubSettingsProps) {
  const [open, setOpen] = useState(forceOpen || !hasGitHubToken())
  const [token, setToken] = useState('')
  const [configured, setConfigured] = useState(hasGitHubToken())
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  useEffect(() => {
    setConfigured(hasGitHubToken())
  }, [open, status])

  async function handleSave() {
    const value = token.trim()
    if (!value) return
    if (!isLikelyGitHubToken(value)) {
      setStatus('Token format looks wrong. Paste the full github_pat_… or ghp_… string.')
      return
    }

    setBusy(true)
    setStatus('Checking token with GitHub…')
    try {
      await verifyGitHubToken(value)
      saveGitHubToken(value)
      setToken('')
      setStatus('Token verified and saved for this browser session.')
      setConfigured(true)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Token verification failed.')
    } finally {
      setBusy(false)
    }
  }

  function handleClear() {
    clearGitHubToken()
    setConfigured(hasGitHubToken())
    setStatus(getToken() ? 'Cleared saved token. Using deploy token if present.' : 'Token cleared.')
  }

  return (
    <div className="github-settings">
      <button type="button" className="btn-ghost" onClick={() => setOpen((v) => !v)}>
        GitHub sync {configured ? '· ready' : '· required for Refresh'}
      </button>

      {open && (
        <div className="settings-panel">
          <p>
            <strong>Refresh requires a GitHub token.</strong> It starts the Fetch news feed
            Action on GitHub (server-side RSS), then loads the updated{' '}
            <code>news.json</code>.
          </p>
          <ol className="settings-steps">
            <li>
              Create a <strong>fine-grained PAT</strong> at GitHub → Settings → Developer settings
            </li>
            <li>
              Repository access: <strong>worldnews</strong> only
            </li>
            <li>
              Permissions: <strong>Contents</strong> and <strong>Actions</strong> → Read and write
            </li>
            <li>Paste below → Save → Retry Refresh</li>
          </ol>
          <label className="settings-label" htmlFor="gh-token">
            GitHub personal access token
          </label>
          <input
            id="gh-token"
            className="settings-input"
            type="password"
            placeholder="github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
          <div className="settings-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void handleSave()}
              disabled={busy || !token.trim()}
            >
              {busy ? 'Verifying…' : 'Save token'}
            </button>
            <button type="button" className="btn-ghost" onClick={handleClear}>
              Clear saved token
            </button>
          </div>
          {status && <p className="settings-status">{status}</p>}
        </div>
      )}
    </div>
  )
}
