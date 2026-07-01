/**
 * LoginForm — email + password form, owns state, calls /auth/login.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-01
 */

import { useState, type FormEvent } from 'react'
import { apiFetch } from '../api'
import { useAuth, type User } from './AuthContext'
import './LoginForm.css'

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      login(res.token, res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Try again.')
    } finally {
      setSubmitting(false)
    }
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
            <a className="login-form__link" href="#reset">Forgot?</a>
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

      <footer className="login-form__meta">
        <span>Glassram Glass &amp; Aluminum Supply</span>
        <span className="login-form__meta-sep" aria-hidden="true">/</span>
        <span>Internal tool</span>
      </footer>
    </div>
  )
}
