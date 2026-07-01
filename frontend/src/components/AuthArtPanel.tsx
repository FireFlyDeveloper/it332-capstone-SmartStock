/**
 * AuthArtPanel — ambient brand surface rendered on the right pane at
 * desktop widths. Purely decorative; the parent should mark it
 * aria-hidden.
 *
 * Three floating stat tiles + one short tagline. Uses --radius-card,
 * --mono, and a local frosted-glass treatment that degrades under
 * prefers-reduced-transparency.
 *
 * Author: Hazel
 * Last touched: 2026-07-01
 */

import './AuthArtPanel.css'

interface Stat {
  num: string
  label: string
  className?: string
}

const STATS: Stat[] = [
  { num: '12', label: 'branches' },
  { num: '3.4k', label: 'SKUs tracked', className: 'auth-art__stat--offset' },
  { num: '98.2%', label: 'stock accuracy, 30d', className: 'auth-art__stat--bottom' },
]

export function AuthArtPanel() {
  return (
    <div className="auth-art">
      <div className="auth-art__grid" />
      <div className="auth-art__grain" />
      {STATS.map((s) => (
        <div
          key={s.label}
          className={`auth-art__stat ${s.className ?? ''}`.trim()}
        >
          <span className="auth-art__stat-num">{s.num}</span>
          <span className="auth-art__stat-label">{s.label}</span>
        </div>
      ))}
      <div className="auth-art__quote">
        <p>From receiving bay to delivery truck, one count.</p>
      </div>
    </div>
  )
}
