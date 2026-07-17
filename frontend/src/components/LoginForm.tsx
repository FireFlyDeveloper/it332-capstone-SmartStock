/**
 * LoginForm — email + password form, owns state, calls /auth/login.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-17
 *
 * Demo credential buttons only prefill the backend-seeded accounts; they do
 * not create local/demo tokens.
 */

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { loginRequest, type ApiError } from '../api'
import { useAuth } from './AuthContext'
import './LoginForm.css'

const DEMO_CREDENTIALS = [
  { label: 'Admin', email: 'admin@smartstock.local', password: 'admin123', role: 'admin' as const },
  { label: 'Staff', email: 'staff@smartstock.local', password: 'staff123', role: 'staff' as const },
] as const

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showDemoCard, setShowDemoCard] = useState(true)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    setSubmitting(true)
    try {
      const { token, user } = await loginRequest(email, password)
      login(token, user)
      toast.success('Signed in to SmartStock.')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Sign in failed. Check your email and password.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleForgot(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    toast.warning('Contact your admin to reset your password.')
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch {
      toast.error('Copy failed — your browser blocked clipboard access.')
    }
  }

  function fillDemoCredential(creds: { email: string; password: string }) {
    setEmail(creds.email)
    setPassword(creds.password)
    toast.info('Demo credentials filled in — press Sign in.')
  }

  return (
    <div className="login-form">
      <a className="login-form__brand" href="/" aria-label="SmartStock home">
        <span className="login-form__brand-mark" aria-hidden="true">SS</span>
        <span className="login-form__brand-name">SmartStock</span>
      </a>

      <header className="login-form__header">
        <h1 className="login-form__title">Sign in</h1>
        <p className="login-form__subtitle">
          Use your SmartStock work email. New here? Ask your admin for an invite.
        </p>
      </header>

      <form className="login-form__form" onSubmit={handleSubmit} noValidate>
        <div className="login-form__field">
          <label htmlFor="email" className="login-form__label">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            className="login-form__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="[email protected]"
          />
        </div>

        <div className="login-form__field">
          <div className="login-form__label-row">
            <label htmlFor="password" className="login-form__label">Password</label>
            <a className="login-form__link" href="#reset" onClick={handleForgot}>Forgot?</a>
          </div>
          <div className="login-form__input-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="login-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="login-form__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <div className="login-form__error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="login-form__submit"
          disabled={submitting}
        >
          {submitting ? (
            <span className="login-form__spinner" aria-hidden="true" />
          ) : null}
          <span>{submitting ? 'Signing in' : 'Sign in to SmartStock'}</span>
        </button>
      </form>

      {showDemoCard && (
        <aside className="login-form__demo" aria-label="Demo credentials">
          <div className="login-form__demo-head">
            <span className="login-form__demo-pill">Demo accounts</span>
            <span className="login-form__demo-title">Use one of these accounts</span>
            <button
              type="button"
              className="login-form__demo-close"
              onClick={() => setShowDemoCard(false)}
              aria-label="Dismiss demo credentials"
            >
              ×
            </button>
          </div>
          <ul className="login-form__demo-list">
            {DEMO_CREDENTIALS.map((c) => (
              <li key={c.email} className="login-form__demo-row">
                <div className="login-form__demo-meta">
                  <span className="login-form__demo-role">{c.label}</span>
                  <code className="login-form__demo-creds">
                    {c.email} · {c.password}
                  </code>
                </div>
                <div className="login-form__demo-actions">
                  <button
                    type="button"
                    className="login-form__demo-btn"
                    onClick={() => fillDemoCredential(c)}
                  >
                    Fill
                  </button>
                  <button
                    type="button"
                    className="login-form__demo-btn"
                    onClick={() => copyToClipboard(c.email, `${c.label} email`)}
                    aria-label={`Copy ${c.label} email`}
                  >
                    Copy email
                  </button>
                  <button
                    type="button"
                    className="login-form__demo-btn"
                    onClick={() => copyToClipboard(c.password, `${c.label} password`)}
                    aria-label={`Copy ${c.label} password`}
                  >
                    Copy password
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <footer className="login-form__meta">
        <span>Glassram Glass &amp; Aluminum Supply</span>
        <span className="login-form__meta-sep" aria-hidden="true">/</span>
        <span>Internal tool</span>
      </footer>
    </div>
  )
}
