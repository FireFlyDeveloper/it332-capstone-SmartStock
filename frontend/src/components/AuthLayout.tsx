/**
 * AuthLayout - the asymmetric split shell used by LoginPage (and any
 * future auth surface - register, forgot-password, etc.).
 *
 * Pure layout. No state. Composes a form pane + an optional brand pane.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import './AuthLayout.css'

export function AuthLayout({
  form,
  art,
}: {
  form: ReactNode
  art?: ReactNode
}) {
  return (
    <main className="auth">
      <section className="auth__form-pane">
        <div className="auth__demo-badge" aria-label="Demo build indicator" title="Demo build - data is mock data.">
          <Sparkles className="auth__demo-icon" aria-hidden="true" />
          <span>Demo</span>
        </div>
        {form}
      </section>
      {art && (
        <aside className="auth__art-pane" aria-hidden="true">
          {art}
        </aside>
      )}
    </main>
  )
}
