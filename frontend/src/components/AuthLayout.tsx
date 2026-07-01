/**
 * AuthLayout — the asymmetric split shell used by LoginPage (and any
 * future auth surface — register, forgot-password, etc.).
 *
 * Pure layout. No state. Composes a form pane + an optional brand pane.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-01
 */

import type { ReactNode } from 'react'
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
      <section className="auth__form-pane">{form}</section>
      {art && (
        <aside className="auth__art-pane" aria-hidden="true">
          {art}
        </aside>
      )}
    </main>
  )
}
