import { useState } from 'react'
import {
  clearGitHubToken,
  hasGitHubToken,
  saveGitHubToken,
} from '../lib/news/githubSync'

export function GitHubSettings() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [configured, setConfigured] = useState(hasGitHubToken())

  return (
    <div className="github-settings">
      <button type="button" className="btn-ghost" onClick={() => setOpen((v) => !v)}>
        GitHub sync {configured ? '· ready' : '· setup'}
      </button>

      {open && (
        <div className="settings-panel">
          <p>
            Refresh pulls live RSS, then commits <code>public/data/news.json</code> to{' '}
            <strong>main</strong> on GitHub. Deploy runs automatically after that.
          </p>
          <label className="settings-label" htmlFor="gh-token">
            GitHub token (optional if built-in token is configured)
          </label>
          <input
            id="gh-token"
            className="settings-input"
            type="password"
            placeholder="ghp_… fine-grained PAT with Contents: Read and write"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
          <div className="settings-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!token.trim()) return
                saveGitHubToken(token.trim())
                setConfigured(true)
                setToken('')
              }}
            >
              Save token
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                clearGitHubToken()
                setConfigured(hasGitHubToken())
              }}
            >
              Clear saved token
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
